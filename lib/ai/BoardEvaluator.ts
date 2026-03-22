import type { GameState, PlayerID } from '@/lib/engine/types';
import { getPlayerState, getOpponent } from '@/lib/engine/types';
import { calculateEffectivePower, getAvailableEddies } from '@/lib/engine/utils';

/**
 * Weights used to score board positions.
 * Positive values benefit the evaluated player; negative values penalize.
 */
const WEIGHT = {
  GIG_COUNT: 100,
  STREET_CRED: 2,
  FIELD_POWER: 5,
  HAND_SIZE: 3,
  EDDIES: 4,
  OPP_GIG_COUNT: -100,
  OPP_FIELD_POWER: -5,
  WIN_BONUS: 10_000,
  LOSS_PENALTY: -10_000,
} as const;

/**
 * Evaluate a game state from the perspective of a given player.
 * Returns a numeric score -- higher is better for that player.
 */
export function evaluateBoard(state: GameState, player: PlayerID): number {
  // Terminal states
  if (state.phase === 'gameOver') {
    if (state.winner === player) return WEIGHT.WIN_BONUS;
    if (state.winner === 'draw') return 0;
    return WEIGHT.LOSS_PENALTY;
  }

  const me = getPlayerState(state, player);
  const opp = getPlayerState(state, getOpponent(player));

  let score = 0;

  // Gig count -- primary victory condition
  score += me.gigArea.length * WEIGHT.GIG_COUNT;
  score += opp.gigArea.length * WEIGHT.OPP_GIG_COUNT;

  // Street Cred (sum of gig die values)
  score += me.streetCred * WEIGHT.STREET_CRED;

  // Field presence -- sum of effective power of all units
  const myFieldPower = me.field.reduce(
    (sum, unit) => sum + calculateEffectivePower(unit),
    0,
  );
  const oppFieldPower = opp.field.reduce(
    (sum, unit) => sum + calculateEffectivePower(unit),
    0,
  );
  score += myFieldPower * WEIGHT.FIELD_POWER;
  score += oppFieldPower * WEIGHT.OPP_FIELD_POWER;

  // Hand size -- more options = better
  score += me.hand.length * WEIGHT.HAND_SIZE;

  // Available eddies -- economy
  score += getAvailableEddies(me) * WEIGHT.EDDIES;

  return score;
}
