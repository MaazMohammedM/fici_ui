// ✅ imageUtils.ts — Central image handling utilities (Updated for Firebase)
import { getFirebaseImageUrl } from './firebaseImageUtils';
import fallbackImage from '@/assets/Fici Logo.png';

export const getImageUrl = (path: string): string => {
  if (!path || typeof path !== 'string') return fallbackImage;
  if (path.startsWith('http')) return path;
  
  // Use Firebase image URL utility
  return getFirebaseImageUrl(path);
};

export const getOptimizedImageUrl = (path: string, width: number = 400): string => {
  const baseUrl = getImageUrl(path);
  if (!baseUrl || baseUrl === fallbackImage) return fallbackImage;
  
  // Firebase Storage doesn't have built-in optimization like Supabase
  // You can add image optimization service here if needed
  return baseUrl;
};

export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};