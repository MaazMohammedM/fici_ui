import { useAuthStore } from '../../store/authStore';

/**
 * Flexible authentication hook that provides access to auth store
 * Supports current authentication and future mobile login methods
 */
export const useAuth = () => {
  return useAuthStore();
};