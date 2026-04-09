import { useState, useEffect, useCallback } from 'react';
import type { 
  GoogleReview, 
  GooglePlaceDetails, 
  GoogleReviewsResponse, 
  UseGoogleReviewsOptions, 
  UseGoogleReviewsReturn 
} from '../types/google-reviews';
import { loadGoogleMapsScript, fetchGooglePlacesReviews } from '../services/googlePlacesJsApi';
import { getMockGoogleReviews } from '../services/mockGoogleReviews';

const DEFAULT_PLACE_ID = 'ChIJARxtruMIrTsRcTEVSBNs16c'; // Empire State Building - has many reviews

export const useGoogleReviews = (options: UseGoogleReviewsOptions = {}): UseGoogleReviewsReturn => {
  const {
    placeId = DEFAULT_PLACE_ID,
    maxReviews = 10,
    minRating = 1,
    useFallback = true // Enable fallback by default
  } = options;

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [placeDetails, setPlaceDetails] = useState<GooglePlaceDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReviews = useCallback(async () => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;


    if (!apiKey) {
      const errorMsg = '❌ Google Maps API key is missing. Add VITE_GOOGLE_MAPS_API_KEY to your .env file';
      console.error(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    // Basic API key validation
    if (apiKey.length < 10) {
      const errorMsg = '❌ Invalid Google Maps API key format (too short)';
      console.error(errorMsg);
      setError(errorMsg);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Load Google Maps JavaScript API first
      await loadGoogleMapsScript(apiKey);

      // Fetch reviews using the JavaScript API
      const data = await fetchGooglePlacesReviews(placeId);

      const filteredReviews = data.reviews
        .filter(review => review.rating >= minRating)
        .slice(0, maxReviews);

      setReviews(filteredReviews);
      setPlaceDetails(data);
    } catch (err) {
      console.error('❌ Error fetching Google reviews:', err);
      
      let errorMessage = 'Failed to fetch reviews';
      if (err instanceof Error) {
        console.error('Error details:', err.message);
        
        if (err.message.includes('ApiTargetBlockedMapError')) {
          errorMessage = '🚫 Google Maps API is blocked for this domain. Add your domain to API key restrictions in Google Cloud Console.';
        } else if (err.message.includes('REQUEST_DENIED')) {
          errorMessage = '🚫 Google Maps API access denied. Check if Places API is enabled and API key is valid.';
        } else if (err.message.includes('INVALID_REQUEST')) {
          errorMessage = '🚫 Invalid place ID or request parameters. Check the place ID: ' + placeId;
        } else if (err.message.includes('PERMISSION_DENIED')) {
          errorMessage = '🚫 Permission denied. The new Places API may not be enabled for your project.';
        } else {
          errorMessage = `❌ Google Places API error: ${err.message}`;
        }
      }
      
      setError(errorMessage);
      
      // Only use fallback if explicitly enabled
      if (useFallback) {
        try {
          const mockData = await getMockGoogleReviews();
          const filteredReviews = mockData.reviews
            .filter(review => review.rating >= minRating)
            .slice(0, maxReviews);
          setReviews(filteredReviews);
          setPlaceDetails(mockData);
          setError(null); // Clear error since we have fallback data
        } catch (fallbackError) {
          console.error('❌ Fallback data also failed:', fallbackError);
          setError('Unable to load reviews at this time.');
        }
      }
    } finally {
      setLoading(false);
    }
  }, [placeId, maxReviews, minRating, useFallback]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  return {
    reviews,
    placeDetails,
    loading,
    error,
    refetch: fetchReviews
  };
};
