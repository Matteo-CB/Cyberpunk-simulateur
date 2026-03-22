import { getAllCards } from './cardLoader';
import type { CardData, CardColor, CardType } from './types';

let _byId: Map<string, CardData> | null = null;
let _byColor: Map<CardColor, CardData[]> | null = null;
let _byType: Map<CardType, CardData[]> | null = null;
let _byClassification: Map<string, CardData[]> | null = null;
let _byKeyword: Map<string, CardData[]> | null = null;

function ensureIndexes() {
  if (_byId) return;

  const cards = getAllCards();
  _byId = new Map();
  _byColor = new Map();
  _byType = new Map();
  _byClassification = new Map();
  _byKeyword = new Map();

  for (const card of cards) {
    _byId.set(card.id, card);

    if (!_byColor.has(card.color)) _byColor.set(card.color, []);
    _byColor.get(card.color)!.push(card);

    if (!_byType.has(card.card_type)) _byType.set(card.card_type, []);
    _byType.get(card.card_type)!.push(card);

    for (const cls of card.classifications) {
      if (!_byClassification.has(cls)) _byClassification.set(cls, []);
      _byClassification.get(cls)!.push(card);
    }

    for (const kw of card.keywords) {
      if (!_byKeyword.has(kw)) _byKeyword.set(kw, []);
      _byKeyword.get(kw)!.push(card);
    }
  }
}

export function cardById(id: string): CardData | undefined {
  ensureIndexes();
  return _byId!.get(id);
}

export function cardsByColor(color: CardColor): CardData[] {
  ensureIndexes();
  return _byColor!.get(color) || [];
}

export function cardsByType(type: CardType): CardData[] {
  ensureIndexes();
  return _byType!.get(type) || [];
}

export function cardsByClassification(cls: string): CardData[] {
  ensureIndexes();
  return _byClassification!.get(cls) || [];
}

export function cardsByKeyword(kw: string): CardData[] {
  ensureIndexes();
  return _byKeyword!.get(kw) || [];
}

export function allClassifications(): string[] {
  ensureIndexes();
  return Array.from(_byClassification!.keys()).sort();
}

export function allKeywords(): string[] {
  ensureIndexes();
  return Array.from(_byKeyword!.keys()).sort();
}
