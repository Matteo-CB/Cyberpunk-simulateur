'use client';

import type { GamePhase } from '@/lib/engine/types';

interface GameInfoProps {
  turn: number;
  phase: GamePhase;
  activePlayerName: string;
  isMyTurn: boolean;
  overtime: boolean;
}

const PHASE_LABELS: Record<GamePhase, string> = {
  setup: 'SETUP',
  mulligan: 'MULLIGAN',
  ready: 'READY',
  play: 'PLAY',
  attack: 'ATTACK',
  defense: 'DEFENSE',
  gameOver: 'GAME OVER',
};

export default function GameInfo({ turn, phase, activePlayerName, isMyTurn, overtime }: GameInfoProps) {
  return (
    <div className="flex items-center gap-4 px-4 py-2" style={{ background: '#111119', borderBottom: '1px solid #1e2030' }}>
      <div className="font-blender text-sm" style={{ color: '#7a8a9a' }}>
        Turn <span style={{ color: '#e0e8f0' }}>{turn}</span>
      </div>

      <div
        className="font-blender text-xs uppercase tracking-widest px-2 py-1 rounded"
        style={{
          background: isMyTurn ? '#00f0ff15' : '#ff003c15',
          border: `1px solid ${isMyTurn ? '#00f0ff40' : '#ff003c40'}`,
          color: isMyTurn ? '#00f0ff' : '#ff003c',
        }}
      >
        {PHASE_LABELS[phase]}
      </div>

      <div className="font-blender text-sm" style={{ color: '#7a8a9a' }}>
        {isMyTurn ? (
          <span style={{ color: '#00f0ff' }}>Your Turn</span>
        ) : (
          <span>{activePlayerName}&apos;s Turn</span>
        )}
      </div>

      {overtime && (
        <div
          className="font-blender text-xs uppercase tracking-widest px-2 py-1 rounded animate-pulse"
          style={{ background: '#ff003c20', border: '1px solid #ff003c', color: '#ff003c' }}
        >
          OVERTIME
        </div>
      )}
    </div>
  );
}
