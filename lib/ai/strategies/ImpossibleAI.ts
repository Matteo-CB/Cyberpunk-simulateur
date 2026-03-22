import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import { chooseAction as hardChooseAction } from './HardAI';

/**
 * ImpossibleAI -- deeper evaluation than HardAI.
 * Uses the same multi-turn lookahead engine but with depth 3 instead of 2.
 * Will be replaced with ONNX model inference in the future.
 */

const IMPOSSIBLE_DEPTH = 3;

export function chooseAction(state: GameState, player: PlayerID): GameAction {
  return hardChooseAction(state, player, IMPOSSIBLE_DEPTH);
}
