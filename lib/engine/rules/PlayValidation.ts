import type { GameState, PlayerID } from '../types';
import { getPlayerState } from '../types';
import { getAvailableEddies } from '../utils';

export function canSellCard(state: GameState, player: PlayerID, cardIndex: number): boolean {
  const p = getPlayerState(state, player);
  if (state.phase !== 'play' || state.activePlayer !== player) return false;
  if (p.hasSoldThisTurn) return false;
  const card = p.hand[cardIndex];
  return !!card && card.sell_tag;
}

export function canCallLegend(state: GameState, player: PlayerID, legendIndex: number): boolean {
  const p = getPlayerState(state, player);
  if (state.phase !== 'play' || state.activePlayer !== player) return false;
  if (p.hasCalledThisTurn) return false;
  if (getAvailableEddies(p) < 2) return false;
  const legend = p.legends[legendIndex];
  return !!legend && !legend.isFaceUp && !legend.isOnField;
}

export function canPlayUnit(state: GameState, player: PlayerID, cardIndex: number): boolean {
  const p = getPlayerState(state, player);
  if (state.phase !== 'play' || state.activePlayer !== player) return false;
  const card = p.hand[cardIndex];
  if (!card || card.card_type !== 'unit') return false;
  return card.cost !== null && card.cost <= getAvailableEddies(p);
}

export function canPlayGear(state: GameState, player: PlayerID, cardIndex: number, targetInstanceId: string): boolean {
  const p = getPlayerState(state, player);
  if (state.phase !== 'play' || state.activePlayer !== player) return false;
  const card = p.hand[cardIndex];
  if (!card || card.card_type !== 'gear') return false;
  if (card.cost === null || card.cost > getAvailableEddies(p)) return false;
  return p.field.some((u) => u.instanceId === targetInstanceId);
}

export function canPlayProgram(state: GameState, player: PlayerID, cardIndex: number): boolean {
  const p = getPlayerState(state, player);
  if (state.phase !== 'play' || state.activePlayer !== player) return false;
  const card = p.hand[cardIndex];
  if (!card || card.card_type !== 'program') return false;
  return card.cost !== null && card.cost <= getAvailableEddies(p);
}

export function canGoSolo(state: GameState, player: PlayerID, legendIndex: number): boolean {
  const p = getPlayerState(state, player);
  if (state.phase !== 'play' || state.activePlayer !== player) return false;
  const legend = p.legends[legendIndex];
  if (!legend || !legend.isFaceUp || legend.isOnField || legend.isSpent) return false;
  if (!legend.card.keywords.includes('Go Solo')) return false;
  return legend.card.cost !== null && legend.card.cost <= getAvailableEddies(p);
}
