'use client';

import { useRef, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import type { GameLogEntry } from '@/lib/engine/types';

const ACTION_COLORS: Record<string, string> = {
  GAME_START: '#00f0ff',
  TURN_START: '#00f0ff',
  GAIN_GIG: '#22c55e',
  SELL_CARD: '#fcee09',
  CALL_LEGEND: '#a855f7',
  PLAY_UNIT: '#3b82f6',
  PLAY_GEAR: '#fcee09',
  PLAY_PROGRAM: '#ff003c',
  GO_SOLO: '#ffd700',
  ATTACK_UNIT: '#ff003c',
  ATTACK_RIVAL: '#ff003c',
  FIGHT: '#ff003c',
  STEAL_GIG: '#22c55e',
  DEFEAT: '#ff003c',
  USE_BLOCKER: '#a855f7',
  WIN: '#ffd700',
  FORFEIT: '#555',
  END_PLAY_PHASE: '#7a8a9a',
  MULLIGAN: '#7a8a9a',
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function formatLog(entry: GameLogEntry, t: any): string {
  const p = entry.player === 'player1' ? t('log.p1') : t('log.p2');
  const d = entry.details || {};

  switch (entry.action) {
    case 'GAME_START': return t('log.gameStart', { player: d.firstPlayer === 'player1' ? t('log.p1') : t('log.p2') });
    case 'TURN_START': return t('log.turn', { turn: d.turn });
    case 'GAIN_GIG': return t('log.gainGig', { player: p, die: d.dieType, value: d.value });
    case 'SELL_CARD': return t('log.sellCard', { player: p, card: d.cardName });
    case 'CALL_LEGEND': return t('log.callLegend', { player: p, card: d.cardName });
    case 'PLAY_UNIT': return t('log.playUnit', { player: p, card: d.cardName, cost: d.cost });
    case 'PLAY_GEAR': return t('log.playGear', { player: p, card: d.cardName, target: d.targetName });
    case 'PLAY_PROGRAM': return t('log.playProgram', { player: p, card: d.cardName });
    case 'GO_SOLO': return t('log.goSolo', { player: p, card: d.cardName });
    case 'ATTACK_UNIT': return t('log.attackUnit', { player: p, target: d.targetName, attacker: d.attackerName });
    case 'ATTACK_RIVAL': return t('log.attackRival', { player: p, attacker: d.attackerName });
    case 'FIGHT': return t('log.fight', { attacker: d.attackerName, aPower: d.attackerPower, target: d.targetName, tPower: d.targetPower });
    case 'DEFEAT': return t('log.defeat', { name: d.defeated });
    case 'MUTUAL_DEFEAT': return t('log.mutualDefeat', { unit1: d.unit1, unit2: d.unit2 });
    case 'STEAL_GIG': return t('log.stealGig', { player: p, die: d.dieType, value: d.value });
    case 'STEAL_ATTEMPT': return t('log.stealAttempt', { player: p, count: d.count, power: d.power });
    case 'USE_BLOCKER': return t('log.blocker', { name: d.blockerName });
    case 'WIN': return t('log.win', { player: p, reason: d.reason });
    case 'FORFEIT': return t('log.forfeit', { player: p });
    case 'MULLIGAN': return d.accepted ? t('log.mulliganRedraw', { player: p }) : t('log.mulliganKeep', { player: p });
    case 'END_PLAY_PHASE': return t('log.endPlayPhase', { player: p });
    case 'DECK_OUT': return t('log.deckOut', { player: p });
    default: return `${p}: ${entry.action}`;
  }
}

interface GameLogProps {
  log: GameLogEntry[];
  show: boolean;
  onToggle: () => void;
}

export default function GameLog({ log, show, onToggle }: GameLogProps) {
  const t = useTranslations();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [log.length]);

  return (
    <div
      className="flex flex-col"
      style={{
        width: show ? 280 : 40,
        background: '#0a0a12',
        borderLeft: '1px solid #1e2030',
        transition: 'width 0.3s',
        overflow: 'hidden',
      }}
    >
      {/* Toggle button */}
      <button
        className="flex items-center justify-center py-2 font-blender text-xs uppercase tracking-wider cursor-pointer"
        style={{ borderBottom: '1px solid #1e2030', color: '#7a8a9a', background: 'transparent', border: 'none' }}
        onClick={onToggle}
      >
        {show ? `◀ ${t('game.log')}` : '▶'}
      </button>

      {show && (
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-2 space-y-1" style={{ maxHeight: 'calc(100vh - 120px)' }}>
          {log.map((entry, i) => (
            <div
              key={i}
              className="font-blender text-[11px] px-2 py-1 rounded"
              style={{
                color: ACTION_COLORS[entry.action] || '#7a8a9a',
                background: entry.action === 'TURN_START' ? '#111119' : 'transparent',
              }}
            >
              {formatLog(entry, t)}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
