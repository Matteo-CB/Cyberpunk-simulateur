import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import { getOpponent } from '@/lib/engine/types';
import { GameEngine } from '@/lib/engine/GameEngine';
import { deepClone } from '@/lib/engine/utils';
import { evaluateBoard } from '@/lib/ai/BoardEvaluator';

/**
 * HardAI -- multi-turn lookahead.
 * Evaluates all valid actions, scores resulting states with BoardEvaluator,
 * and picks the best. Looks 2 actions ahead. Considers opponent's likely
 * best response at each level.
 */

const DEFAULT_DEPTH = 2;

export function chooseAction(
  state: GameState,
  player: PlayerID,
  depth: number = DEFAULT_DEPTH,
): GameAction {
  const actions = GameEngine.getValidActions(state, player);
  if (actions.length === 0) {
    return { type: 'FORFEIT', reason: 'abandon' };
  }
  if (actions.length === 1) return actions[0];

  let bestAction = actions[0];
  let bestScore = -Infinity;

  for (const action of actions) {
    const score = evaluateAction(state, player, action, player, depth);
    if (score > bestScore) {
      bestScore = score;
      bestAction = action;
    }
  }

  return bestAction;
}

/**
 * Recursively evaluate an action by simulating it and scoring the result.
 * Alternates between maximizing (our turn) and minimizing (opponent turn).
 */
function evaluateAction(
  state: GameState,
  actingPlayer: PlayerID,
  action: GameAction,
  evaluatingPlayer: PlayerID,
  depth: number,
): number {
  // Apply the action to get the resulting state
  let nextState: GameState;
  try {
    nextState = GameEngine.applyAction(deepClone(state), actingPlayer, action);
  } catch {
    // If action fails, give it a very low score
    return -10_000;
  }

  // Terminal or depth exhausted: evaluate the board
  if (depth <= 0 || nextState.phase === 'gameOver') {
    return evaluateBoard(nextState, evaluatingPlayer);
  }

  // Determine who acts next
  const nextActing = nextState.activePlayer;
  const nextActions = GameEngine.getValidActions(nextState, nextActing);

  if (nextActions.length === 0) {
    return evaluateBoard(nextState, evaluatingPlayer);
  }

  // Limit branching factor to keep computation reasonable
  const maxBranches = 8;
  const actionsToEvaluate = pruneActions(nextActions, maxBranches);

  if (nextActing === evaluatingPlayer) {
    // Our turn: maximize
    let best = -Infinity;
    for (const nextAction of actionsToEvaluate) {
      const score = evaluateAction(
        nextState, nextActing, nextAction, evaluatingPlayer, depth - 1,
      );
      if (score > best) best = score;
    }
    return best;
  } else {
    // Opponent's turn: minimize (opponent plays their best)
    let worst = Infinity;
    for (const nextAction of actionsToEvaluate) {
      const score = evaluateAction(
        nextState, nextActing, nextAction, evaluatingPlayer, depth - 1,
      );
      if (score < worst) worst = score;
    }
    return worst;
  }
}

/**
 * Prune actions to the most promising N candidates.
 * Keeps phase-ending actions and a sample of others for diversity.
 */
function pruneActions(actions: GameAction[], maxCount: number): GameAction[] {
  if (actions.length <= maxCount) return actions;

  const result: GameAction[] = [];

  // Always keep phase-ending / critical actions
  const criticalTypes = new Set(['END_PLAY_PHASE', 'END_ATTACK_PHASE', 'DECLINE_DEFENSE', 'MULLIGAN', 'CHOOSE_GIG_DIE']);
  const critical = actions.filter((a) => criticalTypes.has(a.type));
  for (const c of critical) {
    if (result.length < maxCount) result.push(c);
  }

  // Fill the rest with a diverse sample
  const criticalSet = new Set(critical);
  const remaining = actions.filter((a) => !criticalSet.has(a));
  // Prioritise by type variety
  const byType = new Map<string, GameAction[]>();
  for (const a of remaining) {
    const existing = byType.get(a.type) || [];
    existing.push(a);
    byType.set(a.type, existing);
  }

  // Take up to 2 from each type
  for (const [, typeActions] of byType) {
    for (let i = 0; i < Math.min(2, typeActions.length); i++) {
      if (result.length < maxCount) result.push(typeActions[i]);
    }
  }

  return result;
}
