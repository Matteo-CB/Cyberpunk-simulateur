import type { CardData, CardColor } from '@/lib/data/types';

export function calculateRAMLimits(legends: CardData[]): Record<CardColor, number> {
  const limits: Record<CardColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const legend of legends) {
    limits[legend.color] += legend.ram;
  }
  return limits;
}

export function canIncludeCard(card: CardData, ramLimits: Record<CardColor, number>): boolean {
  return card.ram <= ramLimits[card.color];
}

export function getRAMUsage(deck: CardData[]): Record<CardColor, number> {
  const usage: Record<CardColor, number> = { red: 0, blue: 0, green: 0, yellow: 0 };
  for (const card of deck) {
    usage[card.color] = Math.max(usage[card.color], card.ram);
  }
  return usage;
}
