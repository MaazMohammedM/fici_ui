// Backend proxy service for Google Places API
// This should be implemented in your backend (Node.js, Python, etc.)

export interface GooglePlacesResponse {
  result: any;
  status: string;
  html_attributions?: string[];
  next_page_token?: string;
}

export const fetchGoogleReviews = async (
  placeId: string,
  apiKey: string
): Promise<GooglePlacesResponse> => {
  try {
    // Call your backend endpoint instead of Google API directly
    const response = await fetch('/api/google-places/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ placeId }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
};
