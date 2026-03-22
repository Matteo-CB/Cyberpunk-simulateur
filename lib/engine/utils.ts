import type { DieType, GigDie, PlayerState, PassiveTrackers } from './types';

let _counter = 0;

export function generateInstanceId(): string {
  _counter++;
  return `inst_${Date.now()}_${_counter}_${Math.random().toString(36).slice(2, 8)}`;
}

export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

export function generateRoomCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj));
}

export function shuffle<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export function rollDie(dieType: DieType): number {
  const maxValues: Record<DieType, number> = {
    d4: 4, d6: 6, d8: 8, d10: 10, d12: 12, d20: 20,
  };
  return Math.floor(Math.random() * maxValues[dieType]) + 1;
}

export function createGigDice(): GigDie[] {
  const uid = generateInstanceId();
  const dice: GigDie[] = [
    { id: `die_d4_${uid}`, type: 'd4', value: 0, maxValue: 4 },
    { id: `die_d6_${uid}`, type: 'd6', value: 0, maxValue: 6 },
    { id: `die_d8_${uid}`, type: 'd8', value: 0, maxValue: 8 },
    { id: `die_d10_${uid}`, type: 'd10', value: 0, maxValue: 10 },
    { id: `die_d12_${uid}`, type: 'd12', value: 0, maxValue: 12 },
    { id: `die_d20_${uid}`, type: 'd20', value: 0, maxValue: 20 },
  ];
  return dice;
}

export function calculateStreetCred(gigArea: GigDie[]): number {
  return gigArea.reduce((sum, die) => sum + die.value, 0);
}

export function getAvailableEddies(player: PlayerState): number {
  const eddieCount = player.eddies.filter((e) => !e.isSpent).length;
  const legendCount = player.legends.filter((l) => !l.isSpent && !l.isOnField).length;
  return eddieCount + legendCount;
}

export function spendEddies(player: PlayerState, amount: number): boolean {
  let remaining = amount;

  // Spend eddies first
  for (const eddie of player.eddies) {
    if (remaining <= 0) break;
    if (!eddie.isSpent) {
      eddie.isSpent = true;
      remaining--;
    }
  }

  // Then spend legends if needed
  if (remaining > 0) {
    for (const legend of player.legends) {
      if (remaining <= 0) break;
      if (!legend.isSpent && !legend.isOnField) {
        legend.isSpent = true;
        remaining--;
      }
    }
  }

  return remaining <= 0;
}

export function calculateEffectivePower(unit: UnitOnField): number {
  let power = unit.card.power || 0;
  // Add gear power
  for (const gear of unit.gear) {
    power += gear.power || 0;
  }
  // Add temporary modifiers
  power += unit.powerModifiers;
  return Math.max(0, power);
}

export function calculateStealCount(power: number): number {
  return 1 + Math.floor(power / 10);
}

import type { UnitOnField } from './types';

export function createDefaultTrackers(): PassiveTrackers {
  return {
    a001_firstArasakaAttack: { player1: false, player2: false },
    a002_firstBlueCard: { player1: false, player2: false },
    b111_firstSteal: { player1: false, player2: false },
    b125_goroSpendUsed: { player1: false, player2: false },
    b121_removedFromGame: { player1: false, player2: false },
  };
}
