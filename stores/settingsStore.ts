import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type GameBackgroundOption =
  | 'default'
  | 'night-city'
  | 'afterlife'
  | 'netspace'
  | 'corpo-plaza'
  | 'badlands'
  | string; // Allow custom backgrounds from DB

export type Locale = 'en' | 'fr';

export interface SettingsStore {
  // State
  animationsEnabled: boolean;
  gameBackground: GameBackgroundOption;
  locale: Locale;
  soundEnabled: boolean;
  soundVolume: number; // 0-100
  showCardIds: boolean;
  compactHand: boolean;

  // Actions
  toggleAnimations: () => void;
  setAnimationsEnabled: (enabled: boolean) => void;
  setBackground: (background: GameBackgroundOption) => void;
  setLocale: (locale: Locale) => void;
  toggleSound: () => void;
  setSoundVolume: (volume: number) => void;
  toggleShowCardIds: () => void;
  setCompactHand: (compact: boolean) => void;
  resetToDefaults: () => void;

  // Sync with server
  syncFromServer: (prefs: {
    animationsEnabled?: boolean;
    gameBackground?: string;
  }) => void;
}

// ------------------------------------------------------------------
// Defaults
// ------------------------------------------------------------------

const DEFAULT_SETTINGS = {
  animationsEnabled: true,
  gameBackground: 'default' as GameBackgroundOption,
  locale: 'en' as Locale,
  soundEnabled: true,
  soundVolume: 70,
  showCardIds: false,
  compactHand: false,
};

// ------------------------------------------------------------------
// Store (persisted to localStorage)
// ------------------------------------------------------------------

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      // Initial state
      ...DEFAULT_SETTINGS,

      toggleAnimations: () => {
        set((state) => ({
          animationsEnabled: !state.animationsEnabled,
        }));
      },

      setAnimationsEnabled: (enabled) => {
        set({ animationsEnabled: enabled });
      },

      setBackground: (background) => {
        set({ gameBackground: background });
      },

      setLocale: (locale) => {
        set({ locale });
      },

      toggleSound: () => {
        set((state) => ({ soundEnabled: !state.soundEnabled }));
      },

      setSoundVolume: (volume) => {
        set({ soundVolume: Math.max(0, Math.min(100, volume)) });
      },

      toggleShowCardIds: () => {
        set((state) => ({ showCardIds: !state.showCardIds }));
      },

      setCompactHand: (compact) => {
        set({ compactHand: compact });
      },

      resetToDefaults: () => {
        set({ ...DEFAULT_SETTINGS });
      },

      syncFromServer: (prefs) => {
        const updates: Partial<SettingsStore> = {};
        if (typeof prefs.animationsEnabled === 'boolean') {
          updates.animationsEnabled = prefs.animationsEnabled;
        }
        if (typeof prefs.gameBackground === 'string') {
          updates.gameBackground = prefs.gameBackground;
        }
        set(updates);
      },
    }),
    {
      name: 'cyberpunk-tcg-settings',
      storage: createJSONStorage(() => {
        // Guard against SSR where localStorage is not available
        if (typeof window !== 'undefined') {
          return localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      // Only persist user-facing settings, not transient state
      partialize: (state) => ({
        animationsEnabled: state.animationsEnabled,
        gameBackground: state.gameBackground,
        locale: state.locale,
        soundEnabled: state.soundEnabled,
        soundVolume: state.soundVolume,
        showCardIds: state.showCardIds,
        compactHand: state.compactHand,
      }),
    }
  )
);
