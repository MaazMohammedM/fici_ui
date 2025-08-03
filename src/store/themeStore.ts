import { create } from 'zustand';

interface ThemeState {
  mode: 'light' | 'dark';
  toggleMode: () => void;
  initializeTheme: () => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  mode: 'light',
  toggleMode: () => {
    set((state) => {
      const newMode = state.mode === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newMode === 'dark');
      localStorage.setItem('mode', newMode);
      return { mode: newMode };
    });
  },
  initializeTheme: () => {
    const stored = localStorage.getItem('mode') as 'light' | 'dark' | null;
    if (stored) {
      document.documentElement.classList.toggle('dark', stored === 'dark');
      set({ mode: stored });
    }
  },
}));
