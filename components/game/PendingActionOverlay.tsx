'use client';

import { useTranslations } from 'next-intl';
import type { GameState, PlayerID, GameAction } from '@/lib/engine/types';
import TargetSelector from './TargetSelector';
import ChoiceDialog from './ChoiceDialog';
import EffectResolutionWindow from './EffectResolutionWindow';

interface PendingActionOverlayProps {
  gameState: GameState;
  myPlayer: PlayerID;
  onAction: (action: GameAction) => void;
}

export default function PendingActionOverlay({ gameState, myPlayer, onAction }: PendingActionOverlayProps) {
  const t = useTranslations();
  const pending = gameState.pendingActions[0];
  if (!pending) return null;

  if (pending.player !== myPlayer) {
    return (
      <div style={{
        position: 'fixed',
        bottom: 140,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 900,
        padding: '8px 20px',
        background: 'rgba(8,8,16,0.9)',
        border: '1px solid #1e2030',
        borderRadius: 8,
      }}>
        <span style={{
          fontFamily: 'var(--font-blender), sans-serif',
          fontSize: 12,
          color: '#5a5a6a',
          letterSpacing: '0.05em',
        }}>
          {t('game.waiting')}
        </span>
      </div>
    );
  }

  const handleSelect = (pendingActionId: string, selectedTargets: string[]) => {
    onAction({
      type: 'SELECT_TARGET',
      pendingActionId,
      selectedTargets,
    });
  };

  const handleDecline = (pendingActionId: string) => {
    onAction({
      type: 'DECLINE_OPTIONAL_EFFECT',
      pendingEffectId: pendingActionId,
    });
  };

  switch (pending.type) {
    case 'CONFIRM_EFFECT':
      return (
        <EffectResolutionWindow
          animationQueue={[]}
          pendingConfirm={pending}
          onDismiss={() => handleSelect(pending.id, pending.options.slice(0, 1))}
          onConfirm={handleSelect}
          onSkip={handleDecline}
        />
      );

    case 'CHOOSE_EFFECT':
    case 'CHOOSE_DIRECTION':
      return (
        <ChoiceDialog
          pendingAction={pending}
          gameState={gameState}
          myPlayer={myPlayer}
          onChoice={handleSelect}
        />
      );

    case 'CHOOSE_CARD':
    case 'VIEW_CARD':
    case 'SELECT_TARGET':
    case 'SELECT_GIG':
      return (
        <TargetSelector
          pendingAction={pending}
          gameState={gameState}
          myPlayer={myPlayer}
          onSelect={handleSelect}
          onDecline={pending.isOptional ? handleDecline : undefined}
        />
      );

    default:
      return null;
  }
}
