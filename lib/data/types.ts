export type CardType = 'legend' | 'unit' | 'gear' | 'program';
export type CardColor = 'red' | 'blue' | 'green' | 'yellow';

export interface CardEffect {
  type: string;
  description_en: string;
  description_fr: string;
}

export interface CardData {
  id: string;
  print_number: string;
  set: string;
  card_type: CardType;
  color: CardColor;
  name_en: string;
  name_fr: string;
  title_en: string;
  title_fr: string;
  cost: number | null;
  power: number | null;
  ram: number;
  classifications: string[];
  keywords: string[];
  effects: CardEffect[];
  image_file: string;
  data_complete: boolean;
  sell_tag: boolean;
}

export interface SetData {
  code: string;
  name_en: string;
  name_fr: string;
}

export interface CardDatabase {
  sets: Record<string, SetData>;
  cards: Record<string, CardData>;
}
