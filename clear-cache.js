// Clear cache script for NewArrivals fix
console.log("Clearing NewArrivals cache...");

// Clear localStorage items
localStorage.removeItem('highlightProducts');
localStorage.removeItem('highlightProductsLastFetched');
localStorage.removeItem('highlightProductsCacheTimestamp');

console.log("Cache cleared successfully!");
console.log("Please refresh the page to see the updated products.");
