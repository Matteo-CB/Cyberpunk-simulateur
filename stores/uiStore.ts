import { create } from 'zustand';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type NotificationType = 'success' | 'error' | 'info' | 'warning';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message?: string;
  duration: number; // ms, 0 = persistent
  timestamp: number;
}

export interface PinnedCard {
  cardId: string;
  instanceId?: string;
  source: 'hand' | 'field' | 'legend' | 'trash' | 'opponent';
}

export interface UIStore {
  // Game log panel
  showGameLog: boolean;

  // Settings panel
  showSettings: boolean;

  // Pinned cards (for reference during play)
  pinnedCards: PinnedCard[];

  // Fullscreen card view
  fullscreenCard: string | null; // cardId or instanceId

  // Notification system
  notifications: Notification[];

  // Mobile drawer state
  mobileMenuOpen: boolean;

  // Confirmation dialog
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    onConfirm: (() => void) | null;
  };

  // Actions
  toggleGameLog: () => void;
  setShowGameLog: (show: boolean) => void;
  toggleSettings: () => void;
  setShowSettings: (show: boolean) => void;
  pinCard: (card: PinnedCard) => void;
  unpinCard: (cardId: string) => void;
  clearPinnedCards: () => void;
  setFullscreenCard: (cardId: string | null) => void;
  addNotification: (
    type: NotificationType,
    title: string,
    message?: string,
    duration?: number
  ) => string;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
  setMobileMenuOpen: (open: boolean) => void;
  showConfirmDialog: (
    title: string,
    message: string,
    onConfirm: () => void
  ) => void;
  hideConfirmDialog: () => void;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

let notificationIdCounter = 0;

function generateNotificationId(): string {
  return `notif_${Date.now()}_${++notificationIdCounter}`;
}

// ------------------------------------------------------------------
// Store
// ------------------------------------------------------------------

export const useUIStore = create<UIStore>((set, get) => ({
  // Initial state
  showGameLog: false,
  showSettings: false,
  pinnedCards: [],
  fullscreenCard: null,
  notifications: [],
  mobileMenuOpen: false,
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    onConfirm: null,
  },

  toggleGameLog: () => {
    set((state) => ({ showGameLog: !state.showGameLog }));
  },

  setShowGameLog: (show) => {
    set({ showGameLog: show });
  },

  toggleSettings: () => {
    set((state) => ({ showSettings: !state.showSettings }));
  },

  setShowSettings: (show) => {
    set({ showSettings: show });
  },

  pinCard: (card) => {
    const { pinnedCards } = get();
    // Don't pin duplicates
    const alreadyPinned = pinnedCards.some((p) => p.cardId === card.cardId);
    if (alreadyPinned) return;

    // Limit to 4 pinned cards
    const maxPinned = 4;
    const updated =
      pinnedCards.length >= maxPinned
        ? [...pinnedCards.slice(1), card]
        : [...pinnedCards, card];

    set({ pinnedCards: updated });
  },

  unpinCard: (cardId) => {
    set((state) => ({
      pinnedCards: state.pinnedCards.filter((p) => p.cardId !== cardId),
    }));
  },

  clearPinnedCards: () => {
    set({ pinnedCards: [] });
  },

  setFullscreenCard: (cardId) => {
    set({ fullscreenCard: cardId });
  },

  addNotification: (type, title, message, duration = 5000) => {
    const id = generateNotificationId();
    const notification: Notification = {
      id,
      type,
      title,
      message,
      duration,
      timestamp: Date.now(),
    };

    set((state) => ({
      notifications: [...state.notifications, notification],
    }));

    // Auto-remove after duration (if not persistent)
    if (duration > 0) {
      setTimeout(() => {
        get().removeNotification(id);
      }, duration);
    }

    return id;
  },

  removeNotification: (id) => {
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    }));
  },

  clearNotifications: () => {
    set({ notifications: [] });
  },

  setMobileMenuOpen: (open) => {
    set({ mobileMenuOpen: open });
  },

  showConfirmDialog: (title, message, onConfirm) => {
    set({
      confirmDialog: {
        open: true,
        title,
        message,
        onConfirm,
      },
    });
  },

  hideConfirmDialog: () => {
    set({
      confirmDialog: {
        open: false,
        title: '',
        message: '',
        onConfirm: null,
      },
    });
  },
}));
