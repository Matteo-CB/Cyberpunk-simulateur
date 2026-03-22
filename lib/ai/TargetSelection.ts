import type { GameState, PlayerID, UnitOnField, GigDie } from '@/lib/engine/types';
import { getPlayerState, getOpponent } from '@/lib/engine/types';
import { calculateEffectivePower } from '@/lib/engine/utils';

export interface ScoredTarget {
  /** Instance ID of the target unit (for unit attacks) or gig die index (for steal). */
  id: string;
  score: number;
}

/**
 * Score each spent enemy unit as a potential attack target.
 * Lower-power enemies are prioritised (easier to defeat).
 * Returns targets sorted best-first (highest score first).
 */
export function scoreAttackTargets(
  state: GameState,
  attackerPlayer: PlayerID,
  attackerInstanceId: string,
): ScoredTarget[] {
  const me = getPlayerState(state, attackerPlayer);
  const opp = getPlayerState(state, getOpponent(attackerPlayer));

  const attacker = me.field.find((u) => u.instanceId === attackerInstanceId);
  if (!attacker) return [];

  const attackerPower = calculateEffectivePower(attacker);
  const targets: ScoredTarget[] = [];

  for (const target of opp.field) {
    if (!target.isSpent) continue; // can only attack spent units

    const targetPower = calculateEffectivePower(target);
    let score = 0;

    if (attackerPower > targetPower) {
      // We win this fight -- prefer killing high-value targets cheaply
      score = 100 + (targetPower * 2) - (targetPower); // net gain
      // Bonus for targets carrying gear
      score += target.gear.length * 15;
      // Bonus for Go Solo legends
      if (target.isGoSoloLegend) score += 50;
    } else if (attackerPower === targetPower) {
      // Mutual defeat -- only worthwhile if target is more valuable
      const targetValue = targetPower + target.gear.length * 10 + (target.isGoSoloLegend ? 40 : 0);
      const attackerValue = attackerPower + attacker.gear.length * 10 + (attacker.isGoSoloLegend ? 40 : 0);
      score = targetValue > attackerValue ? 20 : -20;
    } else {
      // We lose -- negative score
      score = -(targetPower - attackerPower) * 10;
    }

    targets.push({ id: target.instanceId, score });
  }

  // Sort best first
  targets.sort((a, b) => b.score - a.score);
  return targets;
}

/**
 * Score each opponent gig die for stealing.
 * Higher-value dice are prioritised.
 * Returns sorted best-first.
 */
export function scoreGigDieTargets(
  state: GameState,
  stealingPlayer: PlayerID,
): ScoredTarget[] {
  const opp = getPlayerState(state, getOpponent(stealingPlayer));
  const targets: ScoredTarget[] = [];

  for (let i = 0; i < opp.gigArea.length; i++) {
    const die = opp.gigArea[i];
    // Prefer stealing high-value dice
    let score = die.value * 10 + die.maxValue;
    // Extra value for dice that were already stolen (deny the thief)
    if (die.stolenFrom) score += 5;
    targets.push({ id: String(i), score });
  }

  targets.sort((a, b) => b.score - a.score);
  return targets;
}

/**
 * Evaluate whether attacking the rival directly is advisable.
 * Returns a score; higher = more desirable.
 */
export function scoreRivalAttack(
  state: GameState,
  attackerPlayer: PlayerID,
  attackerInstanceId: string,
): number {
  const me = getPlayerState(state, attackerPlayer);
  const opp = getPlayerState(state, getOpponent(attackerPlayer));

  const attacker = me.field.find((u) => u.instanceId === attackerInstanceId);
  if (!attacker) return -1000;

  const attackerPower = calculateEffectivePower(attacker);

  // No gigs to steal -- pointless
  if (opp.gigArea.length === 0) return -500;

  let score = 50; // base value for going for the win condition

  // Higher power = steal more dice
  score += attackerPower * 3;

  // Bonus if opponent has no ready blockers
  const readyBlockers = opp.field.filter(
    (u) => !u.isSpent && (u.card.keywords.includes('Blocker') || u.gear.some((g) => g.keywords.includes('Blocker'))),
  );
  if (readyBlockers.length === 0) score += 80;
  else score -= readyBlockers.length * 30;

  // Bonus if stealing would give us 6+ gigs (win condition)
  const stealCount = 1 + Math.floor(attackerPower / 10);
  if (me.gigArea.length + stealCount >= 6) score += 200;

  return score;
}
