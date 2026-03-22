'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface GameEndScreenProps {
  isWinner: boolean;
  winReason: string;
  playerScore: number;
  opponentScore: number;
  eloChange?: number;
  onReplay?: () => void;
  onMenu?: () => void;
}

export default function GameEndScreen({
  isWinner, winReason, playerScore, opponentScore, eloChange, onReplay, onMenu,
}: GameEndScreenProps) {
  const t = useTranslations();
  const title = isWinner ? t('game.legendary') : t('game.flatlined');
  const color = isWinner ? '#ffd700' : '#ff003c';
  const bgColor = isWinner ? 'rgba(255,215,0,0.03)' : 'rgba(255,0,60,0.03)';

  const reasons: Record<string, string> = {
    gigs: isWinner ? t('game.winGigs') : t('game.loseGigs'),
    deckout: isWinner ? t('game.winDeckout') : t('game.loseDeckout'),
    overtime: isWinner ? t('game.winOvertime') : t('game.loseOvertime'),
    forfeit: isWinner ? t('game.winForfeit') : t('game.loseForfeit'),
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.9)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 p-10 rounded-lg"
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        style={{ background: bgColor, border: `1px solid ${color}40`, maxWidth: 500 }}
      >
        {/* Title */}
        <motion.h1
          className="font-refinery tracking-wider"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          style={{ fontSize: 64, color, textShadow: `0 0 40px ${color}80` }}
        >
          {title}
        </motion.h1>

        {/* Reason */}
        <p className="font-blender text-sm" style={{ color: '#7a8a9a' }}>
          {reasons[winReason] || winReason}
        </p>

        {/* Score */}
        <div className="flex gap-8 items-center">
          <div className="text-center">
            <div className="font-blender text-xs uppercase tracking-wider" style={{ color: '#7a8a9a' }}>{t('game.you')}</div>
            <div className="font-refinery text-3xl" style={{ color: '#e0e8f0' }}>{playerScore}</div>
          </div>
          <div className="font-blender text-2xl" style={{ color: '#444' }}>vs</div>
          <div className="text-center">
            <div className="font-blender text-xs uppercase tracking-wider" style={{ color: '#7a8a9a' }}>{t('game.rival')}</div>
            <div className="font-refinery text-3xl" style={{ color: '#e0e8f0' }}>{opponentScore}</div>
          </div>
        </div>

        {/* ELO change */}
        {eloChange !== undefined && (
          <div className="font-blender text-sm" style={{ color: eloChange >= 0 ? '#22c55e' : '#ff003c' }}>
            ELO {eloChange >= 0 ? '+' : ''}{eloChange}
          </div>
        )}

        <div style={{ height: 1, width: '100%', background: `${color}30` }} />

        {/* Buttons */}
        <div className="flex gap-4">
          {onReplay && (
            <button
              className="font-blender text-xs uppercase tracking-widest px-6 py-3 rounded cursor-pointer transition-all"
              style={{ background: '#111119', border: `1px solid ${color}`, color }}
              onClick={onReplay}
            >
              {t('game.watchReplay')}
            </button>
          )}
          <button
            className="font-blender text-xs uppercase tracking-widest px-6 py-3 rounded cursor-pointer transition-all"
            style={{ background: '#111119', border: '1px solid #00f0ff', color: '#00f0ff' }}
            onClick={onMenu}
          >
            {t('game.backToMenu')}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
