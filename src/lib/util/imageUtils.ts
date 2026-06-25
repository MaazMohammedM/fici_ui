// ✅ imageUtils.ts — Central image handling utilities
import { supabase } from '@lib/supabase';
import fallbackImage from '@/assets/Fici Logo.png';

const CUSTOM_DOMAIN = 'https://api.ficishoes.com';

export const getImageUrl = (path: string): string => {
  if (!path || typeof path !== 'string') return fallbackImage;
  if (path.startsWith('http')) return path;
  
  // Construct URL manually using custom domain instead of Supabase's getPublicUrl
  return `${CUSTOM_DOMAIN}/storage/v1/object/public/ficishoesimages/${path}`;
};

export const getOptimizedImageUrl = (path: string, width: number = 400): string => {
  const baseUrl = getImageUrl(path);
  if (!baseUrl || baseUrl === fallbackImage) return fallbackImage;
  return `${baseUrl}?width=${width}&quality=80`;
};

export const validateImageUrl = async (url: string): Promise<boolean> => {
  try {
    const response = await fetch(url, { method: 'HEAD' });
    return response.ok;
  } catch {
    return false;
  }
};