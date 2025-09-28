import { supabase } from '@lib/supabase'; // Make sure to import supabase client
import type { GuestContactInfo } from '@lib/validation/checkout';

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

      // Use Supabase functions client to invoke the edge function
      const { data, error } = await supabase.functions.invoke('create-guest-session', {
        body: requestBody
      });

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error('Failed to create guest session:', error);
      throw error;
    }
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/validate-guest-session`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          body: JSON.stringify({ session_id: sessionId })
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to validate session');
      }

      const data = await response.json();
      return data.valid === true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }}