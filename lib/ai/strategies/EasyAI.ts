import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import { GameEngine } from '@/lib/engine/GameEngine';

/**
 * EasyAI -- picks random legal actions.
 * Tends to end phases quickly (after 1-2 actions) to keep games moving.
 */

/** Maximum number of actions to take in a single phase before ending. */
const MAX_PHASE_ACTIONS = 2;

/** Track how many actions we've taken in the current phase. */
let phaseActionCount = 0;
let lastPhase: string | null = null;

export function chooseAction(state: GameState, player: PlayerID): GameAction {
  const actions = GameEngine.getValidActions(state, player);
  if (actions.length === 0) {
    return { type: 'FORFEIT', reason: 'abandon' };
  }

  // If only one option, take it
  if (actions.length === 1) {
    phaseActionCount = 0;
    return actions[0];
  }

  // Reset counter when phase changes
  if (state.phase !== lastPhase) {
    phaseActionCount = 0;
    lastPhase = state.phase;
  }

  // In play or attack phase, tend to end after 1-2 actions
  if (state.phase === 'play' || state.phase === 'attack') {
    phaseActionCount++;

    if (phaseActionCount > MAX_PHASE_ACTIONS) {
      // Look for phase-ending action
      const endAction = actions.find(
        (a) => a.type === 'END_PLAY_PHASE' || a.type === 'END_ATTACK_PHASE',
      );
      if (endAction) {
        phaseActionCount = 0;
        return endAction;
      }
    }
  }

  // Pick a random action
  const idx = Math.floor(Math.random() * actions.length);
  return actions[idx];
}
