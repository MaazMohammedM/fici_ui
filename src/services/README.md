# Google Maps JavaScript API Implementation

This implementation follows Google's official best practices for the Maps JavaScript API and modern Place class.

## 🏗️ Architecture

### Modern Approach (2025+)
- ✅ **Place Class**: Uses the new `Place` class from `google.maps.importLibrary('places')`
- ✅ **Promises**: Modern Promise-based async/await patterns
- ✅ **Dynamic Import**: Uses `importLibrary()` for optimal loading
- ✅ **Bootstrap Loading**: Proper callback-based script loading

### Legacy Fallback
- 🔄 **PlacesService**: Fallback to legacy API if needed
- 🔄 **Backward Compatibility**: Ensures functionality across API versions

## 📁 File Structure

```
src/
├── services/
│   ├── googlePlacesJsApi.ts     # Main API service (modern Place class)
│   ├── googlePlacesDemo.ts      # Demo key service
│   └── mockGoogleReviews.ts     # Mock data fallback
├── hooks/
│   ├── useGoogleReviews.ts      # Main hook with real API
│   └── useMockGoogleReviews.ts  # Mock-only hook
├── components/
│   ├── GoogleReviews.tsx        # Main component
│   ├── GoogleReviewsDebug.tsx   # Debug panel
│   └── GoogleMapsTest.tsx       # API testing component
└── types/
    └── google-reviews.ts        # TypeScript definitions
```

## 🔧 Key Features

### 1. Modern Place Class Usage
```typescript
// Load Places library
const { Place } = await google.maps.importLibrary('places');

// Create Place instance
const place = new Place({ id: placeId });

// Fetch fields using modern method
const result = await place.fetchFields({ fields });
```

### 2. Proper Script Loading
```typescript
// Bootstrap loading with callback
script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=googleMapsCallback`;
```

### 3. Comprehensive Error Handling
- Detailed console logging with emojis
- User-friendly error messages
- Graceful fallback to mock data
- Debug panel for troubleshooting

### 4. Environment Control
```bash
# Force real API calls
VITE_USE_MOCK_REVIEWS=false

# Use mock data
VITE_USE_MOCK_REVIEWS=true

# No additional dependencies needed!
```

## 🚀 Getting Started

### 1. API Setup
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Enable "Places API" (and "Places API (New)" for modern features)
3. Create API key
4. Add your domain to HTTP referrers:
   - Development: `http://localhost:5173`
   - Production: `https://yourdomain.com`

### 2. Environment Variables
```bash
VITE_GOOGLE_MAPS_API_KEY=your_api_key_here
VITE_USE_MOCK_REVIEWS=false  # Set to true for mock data
```

### 3. Usage
```tsx
import GoogleReviews from './components/GoogleReviews';

function App() {
  return <GoogleReviews />;
}
```

## 🔍 Debugging

### Debug Panel
Shows real-time API status:
- API key existence
- Script loading status
- Environment info
- Current URL

### Console Logging
Detailed step-by-step logs:
```
🔍 Google Reviews Debug Info:
📡 Loading Google Maps script...
✅ Google Maps script loaded successfully
📍 Creating Place instance with ID: ChIJ...
✅ Place fields fetched successfully
```

### Test Component
`GoogleMapsTest` component verifies:
- Script loading
- importLibrary() functionality
- Place class instantiation
- fetchFields() operation

## 📊 API Response Format

The modern Place class returns:
```typescript
{
  displayName: { text: string },
  rating: number,
  reviews: Review[],
  userRatingCount: number,
  formattedAddress: string,
  nationalPhoneNumber: string,
  websiteURI: string
}
```

Converted to our interface:
```typescript
{
  name: string,
  rating: number,
  reviews: GoogleReview[],
  user_ratings_total: number,
  formatted_address?: string,
  formatted_phone_number?: string,
  website?: string
}
```

## 🎯 Best Practices Implemented

1. **Modern API Usage**: Place class over legacy PlacesService
2. **Optimal Loading**: Bootstrap loading with proper callbacks
3. **Error Boundaries**: Comprehensive error handling
4. **Type Safety**: Full TypeScript support
5. **Performance**: Lazy loading and caching
6. **UX**: Loading states and graceful fallbacks
7. **Debugging**: Built-in debugging tools

## 🔧 Troubleshooting

### Common Issues

**ApiTargetBlockedMapError**
- Add domain to API key restrictions
- Check HTTP referrers in Google Cloud Console

**REQUEST_DENIED**
- Enable Places API in your project
- Verify API key is valid

**PERMISSION_DENIED**
- Enable "Places API (New)" for modern features
- Check billing account status

**Script Loading Issues**
- Check network connectivity
- Verify API key format
- Ensure no ad blockers are blocking Google APIs

### Debug Steps

1. Check debug panel on page
2. Review console logs
3. Test with GoogleMapsTest component
4. Verify API key in Google Cloud Console
5. Check domain restrictions

## 📚 References

- [Google Maps JavaScript API Documentation](https://developers.google.com/maps/documentation/javascript)
- [Place Class Reference](https://developers.google.com/maps/documentation/javascript/place)
- [Migration Guide](https://developers.google.com/maps/documentation/javascript/places-migration-overview)
- [Best Practices](https://developers.google.com/maps/documentation/javascript/best-practices)
