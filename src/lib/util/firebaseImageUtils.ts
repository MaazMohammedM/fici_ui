// ✅ Firebase Image Utils - Central image handling utilities for Firebase Storage
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app } from './firebase';

const storage = getStorage(app);
const fallbackImage = '/src/assets/Fici Logo.png'; // Update path as needed

export const getFirebaseImageUrl = (path: string): string => {
  if (!path || typeof path !== 'string') return fallbackImage;
  
  // If it's already a Firebase URL, return as-is
  if (path.includes('firebasestorage.googleapis.com')) return path;
  
  // If it's already a complete HTTP URL, return as-is
  if (path.startsWith('http')) return path;
  
  // If it's a Firebase Storage path, construct the URL
  if (path.startsWith('products/') || path.startsWith('order-items/')) {
    const storageRef = ref(storage, path);
    // For now, construct the URL manually. In production, you might want to use getDownloadURL
    return `https://firebasestorage.googleapis.com/v0/b/fici-shoes.firebasestorage.app/o/${encodeURIComponent(path)}?alt=media`;
  }
  
  // For any other case, return as-is
  return path;
};

export const getOptimizedFirebaseImageUrl = (path: string, width: number = 400): string => {
  const baseUrl = getFirebaseImageUrl(path);
  if (!baseUrl || baseUrl === fallbackImage) return fallbackImage;
  
  // Firebase Storage doesn't have built-in image optimization like Supabase
  // You can add image optimization service here if needed (like Cloudinary, Imgix, etc.)
  return baseUrl;
};

export const validateFirebaseImageUrl = async (url: string): Promise<boolean> => {
  try {
    if (!url || url === fallbackImage) return false;
    
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};

// Helper function to get product image URL with fallback
export const getProductImageUrl = (product: any, index: number = 0): string => {
  if (!product) return fallbackImage;
  
  // Try thumbnail first
  if (product.thumbnail_url) {
    return getFirebaseImageUrl(product.thumbnail_url);
  }
  
  // Try images array
  if (product.images && Array.isArray(product.images) && product.images.length > index) {
    return getFirebaseImageUrl(product.images[index]);
  }
  
  return fallbackImage;
};

// Helper function to get all product image URLs
export const getAllProductImageUrls = (product: any): string[] => {
  if (!product) return [fallbackImage];
  
  const urls: string[] = [];
  
  // Add thumbnail
  if (product.thumbnail_url) {
    urls.push(getFirebaseImageUrl(product.thumbnail_url));
  }
  
  // Add gallery images
  if (product.images && Array.isArray(product.images)) {
    product.images.forEach((img: string) => {
      if (img && !urls.includes(getFirebaseImageUrl(img))) {
        urls.push(getFirebaseImageUrl(img));
      }
    });
  }
  
  // Remove duplicates and filter out fallback
  const uniqueUrls = [...new Set(urls)].filter(url => url !== fallbackImage);
  
  return uniqueUrls.length > 0 ? uniqueUrls : [fallbackImage];
};

// Export a default object for backward compatibility
export const imageUtils = {
  getImageUrl: getFirebaseImageUrl,
  getOptimizedImageUrl: getOptimizedFirebaseImageUrl,
  validateImageUrl: validateFirebaseImageUrl,
  getProductImageUrl,
  getAllProductImageUrls
};
