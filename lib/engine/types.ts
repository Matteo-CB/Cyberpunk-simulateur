import type { CardData } from '@/lib/data/types';

export type PlayerID = 'player1' | 'player2';
export type GamePhase = 'setup' | 'mulligan' | 'ready' | 'play' | 'attack' | 'defense' | 'gameOver';
export type DieType = 'd4' | 'd6' | 'd8' | 'd10' | 'd12' | 'd20';

export const DIE_TYPES: { type: DieType; maxValue: number }[] = [
  { type: 'd4', maxValue: 4 },
  { type: 'd6', maxValue: 6 },
  { type: 'd8', maxValue: 8 },
  { type: 'd10', maxValue: 10 },
  { type: 'd12', maxValue: 12 },
  { type: 'd20', maxValue: 20 },
];

export const STARTING_HAND_SIZE = 6;
export const WIN_GIG_COUNT = 6;
export const LEGENDS_PER_PLAYER = 3;
export const MIN_DECK_SIZE = 40;
export const MAX_DECK_SIZE = 50;
export const MAX_CARD_COPIES = 3;
export const CALL_COST = 2;
export const HIDDEN_PLAY_COST = 1;
export const STEAL_POWER_THRESHOLD = 10;

export interface GigDie {
  id: string;
  type: DieType;
  value: number;
  maxValue: number;
  stolenFrom?: PlayerID;
}

export interface EddyCard {
  instanceId: string;
  originalCard: CardData;
  isSpent: boolean;
}

export interface UnitOnField {
  instanceId: string;
  card: CardData;
  isSpent: boolean;
  gear: CardData[];
  gearInstanceIds: string[];
  powerModifiers: number;
  playedThisTurn: boolean;
  controlledBy: PlayerID;
  originalOwner: PlayerID;
  isGoSoloLegend: boolean;
  legendSlotIndex?: number;
  canAttackThisTurn?: boolean;
  temporaryBlocker?: boolean;
}

export interface LegendSlot {
  card: CardData;
  isFaceUp: boolean;
  isSpent: boolean;
  isOnField: boolean;
  goSoloInstanceId?: string;
}

export interface PlayerState {
  id: PlayerID;
  userId: string | null;
  isAI: boolean;
  aiDifficulty?: 'easy' | 'medium' | 'hard' | 'impossible';
  deck: CardData[];
  hand: CardData[];
  trash: CardData[];
  field: UnitOnField[];
  legends: LegendSlot[];
  eddies: EddyCard[];
  fixerArea: GigDie[];
  gigArea: GigDie[];
  streetCred: number;
  hasSoldThisTurn: boolean;
  hasCalledThisTurn: boolean;
  hasCalledInDefenseThisTurn: boolean;
  hasMulliganed: boolean;
}

export interface PendingEffect {
  id: string;
  sourceCardId: string;
  sourceInstanceId: string;
  effectType: string;
  sourcePlayer: PlayerID;
  requiresTargetSelection: boolean;
  validTargets: string[];
  isOptional: boolean;
  resolved: boolean;
}

export interface PendingAction {
  id: string;
  type: 'SELECT_TARGET' | 'CHOOSE_CARD' | 'SELECT_GIG' | 'CHOOSE_EFFECT' | 'CHOOSE_DIRECTION' | 'VIEW_CARD' | 'CONFIRM_EFFECT';
  player: PlayerID;
  description: string;
  descriptionKey?: string;
  resultDescription?: string;
  options: string[];
  optionLabels?: string[];
  optionCardIds?: string[];
  minSelections: number;
  maxSelections: number;
  isOptional?: boolean;
  sourceCardId?: string;
  sourceHandlerId?: string;
  metadata?: Record<string, unknown>;
}

export interface GameLogEntry {
  turn: number;
  phase: GamePhase;
  player: PlayerID;
  action: string;
  details?: Record<string, unknown>;
  timestamp: number;
}

export interface AttackState {
  attackerInstanceId: string;
  attackerPlayer: PlayerID;
  targetType: 'unit' | 'rival';
  targetInstanceId?: string;
  blockerInstanceId?: string;
  wasBlocked?: boolean;
  phase: 'offensive' | 'defensive' | 'resolution';
  resolved: boolean;
}

export interface EndOfTurnEffect {
  unitInstanceId: string;
  ownerPlayer: PlayerID;
  effect: 'defeat';
  sourceCardId: string;
}

export interface PassiveTrackers {
  a001_firstArasakaAttack: { player1: boolean; player2: boolean };
  a002_firstBlueCard: { player1: boolean; player2: boolean };
  b111_firstSteal: { player1: boolean; player2: boolean };
  b125_goroSpendUsed: { player1: boolean; player2: boolean };
  b121_removedFromGame: { player1: boolean; player2: boolean };
}

export interface EffectAnimationData {
  cardId: string;
  cardName: string;
  triggerType: string;
  description: string;
  resultDescription?: string;
  player: PlayerID;
  timestamp: number;
}

export interface GameState {
  gameId: string;
  turn: number;
  phase: GamePhase;
  activePlayer: PlayerID;
  player1: PlayerState;
  player2: PlayerState;
  log: GameLogEntry[];
  pendingEffects: PendingEffect[];
  pendingActions: PendingAction[];
  overtime: boolean;
  lastGigTakenThisTurn: { player1: boolean; player2: boolean };
  currentAttack?: AttackState;
  winner?: PlayerID | 'draw';
  winReason?: 'gigs' | 'deckout' | 'overtime' | 'forfeit';
  endOfTurnEffects: EndOfTurnEffect[];
  passiveTrackers: PassiveTrackers;
  effectAnimationQueue: EffectAnimationData[];
}

export type GameAction =
  | { type: 'SELL_CARD'; cardIndex: number }
  | { type: 'CALL_LEGEND'; legendIndex: number }
  | { type: 'PLAY_UNIT'; cardIndex: number }
  | { type: 'PLAY_GEAR'; cardIndex: number; targetInstanceId: string }
  | { type: 'PLAY_PROGRAM'; cardIndex: number }
  | { type: 'GO_SOLO'; legendIndex: number }
  | { type: 'END_PLAY_PHASE' }
  | { type: 'ATTACK_UNIT'; attackerInstanceId: string; targetInstanceId: string }
  | { type: 'ATTACK_RIVAL'; attackerInstanceId: string }
  | { type: 'USE_BLOCKER'; blockerInstanceId: string }
  | { type: 'CALL_LEGEND_DEFENSE'; legendIndex: number }
  | { type: 'DECLINE_DEFENSE' }
  | { type: 'SELECT_GIG_TO_STEAL'; gigDieIndex: number }
  | { type: 'END_ATTACK_PHASE' }
  | { type: 'CHOOSE_GIG_DIE'; dieIndex: number }
  | { type: 'MULLIGAN'; doMulligan: boolean }
  | { type: 'SELECT_TARGET'; pendingActionId: string; selectedTargets: string[] }
  | { type: 'DECLINE_OPTIONAL_EFFECT'; pendingEffectId: string }
  | { type: 'FORFEIT'; reason: 'abandon' | 'timeout' }
  | { type: 'ACTIVATE_SPEND_ABILITY'; unitInstanceId: string };

export function getOpponent(player: PlayerID): PlayerID {
  return player === 'player1' ? 'player2' : 'player1';
}

export function getPlayerState(state: GameState, player: PlayerID): PlayerState {
  return player === 'player1' ? state.player1 : state.player2;
}

export function setPlayerState(state: GameState, player: PlayerID, playerState: PlayerState): void {
  if (player === 'player1') state.player1 = playerState;
  else state.player2 = playerState;
}
