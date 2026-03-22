import type { CardData, CardColor } from '@/lib/data/types';
import { MIN_DECK_SIZE, MAX_DECK_SIZE, MAX_CARD_COPIES, LEGENDS_PER_PLAYER } from '../types';

export interface DeckValidationResult {
  valid: boolean;
  errors: string[];
}

export function validateDeck(
  mainDeck: CardData[],
  legends: CardData[]
): DeckValidationResult {
  const errors: string[] = [];

  // Check legend count
  if (legends.length !== LEGENDS_PER_PLAYER) {
    errors.push(`Must have exactly ${LEGENDS_PER_PLAYER} Legends (have ${legends.length})`);
  }

  // Check legend types
  for (const legend of legends) {
    if (legend.card_type !== 'legend') {
      errors.push(`${legend.name_en} is not a Legend`);
    }
  }

  // Check unique legend names
  const legendNames = legends.map((l) => l.name_en);
  const uniqueNames = new Set(legendNames);
  if (uniqueNames.size !== legendNames.length) {
    errors.push('Legends must have unique names');
  }

  // Check deck size
  if (mainDeck.length < MIN_DECK_SIZE) {
    errors.push(`Deck must have at least ${MIN_DECK_SIZE} cards (have ${mainDeck.length})`);
  }
  if (mainDeck.length > MAX_DECK_SIZE) {
    errors.push(`Deck must have at most ${MAX_DECK_SIZE} cards (have ${mainDeck.length})`);
  }

  // Check no legends in main deck
  for (const card of mainDeck) {
    if (card.card_type === 'legend') {
      errors.push(`${card.name_en} is a Legend and cannot be in the main deck`);
    }
  }

  // Check max copies
  const cardCounts = new Map<string, number>();
  for (const card of mainDeck) {
    const count = (cardCounts.get(card.id) || 0) + 1;
    cardCounts.set(card.id, count);
    if (count > MAX_CARD_COPIES) {
      errors.push(`${card.name_en} exceeds max ${MAX_CARD_COPIES} copies`);
    }
  }

  // Check RAM limits
  const ramErrors = validateRAM(mainDeck, legends);
  errors.push(...ramErrors);

  return { valid: errors.length === 0, errors };
}

function validateRAM(mainDeck: CardData[], legends: CardData[]): string[] {
  const errors: string[] = [];

  // Calculate total RAM per color from legends
  const ramLimits: Record<CardColor, number> = {
    red: 0, blue: 0, green: 0, yellow: 0,
  };
  for (const legend of legends) {
    ramLimits[legend.color] += legend.ram;
  }

  // Check each card's RAM against limits
  for (const card of mainDeck) {
    const limit = ramLimits[card.color];
    if (limit === 0) {
      errors.push(`${card.name_en} (${card.color}) has no RAM support — need a ${card.color} Legend`);
    } else if (card.ram > limit) {
      errors.push(`${card.name_en} needs ${card.ram} ${card.color} RAM but Legends only provide ${limit}`);
    }
  }

  return errors;
}
