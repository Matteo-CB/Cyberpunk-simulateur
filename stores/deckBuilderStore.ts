import { create } from 'zustand';
import type { CardData, CardType, CardColor } from '@/lib/data/types';
import { validateDeck, type DeckValidationResult } from '@/lib/engine/rules/DeckValidation';
import {
  MIN_DECK_SIZE,
  MAX_DECK_SIZE,
  MAX_CARD_COPIES,
  LEGENDS_PER_PLAYER,
} from '@/lib/engine/types';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export interface DeckBuilderFilters {
  type: CardType | 'all';
  color: CardColor | 'all';
  classification: string;
  keyword: string;
  set: string;
  minCost: number | null;
  maxCost: number | null;
}

export interface DeckBuilderStore {
  // Deck composition
  selectedCards: CardData[];
  selectedLegends: CardData[];
  deckName: string;
  deckId: string | null; // null for new decks

  // Search & filter
  searchQuery: string;
  filters: DeckBuilderFilters;

  // UI state
  isSaving: boolean;
  lastValidation: DeckValidationResult | null;

  // Actions - Deck management
  addCard: (card: CardData) => boolean;
  removeCard: (index: number) => void;
  removeCardById: (cardId: string) => void;
  addLegend: (card: CardData) => boolean;
  removeLegend: (index: number) => void;
  removeLegendById: (cardId: string) => void;
  setDeckName: (name: string) => void;
  setDeckId: (id: string | null) => void;
  clearDeck: () => void;

  // Actions - Load existing deck
  loadDeck: (
    id: string,
    name: string,
    cards: CardData[],
    legends: CardData[]
  ) => void;

  // Actions - Search & filter
  setSearchQuery: (query: string) => void;
  setFilter: <K extends keyof DeckBuilderFilters>(
    key: K,
    value: DeckBuilderFilters[K]
  ) => void;
  clearFilters: () => void;

  // Actions - Validation
  validateDeck: () => DeckValidationResult;

  // Actions - Saving
  setIsSaving: (saving: boolean) => void;

  // Computed helpers
  getCardCount: (cardId: string) => number;
  canAddCard: (card: CardData) => boolean;
  canAddLegend: (card: CardData) => boolean;
  getDeckSize: () => number;
}

// ------------------------------------------------------------------
// Default filter state
// ------------------------------------------------------------------

const DEFAULT_FILTERS: DeckBuilderFilters = {
  type: 'all',
  color: 'all',
  classification: '',
  keyword: '',
  set: '',
  minCost: null,
  maxCost: null,
};

// ------------------------------------------------------------------
// Store
// ------------------------------------------------------------------

export const useDeckBuilderStore = create<DeckBuilderStore>((set, get) => ({
  // Initial state
  selectedCards: [],
  selectedLegends: [],
  deckName: '',
  deckId: null,
  searchQuery: '',
  filters: { ...DEFAULT_FILTERS },
  isSaving: false,
  lastValidation: null,

  // --- Deck Management ---

  addCard: (card) => {
    const state = get();

    // Cannot add legends to the main deck
    if (card.card_type === 'legend') return false;

    // Check deck size limit
    if (state.selectedCards.length >= MAX_DECK_SIZE) return false;

    // Check copy limit
    const copyCount = state.selectedCards.filter((c) => c.id === card.id).length;
    if (copyCount >= MAX_CARD_COPIES) return false;

    set((s) => ({
      selectedCards: [...s.selectedCards, card],
      lastValidation: null,
    }));
    return true;
  },

  removeCard: (index) => {
    set((state) => {
      const updated = [...state.selectedCards];
      updated.splice(index, 1);
      return { selectedCards: updated, lastValidation: null };
    });
  },

  removeCardById: (cardId) => {
    set((state) => {
      // Remove the first instance of this card
      const idx = state.selectedCards.findIndex((c) => c.id === cardId);
      if (idx === -1) return state;
      const updated = [...state.selectedCards];
      updated.splice(idx, 1);
      return { selectedCards: updated, lastValidation: null };
    });
  },

  addLegend: (card) => {
    const state = get();

    // Must be a legend type
    if (card.card_type !== 'legend') return false;

    // Check legend count limit
    if (state.selectedLegends.length >= LEGENDS_PER_PLAYER) return false;

    // Check for duplicate legend names
    const alreadyHasName = state.selectedLegends.some(
      (l) => l.name_en === card.name_en
    );
    if (alreadyHasName) return false;

    set((s) => ({
      selectedLegends: [...s.selectedLegends, card],
      lastValidation: null,
    }));
    return true;
  },

  removeLegend: (index) => {
    set((state) => {
      const updated = [...state.selectedLegends];
      updated.splice(index, 1);
      return { selectedLegends: updated, lastValidation: null };
    });
  },

  removeLegendById: (cardId) => {
    set((state) => {
      const idx = state.selectedLegends.findIndex((c) => c.id === cardId);
      if (idx === -1) return state;
      const updated = [...state.selectedLegends];
      updated.splice(idx, 1);
      return { selectedLegends: updated, lastValidation: null };
    });
  },

  setDeckName: (name) => {
    set({ deckName: name });
  },

  setDeckId: (id) => {
    set({ deckId: id });
  },

  clearDeck: () => {
    set({
      selectedCards: [],
      selectedLegends: [],
      deckName: '',
      deckId: null,
      lastValidation: null,
    });
  },

  loadDeck: (id, name, cards, legends) => {
    set({
      deckId: id,
      deckName: name,
      selectedCards: cards,
      selectedLegends: legends,
      lastValidation: null,
    });
  },

  // --- Search & Filter ---

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  setFilter: (key, value) => {
    set((state) => ({
      filters: { ...state.filters, [key]: value },
    }));
  },

  clearFilters: () => {
    set({
      searchQuery: '',
      filters: { ...DEFAULT_FILTERS },
    });
  },

  // --- Validation ---

  validateDeck: () => {
    const { selectedCards, selectedLegends } = get();
    const result = validateDeck(selectedCards, selectedLegends);
    set({ lastValidation: result });
    return result;
  },

  // --- Saving ---

  setIsSaving: (saving) => {
    set({ isSaving: saving });
  },

  // --- Computed Helpers ---

  getCardCount: (cardId) => {
    return get().selectedCards.filter((c) => c.id === cardId).length;
  },

  canAddCard: (card) => {
    const state = get();
    if (card.card_type === 'legend') return false;
    if (state.selectedCards.length >= MAX_DECK_SIZE) return false;
    const copyCount = state.selectedCards.filter((c) => c.id === card.id).length;
    return copyCount < MAX_CARD_COPIES;
  },

  canAddLegend: (card) => {
    const state = get();
    if (card.card_type !== 'legend') return false;
    if (state.selectedLegends.length >= LEGENDS_PER_PLAYER) return false;
    return !state.selectedLegends.some((l) => l.name_en === card.name_en);
  },

  getDeckSize: () => {
    return get().selectedCards.length;
  },
}));

// ------------------------------------------------------------------
// Selector helpers (for use with shallow comparison in components)
// ------------------------------------------------------------------

export const selectDeckStats = (state: DeckBuilderStore) => ({
  totalCards: state.selectedCards.length,
  totalLegends: state.selectedLegends.length,
  minDeckSize: MIN_DECK_SIZE,
  maxDeckSize: MAX_DECK_SIZE,
  legendsRequired: LEGENDS_PER_PLAYER,
  isValid:
    state.selectedCards.length >= MIN_DECK_SIZE &&
    state.selectedCards.length <= MAX_DECK_SIZE &&
    state.selectedLegends.length === LEGENDS_PER_PLAYER,
});

export const selectColorBreakdown = (state: DeckBuilderStore) => {
  const counts: Record<CardColor, number> = {
    red: 0,
    blue: 0,
    green: 0,
    yellow: 0,
  };
  for (const card of state.selectedCards) {
    counts[card.color]++;
  }
  return counts;
};

export const selectTypeBreakdown = (state: DeckBuilderStore) => {
  const counts: Record<string, number> = {
    unit: 0,
    gear: 0,
    program: 0,
  };
  for (const card of state.selectedCards) {
    counts[card.card_type] = (counts[card.card_type] || 0) + 1;
  }
  return counts;
};
