'use client';

import type { CardData } from '@/lib/data/types';

interface GearAttachedProps {
  gear: CardData[];
  onClick?: (card: CardData) => void;
}

export default function GearAttached({ gear, onClick }: GearAttachedProps) {
  if (gear.length === 0) return null;

  return (
    <div className="flex gap-1">
      {gear.map((g, i) => (
        <div
          key={i}
          className="flex items-center gap-1 px-1.5 py-0.5 rounded cursor-pointer font-blender text-[9px] uppercase tracking-wider transition-all hover:brightness-125"
          style={{
            background: '#111119',
            border: '1px solid #fcee0950',
            color: '#fcee09',
          }}
          onClick={() => onClick?.(g)}
          title={g.name_en}
        >
          <span>+{g.power || 0}</span>
          <span style={{ color: '#7a8a9a' }}>{g.name_en.slice(0, 8)}</span>
        </div>
      ))}
    </div>
  );
}
