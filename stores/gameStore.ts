import { create } from 'zustand';
import type {
  GameState,
  GameAction,
  PlayerID,
  GamePhase,
} from '@/lib/engine/types';
import { GameEngine } from '@/lib/engine/GameEngine';
import type { CardData } from '@/lib/data/types';

// ------------------------------------------------------------------
// Types
// ------------------------------------------------------------------

export type AnimationType =
  | 'card-play'
  | 'card-draw'
  | 'attack'
  | 'damage'
  | 'heal'
  | 'steal-gig'
  | 'defeat'
  | 'rank-up'
  | 'game-over'
  | 'dice-roll'
  | 'legend-call'
  | 'sell'
  | 'go-solo';

export interface QueuedAnimation {
  id: string;
  type: AnimationType;
  data: Record<string, unknown>;
  duration: number; // ms
  timestamp: number;
}

/**
 * The visible state is a derived, sanitized version of the full game state
 * that hides the opponent's hand and deck contents.
 */
export interface VisibleGameState {
  gameId: string;
  turn: number;
  phase: GamePhase;
  activePlayer: PlayerID;
  myPlayer: PlayerID;
  myState: GameState['player1'];
  opponentState: Omit<GameState['player2'], 'deck' | 'hand'> & {
    deckCount: number;
    handCount: number;
  };
  log: GameState['log'];
  pendingEffects: GameState['pendingEffects'];
  pendingActions: GameState['pendingActions'];
  overtime: boolean;
  currentAttack?: GameState['currentAttack'];
  winner?: GameState['winner'];
  winReason?: GameState['winReason'];
}

export interface GameStore {
  // State
  gameState: GameState | null;
  visibleState: VisibleGameState | null;
  isMyTurn: boolean;
  myPlayerID: PlayerID;
  selectedCard: { index: number; source: 'hand' | 'field' | 'legend' } | null;
  animationQueue: QueuedAnimation[];
  isProcessingAction: boolean;
  isConnectedOnline: boolean;
  roomCode: string | null;

  // Actions
  startAIGame: (
    playerDeck: CardData[],
    playerLegends: CardData[],
    aiDeck: CardData[],
    aiLegends: CardData[],
    userId: string,
    aiDifficulty: 'easy' | 'medium' | 'hard' | 'impossible'
  ) => void;
  setGameState: (state: GameState) => void;
  performAction: (action: GameAction) => void;
  updateOnlineState: (state: GameState, myPlayer: PlayerID) => void;
  setSelectedCard: (
    selection: { index: number; source: 'hand' | 'field' | 'legend' } | null
  ) => void;
  clearSelection: () => void;
  queueAnimation: (
    type: AnimationType,
    data: Record<string, unknown>,
    duration?: number
  ) => void;
  dequeueAnimation: () => void;
  clearAnimations: () => void;
  setRoomCode: (code: string | null) => void;
  setOnlineConnected: (connected: boolean) => void;
  resetGame: () => void;
}

// ------------------------------------------------------------------
// Helpers
// ------------------------------------------------------------------

let animationIdCounter = 0;

function generateAnimationId(): string {
  return `anim_${Date.now()}_${++animationIdCounter}`;
}

/**
 * Build the visible (sanitized) state from the full game state,
 * hiding the opponent's hand and deck details.
 */
function buildVisibleState(
  gameState: GameState,
  myPlayer: PlayerID
): VisibleGameState {
  const isPlayer1 = myPlayer === 'player1';
  const myState = isPlayer1 ? gameState.player1 : gameState.player2;
  const oppState = isPlayer1 ? gameState.player2 : gameState.player1;

  return {
    gameId: gameState.gameId,
    turn: gameState.turn,
    phase: gameState.phase,
    activePlayer: gameState.activePlayer,
    myPlayer,
    myState,
    opponentState: {
      id: oppState.id,
      userId: oppState.userId,
      isAI: oppState.isAI,
      aiDifficulty: oppState.aiDifficulty,
      trash: oppState.trash,
      field: oppState.field,
      legends: oppState.legends,
      eddies: oppState.eddies,
      fixerArea: oppState.fixerArea,
      gigArea: oppState.gigArea,
      streetCred: oppState.streetCred,
      hasSoldThisTurn: oppState.hasSoldThisTurn,
      hasCalledThisTurn: oppState.hasCalledThisTurn,
      hasCalledInDefenseThisTurn: oppState.hasCalledInDefenseThisTurn,
      hasMulliganed: oppState.hasMulliganed,
      deckCount: oppState.deck.length,
      handCount: oppState.hand.length,
    },
    log: gameState.log,
    pendingEffects: gameState.pendingEffects,
    pendingActions: gameState.pendingActions,
    overtime: gameState.overtime,
    currentAttack: gameState.currentAttack,
    winner: gameState.winner,
    winReason: gameState.winReason,
  };
}

// ------------------------------------------------------------------
// Store
// ------------------------------------------------------------------

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  gameState: null,
  visibleState: null,
  isMyTurn: false,
  myPlayerID: 'player1',
  selectedCard: null,
  animationQueue: [],
  isProcessingAction: false,
  isConnectedOnline: false,
  roomCode: null,

  startAIGame: (
    playerDeck,
    playerLegends,
    aiDeck,
    aiLegends,
    userId,
    aiDifficulty
  ) => {
    const gameState = GameEngine.createGame(
      playerDeck,
      playerLegends,
      aiDeck,
      aiLegends,
      {
        player1UserId: userId,
        isAI: true,
        aiDifficulty,
      }
    );

    const myPlayer: PlayerID = 'player1';
    const visibleState = buildVisibleState(gameState, myPlayer);

    set({
      gameState,
      visibleState,
      myPlayerID: myPlayer,
      isMyTurn: gameState.activePlayer === myPlayer,
      selectedCard: null,
      animationQueue: [],
      isProcessingAction: false,
    });
  },

  setGameState: (state) => {
    const { myPlayerID } = get();
    set({
      gameState: state,
      visibleState: buildVisibleState(state, myPlayerID),
      isMyTurn: state.activePlayer === myPlayerID,
    });
  },

  performAction: (action) => {
    const { gameState, myPlayerID } = get();
    if (!gameState) return;
    if (gameState.phase === 'gameOver') return;

    set({ isProcessingAction: true });

    try {
      const newState = GameEngine.applyAction(gameState, myPlayerID, action);
      const visibleState = buildVisibleState(newState, myPlayerID);

      set({
        gameState: newState,
        visibleState,
        isMyTurn: newState.activePlayer === myPlayerID,
        selectedCard: null,
        isProcessingAction: false,
      });

      // If it's an AI game and it's now the AI's turn, the AI logic
      // should be triggered externally (e.g., by a useEffect in the game component).
    } catch (error) {
      console.error('[gameStore] Error performing action:', error);
      set({ isProcessingAction: false });
    }
  },

  updateOnlineState: (state, myPlayer) => {
    set({
      gameState: state,
      visibleState: buildVisibleState(state, myPlayer),
      myPlayerID: myPlayer,
      isMyTurn: state.activePlayer === myPlayer,
      isConnectedOnline: true,
    });
  },

  setSelectedCard: (selection) => {
    set({ selectedCard: selection });
  },

  clearSelection: () => {
    set({ selectedCard: null });
  },

  queueAnimation: (type, data, duration = 600) => {
    const animation: QueuedAnimation = {
      id: generateAnimationId(),
      type,
      data,
      duration,
      timestamp: Date.now(),
    };
    set((state) => ({
      animationQueue: [...state.animationQueue, animation],
    }));
  },

  dequeueAnimation: () => {
    set((state) => ({
      animationQueue: state.animationQueue.slice(1),
    }));
  },

  clearAnimations: () => {
    set({ animationQueue: [] });
  },

  setRoomCode: (code) => {
    set({ roomCode: code });
  },

  setOnlineConnected: (connected) => {
    set({ isConnectedOnline: connected });
  },

  resetGame: () => {
    set({
      gameState: null,
      visibleState: null,
      isMyTurn: false,
      myPlayerID: 'player1',
      selectedCard: null,
      animationQueue: [],
      isProcessingAction: false,
      isConnectedOnline: false,
      roomCode: null,
    });
  },
}));
