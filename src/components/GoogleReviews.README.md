# Google Reviews Component

A flexible Google Reviews component that supports multiple data sources and graceful fallbacks.

## Features

- ✅ **Modern Google Places API** - Uses the new `google.maps.importLibrary()` approach
- ✅ **Legacy API Fallback** - Automatically falls back to PlacesService if needed
- ✅ **Mock Data Support** - Beautiful mock reviews for development/testing
- ✅ **Zero Warnings** - Clean console with proper async loading
- ✅ **TypeScript Support** - Full type safety
- ✅ **Responsive Design** - Works on all devices

## Environment Variables

Control the behavior with these environment variables:

```bash
# Use mock data (default in development)
VITE_USE_MOCK_REVIEWS=true

# Force real API calls
VITE_USE_MOCK_REVIEWS=false

# Use Google's demo key (for testing)
VITE_USE_DEMO_KEY=true

# Your own Google Maps API key
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
```

## Data Sources Priority

1. **Mock Data** (Development/When enabled)
2. **Real Google API** (Production with fallback)
3. **Fallback to Mock** (If API fails)

## Setup Instructions

### Option 1: Use Mock Data (Easiest)
```bash
# No setup needed - works out of the box!
VITE_USE_MOCK_REVIEWS=true
```

### Option 2: Use Google Demo Key
```bash
VITE_USE_DEMO_KEY=true
VITE_USE_MOCK_REVIEWS=false
```

### Option 3: Use Your Own API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Places API" 
3. Create an API key
4. Add your domain to authorized referrers
5. Set environment variable:
```bash
VITE_GOOGLE_MAPS_API_KEY=your_key_here
VITE_USE_MOCK_REVIEWS=false
```

## Usage

```tsx
import GoogleReviews from './components/GoogleReviews';

function App() {
  return <GoogleReviews />;
}
```

## Customization

The component automatically:
- Filters reviews by minimum rating (default: 1+ stars)
- Limits number of reviews (default: 10 reviews)
- Uses mock data for FiCi Shoes business
- Handles loading and error states

## Troubleshooting

- **ApiTargetBlockedMapError**: Add your domain to API key restrictions
- **No reviews showing**: Check that Places API is enabled
- **Console warnings**: Use mock data or check API key setup
