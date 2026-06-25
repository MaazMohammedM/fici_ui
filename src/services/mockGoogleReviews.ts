// Mock Google Reviews data for fallback when API fails
import type { GoogleReview, GooglePlaceDetails } from '../types/google-reviews';

export const mockReviews: GoogleReview[] = [
  {
    author_name: "Sarah Johnson",
    author_url: "https://www.google.com/maps/contrib/...",
    language: "en",
    profile_photo_url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjI0IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5TQTwvdGV4dD4KPC9zdmc+",
    rating: 5,
    relative_time_description: "a week ago",
    text: "Absolutely fantastic service! The team went above and beyond to help me find exactly what I was looking for. Highly recommend!",
    time: Date.now() - (7 * 24 * 60 * 60 * 1000)
  },
  {
    author_name: "Michael Chen",
    author_url: "https://www.google.com/maps/contrib/...",
    language: "en",
    profile_photo_url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjI0IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5NQzwvdGV4dD4KPC9zdmc+",
    rating: 4,
    relative_time_description: "2 weeks ago",
    text: "Great experience overall. Product quality was excellent and delivery was on time. Customer service was very responsive to my questions.",
    time: Date.now() - (14 * 24 * 60 * 60 * 1000)
  },
  {
    author_name: "Emily Rodriguez",
    author_url: "https://www.google.com/maps/contrib/...",
    language: "en",
    profile_photo_url: "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDgiIGhlaWdodD0iNDgiIHZpZXdCb3g9IjAgMCA0OCA0OCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjQ4IiBoZWlnaHQ9IjQ4IiBmaWxsPSIjMDAwMDAwIi8+Cjx0ZXh0IHg9IjI0IiB5PSIzMCIgZm9udC1mYW1pbHk9IkFyaWFsIiBmb250LXNpemU9IjE2IiBmaWxsPSIjRkZGRkZGIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIj5FUjwvdGV4dD4KPC9zdmc+",
    rating: 5,
    relative_time_description: "a month ago",
    text: "I've been a customer for over a year and the quality has always been consistent. The attention to detail and customer care is outstanding.",
    time: Date.now() - (30 * 24 * 60 * 60 * 1000)
  }
];

export const mockPlaceDetails: GooglePlaceDetails = {
  place_id: "mock-place-id",
  name: "FiCi Shoes by NMF International",
  rating: 4.7,
  reviews: mockReviews,
  user_ratings_total: 127,
  formatted_address: "Ambur, Tamil Nadu, India",
  formatted_phone_number: "+91 98765 43210",
  website: "https://www.ficishoes.com"
};

export const getMockGoogleReviews = (): Promise<GooglePlaceDetails> => {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      resolve(mockPlaceDetails);
    }, 500);
  });
};
