import { supabase } from '@lib/supabase';
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
      const { data, error } = await supabase.functions.invoke('create-guest-session', {
        body: contactInfo
      });
      
      if (error) {
        console.error('Guest session creation error:', error);
        return null;
      }
      
      return data as GuestSession;
    } catch (error) {
      console.error('Failed to create guest session:', error);
      return null;
    }
  }

  static async validateSession(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('validate-guest-session', {
        body: { session_id: sessionId }
      });
      
      if (error || !data) return false;
      return data.is_valid === true;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  static async extendSession(sessionId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.functions.invoke('extend-guest-session', {
        body: { session_id: sessionId }
      });
      
      if (error) {
        console.error('Session extension error:', error);
        return false;
      }
      
      return data.success === true;
    } catch (error) {
      console.error('Session extension error:', error);
      return false;
    }
  }
}
