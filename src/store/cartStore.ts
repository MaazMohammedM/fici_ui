import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { useAuthStore } from './authStore';

export interface CartItem {
  id: string;
  product_id: string;
  article_id: string;
  name: string;
  color: string;
  size: string;
  image: string;
  price: number;
  mrp: number;
  quantity: number;
  discount_percentage: number;
  thumbnail_url: string;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  error: string | null;
  
  // Actions
  addToCart: (item: Omit<CartItem, 'id'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  getCartTotal: () => number;
  getCartCount: () => number;
  getCartSavings: () => number;
  
  // Guest session support
  transferCartToUser: (userId: string) => Promise<void>;
  syncCartWithSession: () => void;
  getCartStorageKey: () => string;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      loading: false,
      error: null,

      addToCart: (newItem) => {
        const { items } = get();
        const existingItemIndex = items.findIndex(
          item => 
            item.product_id === newItem.product_id && 
            item.color === newItem.color && 
            item.size === newItem.size &&
            item.thumbnail_url===newItem.thumbnail_url
        );

        if (existingItemIndex >= 0) {
          // Update quantity if item already exists
          const updatedItems = [...items];
          updatedItems[existingItemIndex].quantity += newItem.quantity;
          set({ items: updatedItems });
        } else {
          // Add new item with unique ID
          const itemWithId = {
            ...newItem,
            id: `${newItem.product_id}-${newItem.color}-${newItem.size}-${Date.now()}`
          };
          set({ items: [...items, itemWithId] });
        }
      },

      removeFromCart: (id) => {
        set({ items: get().items.filter(item => item.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }
        
        set({
          items: get().items.map(item =>
            item.id === id ? { ...item, quantity } : item
          )
        });
      },

      clearCart: () => {
        set({ items: [] });
      },

      // Guest session support methods
      transferCartToUser: async (userId: string) => {
        const { items } = get();
        if (items.length === 0) return;
        
        try {
          // In a real implementation, you might want to sync cart to server here
          // For now, we'll just update the storage key to associate with user
          const newStorageKey = `cart-storage-${userId}`;
          localStorage.setItem(newStorageKey, JSON.stringify({ items }));
          
          // Clear guest cart
          const guestKey = get().getCartStorageKey();
          if (guestKey !== newStorageKey) {
            localStorage.removeItem(guestKey);
          }
        } catch (error) {
          console.error('Failed to transfer cart to user:', error);
        }
      },

      syncCartWithSession: () => {
        // This method can be called to ensure cart is synced with current session
        const currentKey = get().getCartStorageKey();
        const stored = localStorage.getItem(currentKey);
        if (stored) {
          try {
            const { items } = JSON.parse(stored);
            set({ items: items || [] });
          } catch (error) {
            console.error('Failed to sync cart with session:', error);
          }
        }
      },

      getCartStorageKey: () => {
        const authStore = useAuthStore.getState();
        const authType = authStore.getAuthenticationType();
        
        if (authType === 'user') {
          return `cart-storage-${authStore.getCurrentUserId()}`;
        } else if (authType === 'guest') {
          return `cart-storage-guest-${authStore.getCurrentSessionId()}`;
        }
        return 'cart-storage'; // fallback for unauthenticated users
      },

      getCartTotal: () => {
        return get().items.reduce((total, item) => total + (item.price * item.quantity), 0);
      },

      getCartCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },

      getCartSavings: () => {
        return get().items.reduce((savings, item) => {
          const mrpTotal = item.mrp * item.quantity;
          const discountedTotal = item.price * item.quantity;
          return savings + (mrpTotal - discountedTotal);
        }, 0);
      }
    }),
    {
      name: 'cart-storage',
      partialize: (state) => ({ items: state.items })
    }
  )
);