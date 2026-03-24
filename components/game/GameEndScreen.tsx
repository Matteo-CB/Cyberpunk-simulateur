'use client';

import { motion } from 'framer-motion';
import { useTranslations } from 'next-intl';

interface GameEndScreenProps {
  isWinner: boolean;
  winReason: string;
  playerScore: number;
  opponentScore: number;
  eloChange?: number | null;
  isRanked?: boolean;
  onMenu?: () => void;
}

export default function GameEndScreen({
  isWinner, winReason, playerScore, opponentScore, eloChange, isRanked, onMenu,
}: GameEndScreenProps) {
  const t = useTranslations();
  const title = isWinner ? t('game.legendary') : t('game.flatlined');
  const color = isWinner ? '#ffd700' : '#ff003c';

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
      style={{ background: 'rgba(2,2,8,0.92)', padding: 20 }}
    >
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', delay: 0.2 }}
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24,
          padding: '44px 40px', borderRadius: 16,
          background: 'linear-gradient(180deg, #0d0d1a 0%, #0a0a14 100%)',
          border: `1px solid ${color}30`,
          maxWidth: 480, width: '100%',
          boxShadow: `0 0 80px ${color}10, 0 20px 60px rgba(0,0,0,0.8)`,
        }}
      >
        {/* Title */}
        <motion.h1
          className="font-refinery"
          initial={{ y: -20 }}
          animate={{ y: 0 }}
          style={{
            fontSize: 'clamp(2.5rem, 8vw, 4rem)', letterSpacing: '0.15em',
            color, textShadow: `0 0 40px ${color}60`,
            textAlign: 'center', margin: 0,
          }}
        >
          {title}
        </motion.h1>

        {/* Reason */}
        <p className="font-blender" style={{ color: '#7a8a9a', fontSize: 14, textAlign: 'center', margin: 0 }}>
          {reasons[winReason] || winReason}
        </p>

        {/* Score */}
        <div style={{ display: 'flex', gap: 32, alignItems: 'center' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="font-blender" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a6a7a', marginBottom: 4 }}>{t('game.you')}</div>
            <div className="font-refinery" style={{ fontSize: 36, color: '#e0e8f0' }}>{playerScore}</div>
          </div>
          <div className="font-blender" style={{ fontSize: 20, color: '#3a3a4a' }}>{t('game.vs')}</div>
          <div style={{ textAlign: 'center' }}>
            <div className="font-blender" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#5a6a7a', marginBottom: 4 }}>{t('game.rival')}</div>
            <div className="font-refinery" style={{ fontSize: 36, color: '#e0e8f0' }}>{opponentScore}</div>
          </div>
        </div>

        {/* ELO change (ranked only) */}
        {isRanked && eloChange !== undefined && eloChange !== null && (
          <div className="font-blender" style={{
            fontSize: 14, fontWeight: 700,
            color: eloChange >= 0 ? '#22c55e' : '#ff003c',
            padding: '6px 16px', borderRadius: 6,
            background: eloChange >= 0 ? 'rgba(34,197,94,0.08)' : 'rgba(255,0,60,0.08)',
            border: `1px solid ${eloChange >= 0 ? 'rgba(34,197,94,0.2)' : 'rgba(255,0,60,0.2)'}`,
          }}>
            ELO {eloChange >= 0 ? '+' : ''}{eloChange}
          </div>
        )}

        {/* Casual match indicator */}
        {isRanked === false && (
          <div className="font-blender" style={{
            fontSize: 11, color: '#5a6a7a', textTransform: 'uppercase', letterSpacing: '0.1em',
          }}>
            {t('game.casualMatch')}
          </div>
        )}

        <div style={{ height: 1, width: '100%', background: `linear-gradient(90deg, transparent, ${color}30, transparent)` }} />

        {/* Back to menu */}
        <motion.button
          whileHover={{ scale: 1.05, boxShadow: '0 0 20px rgba(0,240,255,0.2)' }}
          whileTap={{ scale: 0.95 }}
          className="font-blender cursor-pointer"
          style={{
            fontSize: 14, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em',
            padding: '14px 40px', borderRadius: 10,
            background: 'rgba(0,240,255,0.06)', border: '1px solid rgba(0,240,255,0.3)',
            color: '#00f0ff',
          }}
          onClick={onMenu}
        >
          {t('game.backToMenu')}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
