import type { GameState, PlayerID } from '../types';
import { getPlayerState, getOpponent } from '../types';

export function canAttackUnit(state: GameState, player: PlayerID, attackerInstanceId: string, targetInstanceId: string): boolean {
  if (state.phase !== 'attack' || state.activePlayer !== player) return false;
  const p = getPlayerState(state, player);
  const opp = getPlayerState(state, getOpponent(player));
  const attacker = p.field.find((u) => u.instanceId === attackerInstanceId);
  const target = opp.field.find((u) => u.instanceId === targetInstanceId);
  if (!attacker || !target) return false;
  return !attacker.isSpent && !attacker.playedThisTurn && target.isSpent;
}

export function canAttackRival(state: GameState, player: PlayerID, attackerInstanceId: string): boolean {
  if (state.phase !== 'attack' || state.activePlayer !== player) return false;
  const p = getPlayerState(state, player);
  const attacker = p.field.find((u) => u.instanceId === attackerInstanceId);
  if (!attacker) return false;
  return !attacker.isSpent && !attacker.playedThisTurn;
}

export function canUseBlocker(state: GameState, player: PlayerID, blockerInstanceId: string): boolean {
  if (state.phase !== 'defense' || !state.currentAttack) return false;
  const defender = getOpponent(state.currentAttack.attackerPlayer);
  if (player !== defender) return false;
  const p = getPlayerState(state, player);
  const blocker = p.field.find((u) => u.instanceId === blockerInstanceId);
  if (!blocker || blocker.isSpent) return false;
  // Check unit or its gear has Blocker keyword
  if (blocker.card.keywords.includes('Blocker')) return true;
  return blocker.gear.some((g) => g.keywords.includes('Blocker'));
}

export function getBlockerUnits(state: GameState, player: PlayerID): string[] {
  const p = getPlayerState(state, player);
  return p.field
    .filter((u) => !u.isSpent && (
      u.card.keywords.includes('Blocker') ||
      u.gear.some((g) => g.keywords.includes('Blocker'))
    ))
    .map((u) => u.instanceId);
}
