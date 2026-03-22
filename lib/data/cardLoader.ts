import rawData from './cyberpunk_tcg_complete.json';
import type { CardData, CardDatabase } from './types';

const db = rawData as CardDatabase;

export function getAllCards(): CardData[] {
  return Object.values(db.cards);
}

export function getCardById(id: string): CardData | undefined {
  return db.cards[id];
}

export function getCardsBySet(set: string): CardData[] {
  return getAllCards().filter((c) => c.set === set);
}

export function getCardsByType(type: string): CardData[] {
  return getAllCards().filter((c) => c.card_type === type);
}

export function getCardsByColor(color: string): CardData[] {
  return getAllCards().filter((c) => c.color === color);
}

export function getLegends(): CardData[] {
  return getCardsByType('legend');
}

export function getUnits(): CardData[] {
  return getCardsByType('unit');
}

export function getGear(): CardData[] {
  return getCardsByType('gear');
}

export function getPrograms(): CardData[] {
  return getCardsByType('program');
}

export function getSets() {
  return db.sets;
}

export function getCardImagePath(card: CardData): string {
  return `/images/cards/${card.set}/${card.id}.webp`;
}

export default db;
