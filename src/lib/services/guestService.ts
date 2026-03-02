import { httpsCallable, functions } from '../firebase'; // Make sure to import firebase functions
import type { GuestContactInfo } from '../validation/checkout';

export interface GuestSession {
  guest_session_id: string;
  email: string;
  phone?: string;
  name?: string;
  created_at: string;
  expires_at: string;
  is_active: boolean;
}

export class GuestService {
  static async createSession(contactInfo: GuestContactInfo): Promise<GuestSession | null> {
    try {
      // Create a clean request body with only the required fields
      const requestBody = {
        email: contactInfo.email,
        phone: contactInfo.phone,
        name: contactInfo.name || ''
      };

      // Use Firebase functions to invoke the cloud function
      const createGuestSessionFunction = httpsCallable(functions, 'create-guest-session');
      const { data } = await createGuestSessionFunction(requestBody);

      if (!data) {
        throw new Error('Failed to create guest session');
      }

      return data as GuestSession;
    } catch (error) {
      console.error('Failed to create guest session:', error);
      throw error;
    }
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    try {
      const validateGuestSessionFunction = httpsCallable(functions, 'validate-guest-session');
      const { data } = await validateGuestSessionFunction({ session_id: sessionId });
      
      return (data as any)?.valid === true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  static async extendSession(sessionId: string): Promise<boolean> {
    try {
      const extendGuestSessionFunction = httpsCallable(functions, 'extend-guest-session');
      const { data } = await extendGuestSessionFunction({ session_id: sessionId });
      
      return (data as any)?.success === true;
    } catch (error) {
      console.error('Session extension error:', error);
      return false;
    }
  }
}