// Google Places Demo Key Service
// Uses Google's demo key for testing without billing

const GOOGLE_DEMO_KEY = 'AIzaSyB41DRUbKWJHPxaFjMAwdrzWzbVKartNGg'; // Official demo key from Google docs

export const useGoogleDemoKey = () => {
  return {
    apiKey: GOOGLE_DEMO_KEY,
    loadGoogleMapsScript: async (): Promise<void> => {
      if (window.google?.maps) {
        return Promise.resolve();
      }

      return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_DEMO_KEY}&libraries=places`;
        script.async = true;
        script.defer = true;
        
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Google Maps demo script'));
        
        document.head.appendChild(script);
      });
    },
    
    fetchPlaceDetails: async (placeId: string) => {
      if (!window.google?.maps) {
        throw new Error('Google Maps API not loaded');
      }

      try {
        // Use modern importLibrary approach
        const { Place } = await window.google.maps.importLibrary('places');
        
        const place = new Place({ id: placeId });
        const result = await place.fetchFields({
          fields: ['displayName', 'rating', 'reviews', 'userRatingCount', 'formattedAddress']
        });

        return {
          place_id: placeId,
          name: result.displayName.text,
          rating: result.rating,
          reviews: result.reviews || [],
          user_ratings_total: result.userRatingCount,
          formatted_address: result.formattedAddress
        };
      } catch (error) {
        throw error;
      }
    }
  };
};
