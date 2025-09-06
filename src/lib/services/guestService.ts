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
      const { data, error } = await supabase
        .from('guest_sessions')
        .select('is_active, expires_at')
        .eq('session_id', sessionId)
        .single();

      if (error || !data) return false;

      const now = new Date();
      const expiresAt = new Date(data.expires_at);
      
      return data.is_active && expiresAt > now;
    } catch (error) {
      console.error('Session validation error:', error);
      return false;
    }
  }

  static async extendSession(sessionId: string): Promise<boolean> {
    try {
      const newExpiry = new Date();
      newExpiry.setHours(newExpiry.getHours() + 24);

      const { error } = await supabase
        .from('guest_sessions')
        .update({ expires_at: newExpiry.toISOString() })
        .eq('session_id', sessionId);

      return !error;
    } catch (error) {
      console.error('Session extension error:', error);
      return false;
    }
  }
}
