import { useState, useEffect } from 'react';
import type { 
  GoogleReview, 
  GooglePlaceDetails, 
  UseGoogleReviewsOptions, 
  UseGoogleReviewsReturn 
} from '../types/google-reviews';
import { getMockGoogleReviews } from '../services/mockGoogleReviews';

// Simple hook that only uses mock data - no API calls
export const useMockGoogleReviews = (options: UseGoogleReviewsOptions = {}): UseGoogleReviewsReturn => {
  const {
    maxReviews = 10,
    minRating = 1
  } = options;

  const [reviews, setReviews] = useState<GoogleReview[]>([]);
  const [placeDetails, setPlaceDetails] = useState<GooglePlaceDetails | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadMockData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Simulate network delay for better UX
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockData = await getMockGoogleReviews();
        
        const filteredReviews = mockData.reviews
          .filter(review => review.rating >= minRating)
          .slice(0, maxReviews);

        setReviews(filteredReviews);
        setPlaceDetails(mockData);
      } catch (err) {
        console.error('Error loading mock reviews:', err);
        setError('Failed to load reviews');
      } finally {
        setLoading(false);
      }
    };

    loadMockData();
  }, [maxReviews, minRating]);

  const refetch = async () => {
    // Simulate refetch with new data
    setLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));
    
    try {
      const mockData = await getMockGoogleReviews();
      const filteredReviews = mockData.reviews
        .filter(review => review.rating >= minRating)
        .slice(0, maxReviews);
      
      setReviews(filteredReviews);
      setPlaceDetails(mockData);
      setError(null);
    } catch (err) {
      setError('Failed to refresh reviews');
    } finally {
      setLoading(false);
    }
  };

  return {
    reviews,
    placeDetails,
    loading,
    error,
    refetch
  };
};
