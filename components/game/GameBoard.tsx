'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import { motion, AnimatePresence } from 'framer-motion';
import GameLog from './GameLog';
import PlayerHand from './PlayerHand';
import OpponentHand from './OpponentHand';
import PlayerField from './PlayerField';
import GigArea from './GigArea';
import FixerArea from './FixerArea';
import EddiesArea from './EddiesArea';
import LegendsArea from './LegendsArea';
import DeckPile from './DeckPile';
import TrashPile from './TrashPile';
import MulliganDialog from './MulliganDialog';
import GameEndScreen from './GameEndScreen';
import PendingActionOverlay from './PendingActionOverlay';
import EffectResolutionWindow from './EffectResolutionWindow';
import DefenseOverlay from './DefenseOverlay';
import CardPreview from '@/components/cards/CardPreview';
import Image from 'next/image';
import type { GameState, GameAction, PlayerID, GamePhase } from '@/lib/engine/types';
import { getPlayerState, getOpponent, WIN_GIG_COUNT, CALL_COST } from '@/lib/engine/types';
import { getAvailableEddies } from '@/lib/engine/utils';
import { GameEngine } from '@/lib/engine/GameEngine';
import type { CardData } from '@/lib/data/types';

const PHASE_COLORS: Record<GamePhase, string> = {
  setup: '#7a8a9a', mulligan: '#a855f7', ready: '#00f0ff',
  play: '#22c55e', attack: '#ff003c', defense: '#fcee09', gameOver: '#ffd700',
};
// PHASE_LABELS moved inside component to use translations

const COLOR_MAP: Record<string, string> = {
  red: '#ff003c', blue: '#00f0ff', green: '#22c55e', yellow: '#fcee09',
};
const GOLD = '#fcee09';
const GOLD_DIM = 'rgba(252,238,9,0.15)';
const GOLD_GLOW = 'rgba(252,238,9,0.08)';
const BG_DARK = '#080810';
const BG_ZONE = 'rgba(8,8,20,0.5)';
const BORDER = `1px solid ${GOLD_DIM}`;

function Zone({ children, label, style: s = {} }: { children: React.ReactNode; label?: string; style?: React.CSSProperties }) {
  return (
    <div style={{ position: 'relative', background: BG_ZONE, border: BORDER, borderRadius: 4, ...s }}>
      {label && (
        <div className="font-blender" style={{
          position: 'absolute', top: -7, left: 10, zIndex: 2,
          fontSize: 8, letterSpacing: '0.12em', textTransform: 'uppercase',
          color: GOLD, background: BG_DARK, padding: '0 5px', lineHeight: 1,
        }}>
          {label}
        </div>
      )}
      {children}
    </div>
  );
}

interface GameBoardProps {
  initialState: GameState;
  myPlayer: PlayerID;
  onAction?: (action: GameAction) => void;
  isOnline?: boolean;
}

export default function GameBoard({ initialState, myPlayer, onAction, isOnline }: GameBoardProps) {
  const t = useTranslations();
  const locale = useLocale();
  const PHASE_LABELS: Record<GamePhase, string> = {
    setup: t('game.phaseSetup'), mulligan: t('game.phaseMulligan'), ready: t('game.phaseReady'),
    play: t('game.phasePlay'), attack: t('game.phaseAttack'), defense: t('game.phaseDefense'), gameOver: t('game.phaseGameOver'),
  };
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [selectedCardIndex, setSelectedCardIndex] = useState<number | null>(null);
  const [hoveredCard, setHoveredCard] = useState<CardData | null>(null);
  const [previewCard, setPreviewCard] = useState<CardData | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [selectedAttacker, setSelectedAttacker] = useState<string | null>(null);
  const [pendingGearIndex, setPendingGearIndex] = useState<number | null>(null);

  const me = getPlayerState(gameState, myPlayer);
  const opp = getPlayerState(gameState, getOpponent(myPlayer));
  const isMyTurn = gameState.activePlayer === myPlayer;
  const phaseColor = PHASE_COLORS[gameState.phase] || '#7a8a9a';

  // Auto-dismiss effect animation queue — always give the human player time to read
  useEffect(() => {
    if (gameState.effectAnimationQueue.length > 0 && gameState.pendingActions.length === 0) {
      // Always show for at least 2.5s so the player can read what happened
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          effectAnimationQueue: prev.effectAnimationQueue.slice(1),
        }));
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [gameState.effectAnimationQueue, gameState.pendingActions.length]);

  // Safety: auto-skip stuck pending actions (empty options, invalid state)
  useEffect(() => {
    if (gameState.pendingActions.length === 0) return;
    const pending = gameState.pendingActions[0];
    const validOpts = pending.options.filter((o) => o && o !== '');
    // Auto-skip if no valid options or if it's a CONFIRM_EFFECT (just informational)
    if (validOpts.length === 0) {
      const timer = setTimeout(() => {
        setGameState((prev) => ({
          ...prev,
          pendingActions: prev.pendingActions.slice(1),
        }));
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [gameState.pendingActions]);

  // Auto-play AI actions
  useEffect(() => {
    if (gameState.phase === 'gameOver') return;

    const oppPlayer = getOpponent(myPlayer);
    const oppState = getPlayerState(gameState, oppPlayer);

    // Wait for animation queue to clear before AI acts — don't steal player's reading time
    // Exception: if AI has pending actions to resolve, clear queue so it's not deadlocked
    if (gameState.effectAnimationQueue.length > 0) {
      if (gameState.pendingActions.length > 0 && gameState.pendingActions[0].player === oppPlayer && oppState.isAI) {
        // AI has pending actions — clear queue after a short delay so player sees something
        const timer = setTimeout(() => {
          setGameState((prev) => ({ ...prev, effectAnimationQueue: [] }));
        }, 1200);
        return () => clearTimeout(timer);
      }
      return; // auto-dismiss useEffect will clear queue, then this fires again
    }

    // AI pending action resolution (CONFIRM_EFFECT, SELECT_TARGET, etc.)
    if (gameState.pendingActions.length > 0 && gameState.pendingActions[0].player === oppPlayer && oppState.isAI) {
      const timer = setTimeout(() => {
        const pending = gameState.pendingActions[0];
        const validOptions = pending.options.filter((o) => o !== 'decline' && o !== '');
        if (validOptions.length === 0) {
          // No valid options — just remove the pending action
          setGameState((prev) => ({ ...prev, pendingActions: prev.pendingActions.slice(1) }));
          return;
        }
        const pick = validOptions[Math.floor(Math.random() * validOptions.length)];
        const ns = GameEngine.applyAction(gameState, oppPlayer, {
          type: 'SELECT_TARGET',
          pendingActionId: pending.id,
          selectedTargets: [pick],
        });
        setGameState(ns);
      }, 600);
      return () => clearTimeout(timer);
    }

    // AI defense phase — auto-decline
    if (gameState.phase === 'defense' && gameState.currentAttack &&
        getOpponent(gameState.currentAttack.attackerPlayer) === oppPlayer && oppState.isAI &&
        gameState.pendingActions.length === 0 && gameState.effectAnimationQueue.length === 0) {
      const timer = setTimeout(() => {
        const actions = GameEngine.getValidActions(gameState, oppPlayer);
        if (actions.length > 0) {
          // AI prefers DECLINE_DEFENSE for simplicity (random would sometimes call legends or use blockers)
          const decline = actions.find((a) => a.type === 'DECLINE_DEFENSE');
          const action = decline || actions[Math.floor(Math.random() * actions.length)];
          const ns = GameEngine.applyAction(gameState, oppPlayer, action);
          setGameState(ns);
        }
      }, 500);
      return () => clearTimeout(timer);
    }

    // AI mulligan
    if (gameState.phase === 'mulligan' && oppState.isAI && !oppState.hasMulliganed) {
      const timer = setTimeout(() => {
        const ns = GameEngine.applyAction(gameState, oppPlayer, { type: 'MULLIGAN', doMulligan: false });
        setGameState(ns);
      }, 500);
      return () => clearTimeout(timer);
    }

    // AI turn actions (ready, play, attack phases)
    if (gameState.activePlayer === oppPlayer && oppState.isAI && gameState.phase !== 'mulligan' &&
        gameState.pendingActions.length === 0 && gameState.effectAnimationQueue.length === 0) {
      const timer = setTimeout(() => {
        const actions = GameEngine.getValidActions(gameState, oppPlayer);
        if (actions.length > 0) {
          const action = actions[Math.floor(Math.random() * actions.length)];
          const ns = GameEngine.applyAction(gameState, oppPlayer, action);
          setGameState(ns);
        }
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [gameState, myPlayer]);

  const performAction = useCallback((action: GameAction) => {
    if (isOnline && onAction) { onAction(action); return; }
    const ns = GameEngine.applyAction(gameState, myPlayer, action);
    setGameState(ns);
    setSelectedCardIndex(null);
    if (action.type !== 'ATTACK_UNIT' && action.type !== 'ATTACK_RIVAL') {
      setSelectedAttacker(null);
    }
    setPendingGearIndex(null);
  }, [gameState, myPlayer, isOnline, onAction]);

  const playableIndices = useMemo(() => me.hand.map((c, i) => {
    if (gameState.phase !== 'play' || !isMyTurn) return -1;
    const a = getAvailableEddies(me);
    if (c.card_type === 'gear' && c.cost !== null && c.cost <= a && me.field.length > 0) return i;
    if (c.card_type !== 'gear' && c.cost !== null && c.cost <= a) return i;
    if (c.sell_tag && !me.hasSoldThisTurn) return i;
    return -1;
  }).filter(i => i >= 0), [me, gameState.phase, isMyTurn]);

  const targetableOppIds = useMemo(() =>
    gameState.phase === 'attack' && isMyTurn ? opp.field.filter(u => u.isSpent).map(u => u.instanceId) : [],
  [gameState.phase, isMyTurn, opp.field]);

  // Half-board for one player (horizontal layout matching official playmat)
  const HalfBoard = ({ player, isOwner, mirrored }: { player: typeof me; isOwner: boolean; mirrored: boolean }) => {
    const canCall = isOwner && !player.hasCalledThisTurn && getAvailableEddies(player) >= CALL_COST && gameState.phase === 'play' && isMyTurn;

    return (
      <div style={{
        display: 'flex', gap: 6, flex: 1, minHeight: 0,
        flexDirection: mirrored ? 'row-reverse' : 'row',
        alignItems: 'stretch',
      }}>
        {/* Deck + Trash stack */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, minWidth: 70, alignItems: 'center', justifyContent: 'center' }}>
          <DeckPile count={player.deck.length} />
          <TrashPile cards={player.trash} />
        </div>

        {/* Legends */}
        <Zone label={t('game.legends').toUpperCase()} style={{ padding: 8, minWidth: 90, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <LegendsArea
            legends={player.legends} isOwner={isOwner} canCall={canCall}
            onCall={isOwner ? (i) => performAction({ type: 'CALL_LEGEND', legendIndex: i }) : undefined}
            onGoSolo={isOwner ? (i) => performAction({ type: 'GO_SOLO', legendIndex: i }) : undefined}
          />
        </Zone>

        {/* Field (main area) */}
        <Zone label={isOwner ? t('game.yourField') : t('game.rivalField')} style={{ padding: 8, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <PlayerField
            units={player.field} isOwner={isOwner}
            targetableIds={isOwner ? [] : (selectedAttacker ? targetableOppIds : [])}
            selectedId={isOwner ? selectedAttacker || undefined : undefined}
            pendingTargetIds={
              isOwner && pendingGearIndex !== null
                ? player.field.map((u) => u.instanceId)
                : gameState.pendingActions[0]?.type === 'SELECT_TARGET' &&
                  gameState.pendingActions[0]?.player === myPlayer
                  ? gameState.pendingActions[0].options.filter((o) => {
                      return player.field.some((u) => u.instanceId === o || o.includes(u.instanceId));
                    })
                  : undefined
            }
            spendableUnitIds={
              isOwner && gameState.phase === 'play' && isMyTurn
                ? me.field
                    .filter((u) => u.card.id === 'b067' && !u.isSpent && me.gigArea.some((g) => g.value >= g.maxValue))
                    .map((u) => u.instanceId)
                : undefined
            }
            onSelectUnit={(id) => {
              // Handle pending gear equip: click a unit to attach gear
              if (isOwner && pendingGearIndex !== null) {
                performAction({ type: 'PLAY_GEAR', cardIndex: pendingGearIndex, targetInstanceId: id });
                setPendingGearIndex(null);
                return;
              }
              // Handle pending SELECT_TARGET clicks
              const pending = gameState.pendingActions[0];
              if (pending?.type === 'SELECT_TARGET' && pending.player === myPlayer && pending.options.includes(id)) {
                performAction({ type: 'SELECT_TARGET', pendingActionId: pending.id, selectedTargets: [id] });
                return;
              }
              if (pending?.type === 'SELECT_TARGET' && pending.player === myPlayer) {
                const matchingOption = pending.options.find((o) => o.includes(id));
                if (matchingOption) {
                  performAction({ type: 'SELECT_TARGET', pendingActionId: pending.id, selectedTargets: [matchingOption] });
                  return;
                }
              }
              // Attack logic: two-click flow
              if (isOwner && gameState.phase === 'attack' && isMyTurn) {
                const u = player.field.find(u => u.instanceId === id);
                if (u && !u.isSpent && !u.playedThisTurn) {
                  if (selectedAttacker === id) {
                    // Click same unit again = ATTACK RIVAL (direct attack)
                    performAction({ type: 'ATTACK_RIVAL', attackerInstanceId: id });
                    setSelectedAttacker(null);
                  } else {
                    setSelectedAttacker(id);
                  }
                }
              } else if (!isOwner && gameState.phase === 'attack' && isMyTurn) {
                if (selectedAttacker && targetableOppIds.includes(id)) {
                  performAction({ type: 'ATTACK_UNIT', attackerInstanceId: selectedAttacker, targetInstanceId: id });
                  setSelectedAttacker(null);
                }
              }
            }}
            onSpendAbility={isOwner ? (id) => performAction({ type: 'ACTIVATE_SPEND_ABILITY', unitInstanceId: id }) : undefined}
          />
        </Zone>

        {/* Eddies + Fixer */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Zone label={t('game.eddies').toUpperCase()} style={{ padding: 6, minWidth: 75, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <EddiesArea eddies={player.eddies} label="" />
          </Zone>
          <Zone label={t('game.fixer').toUpperCase()} style={{ padding: 6, minWidth: 75, flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FixerArea
              dice={player.fixerArea}
              canChoose={isOwner && gameState.phase === 'ready' && isMyTurn}
              onChoose={isOwner ? (i) => performAction({ type: 'CHOOSE_GIG_DIE', dieIndex: i }) : () => {}}
            />
          </Zone>
        </div>

        {/* Gig Dice */}
        <Zone label={isOwner ? t('game.yourGigs') : t('game.rivalGigs')} style={{ padding: 8, minWidth: 110, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <GigArea
            dice={player.gigArea}
            streetCred={player.streetCred}
            label=""
            selectableIndices={
              gameState.pendingActions[0]?.type === 'SELECT_GIG' &&
              gameState.pendingActions[0]?.player === myPlayer &&
              ((isOwner && !gameState.pendingActions[0]?.metadata?.targetPlayer) ||
               (!isOwner && gameState.pendingActions[0]?.metadata?.targetPlayer === getOpponent(myPlayer)))
                ? gameState.pendingActions[0].options.map((o) => parseInt(o))
                : undefined
            }
            onSelectDie={
              gameState.pendingActions[0]?.type === 'SELECT_GIG' &&
              gameState.pendingActions[0]?.player === myPlayer
                ? (i) => performAction({
                    type: 'SELECT_TARGET',
                    pendingActionId: gameState.pendingActions[0].id,
                    selectedTargets: [String(i)],
                  })
                : undefined
            }
          />
        </Zone>
      </div>
    );
  };

  // Info bar for a player
  const InfoBar = ({ name, isActive, deck, trash, gigs, sc, isTop }: {
    name: string; isActive: boolean; deck: number; trash: number; gigs: number; sc: number; isTop: boolean;
  }) => (
    <div className="flex items-center justify-between" style={{
      padding: '5px 12px',
      background: 'rgba(252,238,9,0.02)',
      [isTop ? 'borderBottom' : 'borderTop']: `1px solid ${GOLD_DIM}`,
    }}>
      <div className="flex items-center" style={{ gap: 8 }}>
        <div style={{ width: 5, height: 5, borderRadius: '50%', background: isActive ? phaseColor : '#333', boxShadow: isActive ? `0 0 6px ${phaseColor}` : 'none' }} />
        <span className="font-blender" style={{ fontSize: 11, color: isActive ? '#e0e8f0' : '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{name}</span>
      </div>
      <div className="flex items-center" style={{ gap: 10 }}>
        <span className="font-blender" style={{ fontSize: 12, fontWeight: 700, color: gigs >= WIN_GIG_COUNT ? (isTop ? '#ff003c' : '#22c55e') : GOLD }}>
          {gigs}/{WIN_GIG_COUNT} GIGS
        </span>
        <span className="font-blender" style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>
          &#9733; {sc}
        </span>
      </div>
    </div>
  );

  return (
    <div className="relative flex w-screen h-screen overflow-hidden select-none" style={{
      background: `radial-gradient(ellipse at 50% 50%, #0c0c1a 0%, ${BG_DARK} 100%)`,
    }}>
      {/* Grid */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(252,238,9,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(252,238,9,0.02) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      {/* Main */}
      <div className="flex flex-col flex-1 min-w-0" style={{ padding: 6 }}>

        {/* ═══ OPPONENT INFO ═══ */}
        <InfoBar name={t('game.opponent')} isActive={!isMyTurn} deck={opp.deck.length} trash={opp.trash.length} gigs={opp.gigArea.length} sc={opp.streetCred} isTop={true} />

        {/* ═══ OPPONENT HAND (card-backs fanned at top) ═══ */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4px 0', minHeight: 60 }}>
          <OpponentHand cardCount={opp.hand.length} />
        </div>

        {/* ═══ OPPONENT PLAYMAT ═══ */}
        <div style={{ display: 'flex', padding: '2px 0', flex: '1 1 0', minHeight: 0 }}>
          <HalfBoard player={opp} isOwner={false} mirrored={true} />
        </div>

        {/* ═══ CENTER DIVIDER ═══ */}
        <div className="flex items-center" style={{ margin: '3px 0', gap: 10 }}>
          <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, ${GOLD}, ${GOLD_DIM}, transparent)` }} />
          <motion.div className="font-blender" style={{
            fontSize: 9, letterSpacing: '0.15em', textTransform: 'uppercase',
            padding: '3px 12px', borderRadius: 20,
            background: `${phaseColor}12`, color: phaseColor, border: `1px solid ${phaseColor}30`,
            whiteSpace: 'nowrap',
          }}
            animate={isMyTurn ? { boxShadow: [`0 0 6px ${phaseColor}15`, `0 0 14px ${phaseColor}35`, `0 0 6px ${phaseColor}15`] } : undefined}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          >
            T{gameState.turn} {PHASE_LABELS[gameState.phase]}
          </motion.div>
          {gameState.overtime && (
            <motion.span className="font-blender" style={{ fontSize: 8, textTransform: 'uppercase', color: '#ff003c', padding: '2px 8px', borderRadius: 20, background: '#ff003c10', border: '1px solid #ff003c30' }}
              animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}>OT</motion.span>
          )}
          <div style={{ flex: 1, height: 2, background: `linear-gradient(90deg, transparent, ${GOLD_DIM}, ${GOLD}, ${GOLD_DIM}, transparent)` }} />
        </div>

        {/* ═══ YOUR PLAYMAT ═══ */}
        <div style={{ display: 'flex', padding: '2px 0', flex: '1 1 0', minHeight: 0 }}>
          <HalfBoard player={me} isOwner={true} mirrored={false} />
        </div>

        {/* ═══ YOUR HAND ═══ */}
        <Zone label={t('game.yourHand')} style={{ padding: '4px 8px', height: 130, marginTop: 3, overflow: 'hidden' }}>
          <PlayerHand
            cards={me.hand} selectedIndex={selectedCardIndex} playableIndices={playableIndices}
            onSelectCard={(i) => {
              const c = me.hand[i];
              if (gameState.phase === 'play' && isMyTurn) {
                const avail = getAvailableEddies(me);
                if (c.card_type === 'unit' && c.cost !== null && c.cost <= avail) {
                  performAction({ type: 'PLAY_UNIT', cardIndex: i });
                  return;
                }
                if (c.card_type === 'gear' && c.cost !== null && c.cost <= avail && me.field.length > 0) {
                  if (me.field.length === 1) {
                    performAction({ type: 'PLAY_GEAR', cardIndex: i, targetInstanceId: me.field[0].instanceId });
                  } else {
                    setPendingGearIndex(i);
                  }
                  return;
                }
                if (c.card_type === 'program' && c.cost !== null && c.cost <= avail) {
                  performAction({ type: 'PLAY_PROGRAM', cardIndex: i });
                  return;
                }
                if (c.sell_tag && !me.hasSoldThisTurn) {
                  performAction({ type: 'SELL_CARD', cardIndex: i });
                  return;
                }
              }
              setSelectedCardIndex(selectedCardIndex === i ? null : i);
            }}
            onHoverCard={setHoveredCard}
          />
        </Zone>

        {/* ═══ YOUR INFO + ACTIONS ═══ */}
        <div className="flex items-center justify-between" style={{ padding: '5px 12px', marginTop: 3, background: 'rgba(252,238,9,0.02)', borderTop: `1px solid ${GOLD_DIM}` }}>
          <div className="flex items-center" style={{ gap: 8 }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: isMyTurn ? phaseColor : '#333', boxShadow: isMyTurn ? `0 0 6px ${phaseColor}` : 'none' }} />
            <span className="font-blender" style={{ fontSize: 11, color: isMyTurn ? '#e0e8f0' : '#555', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t('game.you')}</span>
            <span className="font-blender" style={{ fontSize: 12, fontWeight: 700, color: me.gigArea.length >= WIN_GIG_COUNT ? '#22c55e' : GOLD }}>
              {me.gigArea.length}/{WIN_GIG_COUNT} GIGS
            </span>
            <span className="font-blender" style={{ fontSize: 12, fontWeight: 700, color: GOLD }}>&#9733; {me.streetCred}</span>
          </div>

          <div className="flex items-center" style={{ gap: 6 }}>
            {isMyTurn ? (
              <>
                {gameState.phase === 'play' && (
                  <button className="font-blender cursor-pointer" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '5px 14px', borderRadius: 4, background: 'transparent', border: `1px solid ${GOLD_DIM}`, color: GOLD, transition: 'all 0.2s' }}
                    onClick={() => performAction({ type: 'END_PLAY_PHASE' })}
                    onMouseEnter={e => { e.currentTarget.style.background = GOLD_GLOW; e.currentTarget.style.borderColor = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = GOLD_DIM; }}>
                    {t('game.endPlay')}
                  </button>
                )}
                {gameState.phase === 'attack' && (
                  <button className="font-blender cursor-pointer" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.08em', padding: '5px 14px', borderRadius: 4, background: 'transparent', border: `1px solid ${GOLD_DIM}`, color: GOLD, transition: 'all 0.2s' }}
                    onClick={() => performAction({ type: 'END_ATTACK_PHASE' })}
                    onMouseEnter={e => { e.currentTarget.style.background = GOLD_GLOW; e.currentTarget.style.borderColor = GOLD; }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = GOLD_DIM; }}>
                    {t('game.endTurn')}
                  </button>
                )}
                <button className="font-blender cursor-pointer" style={{ fontSize: 10, textTransform: 'uppercase', padding: '5px 10px', borderRadius: 4, background: 'transparent', border: '1px solid rgba(255,0,60,0.15)', color: 'rgba(255,0,60,0.4)', transition: 'all 0.2s' }}
                  onClick={() => performAction({ type: 'FORFEIT', reason: 'abandon' })}
                  onMouseEnter={e => { e.currentTarget.style.color = '#ff003c'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = 'rgba(255,0,60,0.4)'; }}>
                  {t('game.forfeit')}
                </button>
              </>
            ) : (
              <motion.span className="font-blender" style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.12em', color: '#444' }}
                animate={{ opacity: [0.3, 0.6, 0.3] }} transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}>
                {t('game.waiting')}
              </motion.span>
            )}
          </div>

          <button className="font-blender cursor-pointer" style={{ fontSize: 9, textTransform: 'uppercase', padding: '3px 10px', borderRadius: 4, background: showLog ? `${GOLD}08` : 'transparent', border: `1px solid ${showLog ? GOLD_DIM : 'rgba(255,255,255,0.04)'}`, color: showLog ? GOLD : '#444', transition: 'all 0.2s' }}
            onClick={() => setShowLog(!showLog)}>{t('game.log')}</button>
        </div>
      </div>

      {/* Log sidebar */}
      <AnimatePresence>
        {showLog && (
          <motion.div className="flex flex-col h-full overflow-hidden"
            initial={{ width: 0, opacity: 0 }} animate={{ width: 220, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            style={{ background: 'rgba(8,8,16,0.95)', borderLeft: `1px solid ${GOLD_DIM}` }}>
            <GameLog log={gameState.log} show={true} onToggle={() => setShowLog(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Overlays */}
      {gameState.phase === 'mulligan' && !me.hasMulliganed && (
        <MulliganDialog hand={me.hand} onDecision={d => performAction({ type: 'MULLIGAN', doMulligan: d })} />
      )}
      {gameState.phase === 'gameOver' && (
        <GameEndScreen isWinner={gameState.winner === myPlayer} winReason={gameState.winReason || 'unknown'} playerScore={me.gigArea.length} opponentScore={opp.gigArea.length} onMenu={() => { window.location.href = '/'; }} />
      )}
      <PendingActionOverlay
        gameState={gameState}
        myPlayer={myPlayer}
        onAction={performAction}
      />
      {/* Defense phase overlay */}
      {gameState.phase === 'defense' && gameState.currentAttack &&
       getOpponent(gameState.currentAttack.attackerPlayer) === myPlayer &&
       gameState.pendingActions.length === 0 && (
        <DefenseOverlay
          gameState={gameState}
          myPlayer={myPlayer}
          onUseBlocker={(id) => performAction({ type: 'USE_BLOCKER', blockerInstanceId: id })}
          onCallLegend={(i) => performAction({ type: 'CALL_LEGEND_DEFENSE', legendIndex: i })}
          onDecline={() => performAction({ type: 'DECLINE_DEFENSE' })}
        />
      )}
      {/* Effect resolution window (queue items — only show for human player, not during pending actions) */}
      {gameState.effectAnimationQueue.length > 0 &&
       gameState.pendingActions.length === 0 &&
       gameState.phase !== 'gameOver' &&
       !(opp.isAI && gameState.activePlayer === getOpponent(myPlayer)) && (
        <EffectResolutionWindow
          animationQueue={gameState.effectAnimationQueue}
          pendingConfirm={null}
          onDismiss={() => setGameState((prev) => ({
            ...prev,
            effectAnimationQueue: prev.effectAnimationQueue.slice(1),
          }))}
          onConfirm={() => {}}
          onSkip={() => {}}
        />
      )}
      <CardPreview card={previewCard} onClose={() => setPreviewCard(null)} />

      {/* Hover preview with card image */}
      <AnimatePresence>
        {hoveredCard && !previewCard && (
          <motion.div className="fixed z-40 pointer-events-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ top: 50, right: showLog ? 250 : 12 }}>
            <div style={{ display: 'flex', gap: 10, padding: 10, borderRadius: 8, background: 'rgba(8,8,16,0.96)', border: `1px solid ${GOLD_DIM}`, boxShadow: '0 6px 24px rgba(0,0,0,0.7)' }}>
              {/* Mini card image */}
              <div style={{ position: 'relative', width: 80, height: 112, borderRadius: 4, overflow: 'hidden', flexShrink: 0, border: `1px solid ${COLOR_MAP[hoveredCard.color] || GOLD}40` }}>
                <Image src={`/images/cards/${hoveredCard.set}/${hoveredCard.id}.webp`} alt={locale === 'fr' ? hoveredCard.name_fr : hoveredCard.name_en} fill style={{ objectFit: 'cover' }} sizes="80px" />
              </div>
              {/* Info */}
              <div className="font-blender" style={{ maxWidth: 170, display: 'flex', flexDirection: 'column', gap: 3 }}>
                <div style={{ fontWeight: 700, color: COLOR_MAP[hoveredCard.color] || '#e0e8f0', fontSize: 13 }}>{locale === 'fr' ? hoveredCard.name_fr : hoveredCard.name_en}</div>
                {(locale === 'fr' ? hoveredCard.title_fr : hoveredCard.title_en) && <div style={{ color: '#7a8a9a', fontSize: 10, fontStyle: 'italic' }}>{locale === 'fr' ? hoveredCard.title_fr : hoveredCard.title_en}</div>}
                <div style={{ display: 'flex', gap: 8, fontSize: 10, color: '#666', marginTop: 2 }}>
                  <span>{hoveredCard.card_type.toUpperCase()}</span>
                  {hoveredCard.cost !== null && <span>{t('game.cost')}: <span style={{ color: GOLD }}>{hoveredCard.cost}</span></span>}
                  {hoveredCard.power !== null && <span>{t('game.power')}: <span style={{ color: '#ff003c' }}>{hoveredCard.power}</span></span>}
                </div>
                {hoveredCard.effects.length > 0 && (() => {
                  const effectDesc = locale === 'fr' ? hoveredCard.effects[0].description_fr : hoveredCard.effects[0].description_en;
                  return (
                  <div style={{ color: '#8a9aaa', fontSize: 10, marginTop: 3, lineHeight: 1.4 }}>
                    {effectDesc.slice(0, 120)}{effectDesc.length > 120 ? '...' : ''}
                  </div>
                  );
                })()}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Phase help tooltip */}
      <AnimatePresence>
        {isMyTurn && gameState.phase !== 'gameOver' && (
          <motion.div
            className="fixed z-30 pointer-events-none"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ bottom: 180, left: '50%', transform: 'translateX(-50%)' }}
          >
            <div className="font-blender" style={{
              padding: '6px 16px', borderRadius: 20,
              background: 'rgba(8,8,16,0.9)', border: `1px solid ${phaseColor}30`,
              fontSize: 11, color: phaseColor, textAlign: 'center',
              boxShadow: `0 2px 12px rgba(0,0,0,0.5)`,
              whiteSpace: 'nowrap',
            }}>
              {gameState.phase === 'mulligan' && t('game.tipMulligan')}
              {gameState.phase === 'ready' && t('game.tipReady')}
              {gameState.phase === 'play' && (
                me.eddies.length === 0 && me.hand.some(c => c.sell_tag)
                  ? t('game.tipPlaySell')
                  : t('game.tipPlayCards')
              )}
              {gameState.phase === 'attack' && t('game.tipAttack')}
              {gameState.phase === 'defense' && gameState.currentAttack && getOpponent(gameState.currentAttack.attackerPlayer) === myPlayer && t('game.tipDefending')}
              {gameState.phase === 'defense' && gameState.currentAttack && gameState.currentAttack.attackerPlayer === myPlayer && t('game.tipWaitDefend')}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
