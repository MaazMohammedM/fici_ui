import { create } from 'zustand';
import { supabase } from '@lib/supabase';

interface AuthState {
  user: any;
  role: string | null;
  firstName: string | null;
  loading: boolean;
  setUser: (user: any) => void;
  setRole: (role: string | null) => void;
  setFirstName: (name: string | null) => void;
  signOut: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  role: null,
  firstName: null,
  loading: true,

  setUser: (user) => set({ user }),
  setRole: (role) => set({ role }),
  setFirstName: (name) => set({ firstName: name }),

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, role: null, firstName: null });
  },
}));