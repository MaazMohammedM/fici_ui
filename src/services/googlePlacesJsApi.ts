// Google Places JavaScript API service
// This uses Google's official JavaScript SDK which handles CORS automatically

// Global interfaces for Google Maps API
declare global {
  interface Window {
    google: {
      maps: {
        places: {
          PlacesService: any;
          PlacesServiceStatus: {
            OK: string;
            ZERO_RESULTS: string;
            NOT_FOUND: string;
            INVALID_REQUEST: string;
          };
          Place: any;
        };
        importLibrary: (library: string) => Promise<any>;
      };
    };
  }
}

// Global variables to track script loading
let isScriptLoading = false;
let isScriptLoaded = false;
let loadPromise: Promise<void> | null = null;

// Interfaces for Google Reviews data
export interface GoogleReview {
  author_name: string;
  author_url: string;
  language: string;
  profile_photo_url: string;
  rating: number;
  relative_time_description: string;
  text: string;
  time: number;
}

export interface GooglePlaceDetails {
  place_id: string;
  name: string;
  rating: number;
  reviews: GoogleReview[];
  user_ratings_total: number;
  formatted_address?: string;
  formatted_phone_number?: string;
  website?: string;
}

export const loadGoogleMapsScript = (apiKey: string): Promise<void> => {
  // Return existing promise if already loading
  if (loadPromise) {
    return loadPromise;
  }

  // Return resolved promise if already loaded
  if (isScriptLoaded && window.google?.maps) {
    return Promise.resolve();
  }

  // Create new loading promise
  loadPromise = new Promise((resolve, reject) => {
    isScriptLoading = true;

    // Check if script already exists in DOM
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      const checkLoaded = () => {
        if (window.google?.maps) {
          isScriptLoaded = true;
          isScriptLoading = false;
          resolve();
        } else {
          setTimeout(checkLoaded, 100);
        }
      };
      checkLoaded();
      return;
    }

    // Use Google's recommended bootstrap loading pattern
    (window as any).googleMapsCallback = () => {
      isScriptLoaded = true;
      isScriptLoading = false;
      resolve();
    };

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=googleMapsCallback`;
    script.async = true;
    script.defer = true;
    script.crossOrigin = 'anonymous';
    
    script.onerror = () => {
      isScriptLoading = false;
      loadPromise = null;
      reject(new Error('Failed to load Google Maps script'));
    };
    
    document.head.appendChild(script);
  });

  return loadPromise;
};

export const fetchGooglePlacesReviews = async (
  placeId: string
): Promise<GooglePlaceDetails> => {
  
  if (!window.google?.maps) {
    console.error('❌ Google Maps API not loaded on window object');
    throw new Error('Google Maps API not loaded');
  }


  try {
    // Use the modern Place class approach as per Google's documentation
    const { Place } = await window.google.maps.importLibrary('places');
    
    // Create a Place instance with the place ID
    const place = new Place({ id: placeId });
    
    // Request the fields we need using the modern fetchFields method
    const fields = [
      'displayName',
      'rating',
      'reviews',
      'userRatingCount',
      'formattedAddress',
      'nationalPhoneNumber',
      'websiteURI'
    ];
    
    const result = await place.fetchFields({ fields });

    // The modern Place API returns the place object directly
    // Extract the actual place data from the result
    const placeData = result.place || result;

    // Convert the modern Place format to our expected format
    const placeDetails: GooglePlaceDetails = {
      place_id: placeId,
      name: placeData.displayName?.text || placeData.name || placeData.formattedAddress || 'Unknown Place',
      rating: placeData.rating || 0,
      reviews: (placeData.reviews || []).map((review: any) => ({
        author_name: review.authorAttribution?.displayName || review.author_name || 'Anonymous',
        author_url: review.authorAttribution?.uri || review.author_url || '#',
        language: review.language || 'en',
        profile_photo_url: review.authorAttribution?.photoURI || review.profile_photo_url || '',
        rating: review.rating || 0,
        relative_time_description: review.relativeTimeDescription || review.relative_time_description || '',
        text: review.originalText?.text || review.text || '',
        time: review.publishTime || review.time || Date.now()
      })),
      user_ratings_total: placeData.userRatingCount || placeData.user_ratings_total || 0,
      formatted_address: placeData.formattedAddress || placeData.adrAddress,
      formatted_phone_number: placeData.nationalPhoneNumber || placeData.formattedPhoneNumber,
      website: placeData.websiteURI || placeData.website
    };


    return placeDetails;
    
  } catch (error) {
    console.error('❌ Modern Place API failed:', error);
    
    // Only try legacy fallback if explicitly needed
    try {
      const { PlacesService } = await window.google.maps.importLibrary('places');
      
      const service = new PlacesService(document.createElement('div'));
      
      const request = {
        placeId,
        fields: [
          'name',
          'rating', 
          'reviews',
          'user_ratings_total',
          'formatted_address',
          'formatted_phone_number',
          'website'
        ]
      };

      return new Promise((resolve, reject) => {
        service.getDetails(request, (result: GooglePlaceDetails, status: string) => {
          
          if (status === 'OK') {
            resolve(result);
          } else {
            console.error('❌ Legacy API error:', status);
            reject(new Error(`Google Places API error: ${status}`));
          }
        });
      });
    } catch (legacyError) {
      console.error('❌ Both modern and legacy APIs failed:', { modernError: error, legacyError });
      throw new Error(`Failed to fetch place details. Modern API error: ${error}`);
    }
  }
};
