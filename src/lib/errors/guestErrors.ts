// // Guest session error handling utilities - Fixed for erasableSyntaxOnly

// export const GuestErrorType = {
//   SESSION_EXPIRED: 'SESSION_EXPIRED',
//   SESSION_NOT_FOUND: 'SESSION_NOT_FOUND',
//   MERGE_CONFLICT: 'MERGE_CONFLICT',
//   VALIDATION_ERROR: 'VALIDATION_ERROR',
//   NETWORK_ERROR: 'NETWORK_ERROR',
//   CHECKOUT_ERROR: 'CHECKOUT_ERROR',
//   ORDER_NOT_FOUND: 'ORDER_NOT_FOUND',
//   CART_SYNC_ERROR: 'CART_SYNC_ERROR'
// } as const;

// export type GuestErrorTypeKeys = typeof GuestErrorType[keyof typeof GuestErrorType];

// export class GuestError extends Error {
//   public type: GuestErrorTypeKeys;
//   public code?: string;
//   public details?: any;

//   constructor(type: GuestErrorTypeKeys, message: string, code?: string, details?: any) {
//     super(message);
//     this.name = 'GuestError';
//     this.type = type;
//     this.code = code;
//     this.details = details;
//   }
// }

// export const createGuestError = (
//   type: GuestErrorTypeKeys,
//   message: string,
//   code?: string,
//   details?: any
// ): GuestError => {
//   return new GuestError(type, message, code, details);
// };

// // Error message mappings
// export const getErrorMessage = (error: GuestError): string => {
//   switch (error.type) {
//     case GuestErrorType.SESSION_EXPIRED:
//       return 'Your guest session has expired. Please start a new checkout process.';
//     case GuestErrorType.SESSION_NOT_FOUND:
//       return 'Guest session not found. Please refresh and try again.';
//     case GuestErrorType.MERGE_CONFLICT:
//       return 'Unable to merge guest orders. Some items may already exist in your account.';
//     case GuestErrorType.VALIDATION_ERROR:
//       return error.message || 'Please check your information and try again.';
//     case GuestErrorType.NETWORK_ERROR:
//       return 'Network error occurred. Please check your connection and try again.';
//     case GuestErrorType.CHECKOUT_ERROR:
//       return 'Checkout failed. Please try again or contact support.';
//     case GuestErrorType.ORDER_NOT_FOUND:
//       return 'Order not found. It may have been moved to your account.';
//     case GuestErrorType.CART_SYNC_ERROR:
//       return 'Cart synchronization failed. Please refresh the page.';
//     default:
//       return 'An unexpected error occurred. Please try again.';
//   }
// };

// // Error handling utilities
// export const handleGuestError = (error: unknown, fallbackMessage?: string): void => {
//   console.error('Guest Error:', error);

//   if (error instanceof GuestError) {
//     const message = getErrorMessage(error);
//     console.error(message);
    
//     // Log additional details for debugging
//     if (error.details) {
//       console.error('Error details:', error.details);
//     }
//   } else if (error instanceof Error) {
//     console.error(fallbackMessage || error.message);
//   } else {
//     console.error(fallbackMessage || 'An unexpected error occurred');
//   }
// };

// // Retry mechanism for guest operations
// export const retryGuestOperation = async <T>(
//   operation: () => Promise<T>,
//   maxRetries: number = 3,
//   delay: number = 1000
// ): Promise<T> => {
//   let lastError: unknown;

//   for (let attempt = 1; attempt <= maxRetries; attempt++) {
//     try {
//       return await operation();
//     } catch (error) {
//       lastError = error;
      
//       // Don't retry certain types of errors
//       if (error instanceof GuestError) {
//         const nonRetryableTypes = [
//           GuestErrorType.SESSION_EXPIRED,
//           GuestErrorType.VALIDATION_ERROR,
//           GuestErrorType.MERGE_CONFLICT
//         ];
        
//         if (nonRetryableTypes.includes(error.type)) {
//           throw error;
//         }
//       }

//       if (attempt === maxRetries) {
//         break;
//       }

//       // Wait before retrying
//       await new Promise(resolve => setTimeout(resolve, delay * attempt));
//     }
//   }

//   throw lastError;
// };

// // Session validation helper
// export const validateGuestSession = (session: any): boolean => {
//   if (!session) return false;
//   if (!session.sessionId) return false;
  
//   // Check if session is expired
//   if (session.expiresAt && new Date(session.expiresAt) < new Date()) {
//     return false;
//   }

//   return true;
// };

// // Error recovery suggestions
// export const getRecoverySuggestion = (error: GuestError): string => {
//   switch (error.type) {
//     case GuestErrorType.SESSION_EXPIRED:
//       return 'Start a new guest checkout or sign in to your account.';
//     case GuestErrorType.SESSION_NOT_FOUND:
//       return 'Refresh the page and try again.';
//     case GuestErrorType.MERGE_CONFLICT:
//       return 'Sign in to your account to view all your orders.';
//     case GuestErrorType.CART_SYNC_ERROR:
//       return 'Refresh the page to sync your cart.';
//     case GuestErrorType.NETWORK_ERROR:
//       return 'Check your internet connection and try again.';
//     default:
//       return 'Contact support if the problem persists.';
//   }
// };

// // Error logging helper for guest components
// export const logGuestComponentError = (componentName: string, error: unknown): void => {
//   console.error(`Guest component error in ${componentName}:`, error);
//   handleGuestError(error, `Error in ${componentName} component`);
// };

// // Type guards for better error handling
// export const isGuestError = (error: unknown): error is GuestError => {
//   return error instanceof GuestError;
// };

// export const isSessionExpiredError = (error: unknown): boolean => {
//   return isGuestError(error) && error.type === GuestErrorType.SESSION_EXPIRED;
// };

// export const isNetworkError = (error: unknown): boolean => {
//   return isGuestError(error) && error.type === GuestErrorType.NETWORK_ERROR;
// };

// // Enhanced error context for debugging
// export interface ErrorContext {
//   component?: string;
//   action?: string;
//   userId?: string;
//   guestSessionId?: string;
//   timestamp: string;
//   userAgent?: string;
// }

// export const createErrorContext = (
//   component?: string,
//   action?: string,
//   userId?: string,
//   guestSessionId?: string
// ): ErrorContext => {
//   return {
//     component,
//     action,
//     userId,
//     guestSessionId,
//     timestamp: new Date().toISOString(),
//     userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : undefined
//   };
// };

// // Enhanced logging with context
// export const logErrorWithContext = (
//   error: unknown,
//   context: ErrorContext
// ): void => {
//   console.error('Error occurred:', {
//     error: error instanceof Error ? error.message : String(error),
//     stack: error instanceof Error ? error.stack : undefined,
//     context
//   });

//   // In production, you might want to send this to your logging service
//   if (process.env.NODE_ENV === 'production') {
//     // sendToLoggingService({ error, context });
//   }
// };

// // Session recovery helper
// export const attemptSessionRecovery = async (
//   guestSessionId: string
// ): Promise<boolean> => {
//   try {
//     // Attempt to refresh/extend the session
//     const response = await fetch('/api/guest-session/extend', {
//       method: 'POST',
//       headers: { 'Content-Type': 'application/json' },
//       body: JSON.stringify({ sessionId: guestSessionId })
//     });
    
//     return response.ok;
//   } catch {
//     return false;
//   }
// };

// // Graceful degradation helper
// export const handleGracefulDegradation = (
//   error: GuestError,
//   fallbackAction?: () => void
// ): void => {
//   switch (error.type) {
//     case GuestErrorType.SESSION_EXPIRED:
//       // Clear local storage and redirect to fresh checkout
//       localStorage.removeItem('guestSession');
//       if (fallbackAction) fallbackAction();
//       break;
      
//     case GuestErrorType.CART_SYNC_ERROR:
//       // Try to recover cart from local storage
//       const localCart = localStorage.getItem('guestCart');
//       if (localCart && fallbackAction) {
//         fallbackAction();
//       }
//       break;
      
//     default:
//       if (fallbackAction) fallbackAction();
//       break;
//   }
// };