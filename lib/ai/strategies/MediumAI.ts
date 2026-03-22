import type { GameState, GameAction, PlayerID } from '@/lib/engine/types';
import { getPlayerState, getOpponent } from '@/lib/engine/types';
import { GameEngine } from '@/lib/engine/GameEngine';
import { calculateEffectivePower, getAvailableEddies } from '@/lib/engine/utils';
import { evaluateBoard } from '@/lib/ai/BoardEvaluator';
import { scoreAttackTargets, scoreRivalAttack } from '@/lib/ai/TargetSelection';

/**
 * MediumAI -- greedy heuristic.
 * Priorities:
 *   1) Play high-power units
 *   2) Equip gear to strongest unit
 *   3) Attack weakest spent enemies
 *   4) Attack rival if no blockers
 *   5) Sell cards for eddies when needed
 */
export function chooseAction(state: GameState, player: PlayerID): GameAction {
  const actions = GameEngine.getValidActions(state, player);
  if (actions.length === 0) {
    return { type: 'FORFEIT', reason: 'abandon' };
  }
  if (actions.length === 1) return actions[0];

  const me = getPlayerState(state, player);
  const opp = getPlayerState(state, getOpponent(player));

  // --- Mulligan: keep hand if average cost <= 3, otherwise mulligan ---
  if (state.phase === 'mulligan') {
    const avgCost =
      me.hand.reduce((s, c) => s + (c.cost ?? 0), 0) / Math.max(me.hand.length, 1);
    return avgCost > 3
      ? { type: 'MULLIGAN', doMulligan: true }
      : { type: 'MULLIGAN', doMulligan: false };
  }

  // --- Ready phase: pick the smallest available die (save d20 for last) ---
  if (state.phase === 'ready') {
    const chooseDie = actions.filter((a) => a.type === 'CHOOSE_GIG_DIE');
    if (chooseDie.length > 0) return chooseDie[0]; // already sorted smallest-first by engine
  }

  // --- Play phase ---
  if (state.phase === 'play') {
    return chooseBestPlayAction(state, player, actions, me);
  }

  // --- Attack phase ---
  if (state.phase === 'attack') {
    return chooseBestAttackAction(state, player, actions);
  }

  // --- Defense phase ---
  if (state.phase === 'defense') {
    return chooseBestDefenseAction(state, player, actions);
  }

  // --- Pending target selection (gig steal, etc.) ---
  if (actions.length > 0 && actions[0].type === 'SELECT_TARGET') {
    // Pick the first option (could be enhanced with target scoring)
    return actions[0];
  }

  // Fallback: pick first action
  return actions[0];
}

function chooseBestPlayAction(
  state: GameState,
  player: PlayerID,
  actions: GameAction[],
  me: ReturnType<typeof getPlayerState>,
): GameAction {
  const eddies = getAvailableEddies(me);

  // 1) Sell a card if we have no eddies and have a sellable card
  if (eddies === 0) {
    const sellAction = actions.find((a) => a.type === 'SELL_CARD');
    if (sellAction) return sellAction;
  }

  // 2) Play the highest-power unit we can afford
  const unitActions = actions.filter((a) => a.type === 'PLAY_UNIT');
  if (unitActions.length > 0) {
    let bestUnit = unitActions[0];
    let bestPower = -1;
    for (const ua of unitActions) {
      if (ua.type !== 'PLAY_UNIT') continue;
      const card = me.hand[ua.cardIndex];
      if (card && (card.power ?? 0) > bestPower) {
        bestPower = card.power ?? 0;
        bestUnit = ua;
      }
    }
    return bestUnit;
  }

  // 3) Equip gear to strongest unit on field
  const gearActions = actions.filter((a) => a.type === 'PLAY_GEAR');
  if (gearActions.length > 0) {
    let bestGear = gearActions[0];
    let bestTargetPower = -1;
    for (const ga of gearActions) {
      if (ga.type !== 'PLAY_GEAR') continue;
      const target = me.field.find((u) => u.instanceId === ga.targetInstanceId);
      if (target) {
        const p = calculateEffectivePower(target);
        if (p > bestTargetPower) {
          bestTargetPower = p;
          bestGear = ga;
        }
      }
    }
    return bestGear;
  }

  // 4) Play programs
  const programAction = actions.find((a) => a.type === 'PLAY_PROGRAM');
  if (programAction) return programAction;

  // 5) Call legend if we can afford it
  const callAction = actions.find((a) => a.type === 'CALL_LEGEND');
  if (callAction) return callAction;

  // 6) Go Solo if available
  const goSoloAction = actions.find((a) => a.type === 'GO_SOLO');
  if (goSoloAction) return goSoloAction;

  // 7) Sell if we still can and have nothing better
  const sellAction = actions.find((a) => a.type === 'SELL_CARD');
  if (sellAction && eddies <= 1) return sellAction;

  // 8) End play phase
  return { type: 'END_PLAY_PHASE' };
}

function chooseBestAttackAction(
  state: GameState,
  player: PlayerID,
  actions: GameAction[],
): GameAction {
  const me = getPlayerState(state, player);
  const opp = getPlayerState(state, getOpponent(player));

  let bestAction: GameAction | null = null;
  let bestScore = -Infinity;

  for (const action of actions) {
    if (action.type === 'END_ATTACK_PHASE') continue;

    if (action.type === 'ATTACK_UNIT') {
      const targets = scoreAttackTargets(state, player, action.attackerInstanceId);
      const match = targets.find((t) => t.id === action.targetInstanceId);
      if (match && match.score > bestScore) {
        bestScore = match.score;
        bestAction = action;
      }
    }

    if (action.type === 'ATTACK_RIVAL') {
      const rivalScore = scoreRivalAttack(state, player, action.attackerInstanceId);
      if (rivalScore > bestScore) {
        bestScore = rivalScore;
        bestAction = action;
      }
    }
  }

  // Only attack if score is positive (worthwhile)
  if (bestAction && bestScore > 0) return bestAction;

  return { type: 'END_ATTACK_PHASE' };
}

function chooseBestDefenseAction(
  state: GameState,
  player: PlayerID,
  actions: GameAction[],
): GameAction {
  // Use a blocker if we have one -- it's almost always beneficial
  const blockerAction = actions.find((a) => a.type === 'USE_BLOCKER');
  if (blockerAction) return blockerAction;

  // Call a legend in defense if we can
  const callAction = actions.find((a) => a.type === 'CALL_LEGEND_DEFENSE');
  if (callAction) return callAction;

  return { type: 'DECLINE_DEFENSE' };
}
