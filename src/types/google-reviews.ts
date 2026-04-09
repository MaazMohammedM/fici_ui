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

export interface GoogleReviewsResponse {
  result: GooglePlaceDetails;
  status: string;
  html_attributions?: string[];
  next_page_token?: string;
}

export interface UseGoogleReviewsOptions {
  placeId?: string;
  maxReviews?: number;
  minRating?: number;
  useFallback?: boolean;
}

export interface UseGoogleReviewsReturn {
  reviews: GoogleReview[];
  placeDetails: GooglePlaceDetails | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}
