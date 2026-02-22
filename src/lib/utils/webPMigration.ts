/**
 * WebP Migration Utility
 * Helps migrate from PNG/JPG to WebP format for maximum bandwidth savings
 */

import { getImageForUseCaseAsync } from './imageOptimization';

/**
 * Migrate all images in a component to WebP format
 * This function can be used to gradually update components
 */
export async function migrateComponentImagesToWebP() {
  console.log('🔄 Starting WebP migration...');
  
  // Find all img elements that don't have WebP format
  const images = document.querySelectorAll('img[src*="ficishoesimages"]');
  let migratedCount = 0;
  
  for (const img of images) {
    const currentSrc = img.getAttribute('src');
    if (!currentSrc) continue;
    
    // Skip if already WebP or already optimized
    if (currentSrc.includes('format=webp')) {
      continue;
    }
    
    try {
      // Extract the base URL without parameters
      const baseUrl = currentSrc.split('?')[0];
      
      // Try different use cases to find the best fit
      const useCases = ['THUMBNAIL', 'LISTING', 'DETAIL'] as const;
      
      for (const useCase of useCases) {
        try {
          const webpUrl = await getImageForUseCaseAsync(baseUrl, useCase);
          
          // Only update if WebP URL is different and valid
          if (webpUrl !== currentSrc && webpUrl.includes('format=webp')) {
            img.setAttribute('src', webpUrl);
            img.setAttribute('loading', 'lazy');
            migratedCount++;
            console.log(`✅ Migrated to WebP: ${useCase}`, webpUrl);
            break; // Move to next image after successful migration
          }
        } catch (error) {
          console.warn(`⚠️ Failed to migrate ${useCase}:`, error);
          continue;
        }
      }
    } catch (error) {
      console.error('❌ Migration failed for image:', currentSrc, error);
    }
  }
  
  console.log(`✅ WebP migration complete! Migrated ${migratedCount} images`);
  return migratedCount;
}

/**
 * Check if browser supports WebP format
 */
export async function checkWebPSupport(): Promise<boolean> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return false;
  
  // Create a simple WebP image
  canvas.width = 1;
  canvas.height = 1;
  const webpData = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      // Draw the image to canvas
      ctx.drawImage(img, 0, 0);
      
      // Get the image data back
      const data = ctx.getImageData(0, 0, 1, 1);
      
      // Check if the image was rendered correctly
      resolve(data.data[3] === 255); // Alpha channel check
    };
    
    img.onerror = () => resolve(false);
    img.src = webpData;
  });
}

/**
 * Get WebP conversion statistics
 */
export function getWebPMigrationStats() {
  const images = document.querySelectorAll('img[src*="ficishoesimages"]');
  const totalImages = images.length;
  const webpImages = Array.from(images).filter(img => 
    img.getAttribute('src')?.includes('format=webp')
  ).length;
  const jpgImages = totalImages - webpImages;
  
  return {
    total: totalImages,
    webp: webpImages,
    jpg: jpgImages,
    webpPercentage: totalImages > 0 ? Math.round((webpImages / totalImages) * 100) : 0,
    estimatedBandwidthSavings: jpgImages * 0.7 // Rough estimate: 70% savings for WebP vs JPG
  };
}

/**
 * Force WebP format for all images (development utility)
 */
export function forceWebPForAllImages() {
  console.log('🚀 Forcing WebP format for all images...');
  
  const images = document.querySelectorAll('img[src*="ficishoesimages"]');
  let forcedCount = 0;
  
  images.forEach(img => {
    const currentSrc = img.getAttribute('src');
    if (!currentSrc || currentSrc.includes('format=webp')) {
      return;
    }
    
    const baseUrl = currentSrc.split('?')[0];
    const separator = baseUrl.includes('?') ? '&' : '?';
    const webpUrl = `${baseUrl}${separator}format=webp`;
    
    img.setAttribute('src', webpUrl);
    forcedCount++;
  });
  
  console.log(`✅ Forced WebP format for ${forcedCount} images`);
  return forcedCount;
}

/**
 * Add WebP migration button to admin panel (for development)
 */
export function addWebPMigrationButton() {
  // Check if button already exists
  if (document.getElementById('webp-migration-btn')) {
    return;
  }
  
  const button = document.createElement('button');
  button.id = 'webp-migration-btn';
  button.innerHTML = '🔄 Migrate to WebP';
  button.className = 'fixed bottom-4 right-4 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg z-50 hover:bg-blue-700 transition-colors';
  button.onclick = () => {
    const count = migrateComponentImagesToWebP();
    button.innerHTML = `✅ Migrated ${count} images`;
    setTimeout(() => {
      button.innerHTML = '🔄 Migrate to WebP';
    }, 3000);
  };
  
  document.body.appendChild(button);
}
