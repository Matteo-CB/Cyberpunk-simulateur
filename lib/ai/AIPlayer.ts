import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import { getPlayerState, getOpponent } from '@/lib/engine/types';
import { deepClone } from '@/lib/engine/utils';
import { chooseAction as easyChoose } from './strategies/EasyAI';
import { chooseAction as mediumChoose } from './strategies/MediumAI';
import { chooseAction as hardChoose } from './strategies/HardAI';
import { chooseAction as impossibleChoose } from './strategies/ImpossibleAI';

export type AIDifficulty = 'easy' | 'medium' | 'hard' | 'impossible';

export type AIStrategy = (state: GameState, player: PlayerID) => GameAction;

/**
 * Factory: returns the chooseAction function for the requested difficulty.
 */
export function getAI(difficulty: AIDifficulty): AIStrategy {
  switch (difficulty) {
    case 'easy':
      return easyChoose;
    case 'medium':
      return mediumChoose;
    case 'hard':
      return hardChoose;
    case 'impossible':
      return impossibleChoose;
    default:
      return easyChoose;
  }
}

/**
 * Sanitize a game state before passing it to AI evaluation.
 * Hides information the AI player should not have access to:
 *   - Opponent's hand contents (replaced with blank placeholders)
 *   - Opponent's face-down legends (card data wiped)
 *   - Opponent's deck contents
 */
export function sanitizeStateForAI(state: GameState, aiPlayer: PlayerID): GameState {
  const sanitized = deepClone(state);
  const opponentId = getOpponent(aiPlayer);
  const opponent = getPlayerState(sanitized, opponentId);

  // Hide opponent hand: keep the count but remove card data
  opponent.hand = opponent.hand.map((card) => ({
    ...card,
    id: 'hidden',
    name_en: 'Hidden Card',
    name_fr: 'Carte Cachée',
    title_en: '',
    title_fr: '',
    effects: [],
    power: null,
    cost: null,
    classifications: [],
    keywords: [],
    image_file: '',
  }));

  // Hide face-down legends
  opponent.legends = opponent.legends.map((legend) => {
    if (!legend.isFaceUp) {
      return {
        ...legend,
        card: {
          ...legend.card,
          id: 'hidden_legend',
          name_en: 'Hidden Legend',
          name_fr: 'Légende Cachée',
          title_en: '',
          title_fr: '',
          effects: [],
          power: null,
          cost: null,
          classifications: [],
          keywords: [],
          image_file: '',
        },
      };
    }
    return legend;
  });

  // Hide opponent deck (keep count, clear data)
  opponent.deck = opponent.deck.map((card) => ({
    ...card,
    id: 'hidden_deck',
    name_en: 'Hidden Card',
    name_fr: 'Carte Cachée',
    title_en: '',
    title_fr: '',
    effects: [],
    power: null,
    cost: null,
    classifications: [],
    keywords: [],
    image_file: '',
  }));

  return sanitized;
}

/**
 * Main entry point: choose an action for an AI player.
 * Sanitizes the state, then delegates to the appropriate strategy.
 */
export function chooseAction(
  state: GameState,
  player: PlayerID,
  difficulty: AIDifficulty = 'easy',
): GameAction {
  const sanitized = sanitizeStateForAI(state, player);
  const strategy = getAI(difficulty);
  return strategy(sanitized, player);
}
