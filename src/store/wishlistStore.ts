import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Product } from '../types/product';

export interface WishlistItem {
  product_id: string;
  article_id: string;
  name: string;
  price: number;
  images: string[];
  addedAt: string;
  mrp_price: string;
  discount_price: string;
  description: string;
  sub_category: string;
  gender: 'men' | 'women' | 'unisex';
  created_at: string;
  category: string;
  sizes: Record<string, number>;
  color: string; // Always a string
  discount_percentage: number;
  thumbnail_url?: string;
}

interface WishlistState {
  items: WishlistItem[];
  addToWishlist: (product: Product | WishlistItem) => void;
  removeFromWishlist: (productId: string) => void;
  isInWishlist: (productId: string) => boolean;
  clearWishlist: () => void;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],
      addToWishlist: (product: Product | WishlistItem) =>
        set((state) => {
          const articleId = 'article_id' in product ? product.article_id : '';
          if (state.items.some((item) => item.article_id === articleId)) {
            return state;
          }
          
          // If it's already a WishlistItem, add it directly
          if ('addedAt' in product) {
            return {
              items: [...state.items, product as WishlistItem],
            };
          }
          
          // If it's a Product, convert it to a WishlistItem
          const wishlistItem: WishlistItem = {
            ...product,
            product_id: articleId,
            article_id: articleId,
            name: product.name || '',
            price: parseFloat(String(product.discount_price)) || 0,
            images: Array.isArray(product.images) ? product.images : [product.thumbnail_url || ''],
            addedAt: new Date().toISOString(),
            mrp_price: product.mrp_price || '0',
            discount_price: String(product.discount_price || '0'),
            description: product.description || '',
            sub_category: product.sub_category || '',
            category: product.category || '',
            sizes: product.sizes || {},
            color: 'color' in product ? String(product.color) : '', // Ensure color is always a string
            discount_percentage: Number(product.discount_percentage) || 0,
            gender: 'gender' in product && (product.gender === 'men' || product.gender === 'women' || product.gender === 'unisex') 
              ? product.gender 
              : 'unisex',
            created_at: new Date().toISOString(),
            thumbnail_url: product.thumbnail_url
          };
          
          return {
            items: [...state.items, wishlistItem],
          };
        }),
      removeFromWishlist: (articleId: string) =>
        set((state) => ({
          items: state.items.filter((item) => item.article_id !== articleId),
        })),
      isInWishlist: (articleId: string) =>
        get().items.some((item) => item.article_id === articleId),
      clearWishlist: () => set({ items: [] }),
    }),
    {
      name: 'wishlist-storage',
      // @ts-ignore - Workaround for SSR
      getStorage: () => (typeof window !== 'undefined' ? window.localStorage : null),
    }
  )
);

export const useWishlistCount = () => {
  const items = useWishlistStore((state) => state.items);
  return items.length;
};
