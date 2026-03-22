import type {
  GameState, PlayerID, UnitOnField, PendingAction, GigDie,
  EndOfTurnEffect, EffectAnimationData, DieType,
} from '@/lib/engine/types';
import { getPlayerState, getOpponent } from '@/lib/engine/types';
import { generateInstanceId, calculateStreetCred } from '@/lib/engine/utils';
import type { CardData } from '@/lib/data/types';

// ═══════════════════════════════════════
// HANDLER TYPE
// ═══════════════════════════════════════

export interface EffectContext {
  instanceId?: string;
  triggerType?: 'PLAY' | 'ATTACK' | 'FLIP' | 'CALL' | 'SPEND' | 'GO_SOLO' | 'DEFEATED';
  attackTarget?: { type: 'unit' | 'rival'; instanceId?: string };
  isDefensePhase?: boolean;
}

export type EffectHandler = {
  canActivate?: (state: GameState, player: PlayerID, source: CardData, context?: EffectContext) => boolean;
  resolve: (state: GameState, player: PlayerID, source: CardData, context?: EffectContext) => GameState;
  resolveChoice?: (state: GameState, player: PlayerID, pendingAction: PendingAction, selectedTargets: string[]) => GameState;
  getValidTargets?: (state: GameState, player: PlayerID, context?: EffectContext) => string[];
};

const handlers = new Map<string, EffectHandler>();

export function registerHandler(cardId: string, handler: EffectHandler): void {
  handlers.set(cardId, handler);
}

export function getHandler(cardId: string): EffectHandler | undefined {
  return handlers.get(cardId);
}

// ═══════════════════════════════════════
// EFFECT RESOLUTION
// ═══════════════════════════════════════

export function resolvePlayEffect(state: GameState, player: PlayerID, card: CardData, instanceId?: string): GameState {
  const handler = handlers.get(card.id);
  if (!handler) return state;
  const hasPlayEffect = card.effects.some((e) => e.type === 'PLAY' || e.type === 'PLAY_ATTACK');
  if (!hasPlayEffect) return state;
  if (handler.canActivate && !handler.canActivate(state, player, card, { instanceId, triggerType: 'PLAY' })) {
    state = queueEffectAnimation(state, card, 'PLAY', player, 'Condition not met. No effect.');
    return state;
  }
  return handler.resolve(state, player, card, { instanceId, triggerType: 'PLAY' });
}

export function resolveAttackEffect(state: GameState, player: PlayerID, card: CardData, instanceId?: string): GameState {
  const handler = handlers.get(card.id);
  if (!handler) return state;
  const hasAttackEffect = card.effects.some((e) => e.type === 'ATTACK' || e.type === 'PLAY_ATTACK');
  if (!hasAttackEffect) return state;
  if (handler.canActivate && !handler.canActivate(state, player, card, { instanceId, triggerType: 'ATTACK' })) return state;
  return handler.resolve(state, player, card, { instanceId, triggerType: 'ATTACK' });
}

export function resolveFlipEffect(state: GameState, player: PlayerID, card: CardData): GameState {
  const handler = handlers.get(card.id);
  if (!handler) return state;
  const hasFlipEffect = card.effects.some((e) => e.type === 'FLIP' || e.type === 'CALL');
  if (!hasFlipEffect) return state;
  return handler.resolve(state, player, card, { triggerType: 'CALL' });
}

// ═══════════════════════════════════════
// CHOICE RESOLUTION
// ═══════════════════════════════════════

export function resolveChoiceForHandler(
  state: GameState, player: PlayerID,
  pendingAction: PendingAction, selectedTargets: string[]
): GameState {
  const handlerId = pendingAction.sourceHandlerId;
  if (!handlerId) {
    state.pendingActions = state.pendingActions.filter((a) => a.id !== pendingAction.id);
    return state;
  }
  const handler = handlers.get(handlerId);
  if (!handler?.resolveChoice) {
    state.pendingActions = state.pendingActions.filter((a) => a.id !== pendingAction.id);
    return state;
  }
  state = handler.resolveChoice(state, player, pendingAction, selectedTargets);
  state.pendingActions = state.pendingActions.filter((a) => a.id !== pendingAction.id);

  if (pendingAction.metadata?.programCardToTrash && state.pendingActions.length === 0) {
    const p = getPlayerState(state, player);
    p.trash.push(pendingAction.metadata.programCardToTrash as CardData);
  }

  return state;
}

// ═══════════════════════════════════════
// ANIMATION QUEUE
// ═══════════════════════════════════════

export function queueEffectAnimation(state: GameState, card: CardData, triggerType: string, player: PlayerID, resultDescription?: string): GameState {
  const effectDesc = card.effects.find((e) =>
    e.type === triggerType || e.type === 'PASSIVE' || e.type === 'PLAY_ATTACK'
  );
  state.effectAnimationQueue.push({
    cardId: card.id,
    cardName: card.name_en,
    triggerType,
    description: effectDesc?.description_en || '',
    resultDescription,
    player,
    timestamp: Date.now(),
  });
  return state;
}

// Backward-compatible alias
export function setEffectAnimation(state: GameState, card: CardData, triggerType: string, player: PlayerID): GameState {
  return queueEffectAnimation(state, card, triggerType, player);
}

// ═══════════════════════════════════════
// CONFIRM ACTION HELPER
// ═══════════════════════════════════════

export function createConfirmAction(
  state: GameState, player: PlayerID, sourceCard: CardData,
  description: string, resultDescription: string,
  options?: string[], isOptional?: boolean
): GameState {
  state.pendingActions.push({
    id: generateInstanceId(),
    type: 'CONFIRM_EFFECT',
    player,
    description,
    resultDescription,
    options: options || ['confirm'],
    optionLabels: options ? undefined : ['OK'],
    minSelections: 1,
    maxSelections: 1,
    sourceCardId: sourceCard.id,
    sourceHandlerId: sourceCard.id + '_confirm',
    isOptional,
  });
  return state;
}

// Generic confirm handler (just dismisses — actual effect already applied or will be applied by specific handler)
registerHandler('generic_confirm', {
  resolve: (state) => state,
  resolveChoice: (state) => state,
});

// ═══════════════════════════════════════
// HOOK TRIGGERS
// ═══════════════════════════════════════

export function triggerPassiveOnPlay(state: GameState, player: PlayerID, card: CardData): GameState {
  if (card.color === 'blue' && (card.card_type === 'unit' || card.card_type === 'gear')) {
    const p = getPlayerState(state, player);
    if (!state.passiveTrackers.a002_firstBlueCard[player]) {
      const hasA002 = p.legends.some((l) => l.isFaceUp && l.card.id === 'a002');
      if (hasA002 && p.gigArea.length > 0) {
        state.passiveTrackers.a002_firstBlueCard[player] = true;
        const legendCard = p.legends.find((l) => l.card.id === 'a002')!.card;
        const handler = handlers.get('a002');
        if (handler) {
          state = handler.resolve(state, player, legendCard);
        }
      }
    }
  }
  return state;
}

export function triggerAttackHooks(state: GameState, attackerPlayer: PlayerID, attackerInstanceId: string): GameState {
  const p = getPlayerState(state, attackerPlayer);
  const attacker = p.field.find((u) => u.instanceId === attackerInstanceId);
  if (!attacker) return state;

  // a001 Yorinobu: First Arasaka attack each turn
  if (attacker.card.classifications.includes('Arasaka') && !state.passiveTrackers.a001_firstArasakaAttack[attackerPlayer]) {
    const hasA001 = p.legends.some((l) => l.isFaceUp && l.card.id === 'a001');
    if (hasA001) {
      state.passiveTrackers.a001_firstArasakaAttack[attackerPlayer] = true;
      const legendCard = p.legends.find((l) => l.card.id === 'a001')!.card;
      const handler = handlers.get('a001');
      if (handler) {
        state = handler.resolve(state, attackerPlayer, legendCard);
      }
    }
  }

  // b032 Panam Palmer: When friendly unit attacks, offer gear equip
  const panamLegend = p.legends.find((l) => l.isFaceUp && !l.isSpent && !l.isOnField && l.card.id === 'b032');
  if (panamLegend) {
    const gearsInHand = p.hand.filter((c) => c.card_type === 'gear');
    if (gearsInHand.length > 0) {
      const handler = handlers.get('b032');
      if (handler) {
        state = handler.resolve(state, attackerPlayer, panamLegend.card, {
          instanceId: attackerInstanceId,
          triggerType: 'ATTACK',
        });
      }
    }
  }

  // b135 River Ward: When unit attacks, offer gear equip to Yellow unit
  const riverLegend = p.legends.find((l) => l.isFaceUp && !l.isSpent && !l.isOnField && l.card.id === 'b135');
  if (riverLegend) {
    const cheapGear = p.hand.filter((c) => c.card_type === 'gear' && c.cost !== null && c.cost <= 2);
    const yellowUnits = p.field.filter((u) => u.card.color === 'yellow');
    if (cheapGear.length > 0 && yellowUnits.length > 0) {
      const handler = handlers.get('b135');
      if (handler) {
        state = handler.resolve(state, attackerPlayer, riverLegend.card, {
          instanceId: attackerInstanceId,
          triggerType: 'ATTACK',
        });
      }
    }
  }

  return state;
}

export function triggerDefenseHooks(state: GameState, defenderPlayer: PlayerID): GameState {
  const p = getPlayerState(state, defenderPlayer);

  // b125 Goro Takemura Vengeful Bodyguard
  const goro = p.legends.find((l) => l.isFaceUp && !l.isSpent && !l.isOnField && l.card.id === 'b125');
  if (goro && !state.passiveTrackers.b125_goroSpendUsed[defenderPlayer]) {
    // Check "pair of same-sided gigs" = two gig dice with same type
    const typeCounts = new Map<DieType, number>();
    for (const gig of p.gigArea) {
      typeCounts.set(gig.type, (typeCounts.get(gig.type) || 0) + 1);
    }
    const hasPair = [...typeCounts.values()].some((count) => count >= 2);

    if (hasPair) {
      const eligibleUnits = p.field.filter((u) => u.card.cost !== null && u.card.cost <= 4 && !u.isSpent);
      if (eligibleUnits.length > 0) {
        state.pendingActions.unshift({
          id: generateInstanceId(),
          type: 'CHOOSE_EFFECT',
          player: defenderPlayer,
          description: 'Goro Takemura: Spend to give a friendly unit (cost 4 or less) +1 power and BLOCKER for this attack?',
          descriptionKey: 'effect.spendGoroDefense',
          options: ['activate', 'skip'],
          optionLabels: ['Activate Goro', 'Skip'],
          minSelections: 1,
          maxSelections: 1,
          isOptional: true,
          sourceCardId: 'b125',
          sourceHandlerId: 'b125',
        });
      }
    }
  }

  return state;
}

export function triggerStealHooks(state: GameState, stealingPlayer: PlayerID, stolenDie: GigDie): GameState {
  const defender = getOpponent(stealingPlayer);
  const defenderState = getPlayerState(state, defender);
  const attackerState = getPlayerState(state, stealingPlayer);

  // a008 Ruthless Lowlife: If spent, stolen die value = 1
  const ruthless = defenderState.field.find((u) => u.card.id === 'a008' && u.isSpent);
  if (ruthless) {
    stolenDie.value = 1;
    attackerState.streetCred = calculateStreetCred(attackerState.gigArea);
    defenderState.streetCred = calculateStreetCred(defenderState.gigArea);
    state = queueEffectAnimation(state, ruthless.card, 'PASSIVE', defender,
      `Stolen ${stolenDie.type} value reduced to 1`);
  }

  // a011 Evelyn Parker Scheming Siren: If spent, draw 1
  const evelyn = defenderState.field.find((u) => u.card.id === 'a011' && u.isSpent);
  if (evelyn) {
    state = drawCards(state, defender, 1);
    state = queueEffectAnimation(state, evelyn.card, 'PASSIVE', defender, 'Drew 1 card');
  }

  // b111 Gorilla Arms: First steal each turn, bonus steal of same-sided die
  if (!state.passiveTrackers.b111_firstSteal[stealingPlayer]) {
    const hasGorilla = attackerState.field.some((u) => u.gear.some((g) => g.id === 'b111'));
    if (hasGorilla) {
      state.passiveTrackers.b111_firstSteal[stealingPlayer] = true;
      const matchingIdx = defenderState.gigArea.findIndex((g) => g.type === stolenDie.type);
      if (matchingIdx !== -1) {
        const gorillaCard = attackerState.field
          .flatMap((u) => u.gear)
          .find((g) => g.id === 'b111')!;
        // Show confirmation before bonus steal
        state.pendingActions.push({
          id: generateInstanceId(),
          type: 'CONFIRM_EFFECT',
          player: stealingPlayer,
          description: `Gorilla Arms: Bonus steal! Taking rival's ${defenderState.gigArea[matchingIdx].type} (value: ${defenderState.gigArea[matchingIdx].value}) with same sides`,
          descriptionKey: 'effect.bonusSteal',
          resultDescription: `Stealing bonus ${defenderState.gigArea[matchingIdx].type}`,
          options: ['confirm'],
          optionLabels: ['OK'],
          minSelections: 1,
          maxSelections: 1,
          sourceCardId: 'b111',
          sourceHandlerId: 'b111_confirm',
          metadata: { matchingGigIndex: matchingIdx, die: defenderState.gigArea[matchingIdx].type, value: String(defenderState.gigArea[matchingIdx].value) },
        });
      }
    }
  }

  // b121 Alt Cunningham: When GO_SOLO Alt steals, offer remove from game
  const altUnit = attackerState.field.find((u) => u.card.id === 'b121' && u.isGoSoloLegend);
  if (altUnit && !state.passiveTrackers.b121_removedFromGame[stealingPlayer]) {
    const programs = attackerState.trash.filter((c) => c.card_type === 'program');
    if (programs.length > 0) {
      state.pendingActions.push({
        id: generateInstanceId(),
        type: 'CHOOSE_EFFECT',
        player: stealingPlayer,
        description: 'Alt Cunningham: Remove from game to play a free Program from trash?',
        descriptionKey: 'effect.removeFromGameFreeProg',
        options: ['remove', 'skip'],
        optionLabels: ['Remove Alt (play free Program)', 'Skip'],
        isOptional: true,
        minSelections: 1,
        maxSelections: 1,
        sourceCardId: 'b121',
        sourceHandlerId: 'b121',
      });
    }
  }

  return state;
}

export function triggerFightWinHooks(state: GameState, winnerPlayer: PlayerID, attackerInstanceId: string): GameState {
  const p = getPlayerState(state, winnerPlayer);
  const attacker = p.field.find((u) => u.instanceId === attackerInstanceId);
  if (!attacker) return state;

  // a020 Satori: If attacker has Satori and wins fight, draw 1
  const hasSatori = attacker.gear.some((g) => g.id === 'a020');
  if (hasSatori) {
    state = drawCards(state, winnerPlayer, 1);
    const satoriCard = attacker.gear.find((g) => g.id === 'a020')!;
    state = queueEffectAnimation(state, satoriCard, 'ATTACK', winnerPlayer, 'Won fight! Drew 1 card');
  }

  return state;
}

export function triggerDefeatHooks(state: GameState, player: PlayerID, unitCard: CardData): GameState {
  if (unitCard.id === 'b132a') {
    const handler = handlers.get('b132a');
    if (handler) {
      state = handler.resolve(state, player, unitCard, { triggerType: 'DEFEATED' });
    }
  }
  return state;
}

export function triggerGigDecreaseHooks(state: GameState, decreasedPlayer: PlayerID): GameState {
  const p = getPlayerState(state, decreasedPlayer);
  const meredith = p.field.find((u) => u.card.id === 'b069');
  if (meredith && p.trash.length > 0) {
    const handler = handlers.get('b069');
    if (handler) {
      state = handler.resolve(state, decreasedPlayer, meredith.card);
    }
  }
  return state;
}

export function resolveEndOfTurnEffects(state: GameState, player: PlayerID): GameState {
  const effects = state.endOfTurnEffects.filter((e) => e.ownerPlayer === player);
  for (const effect of effects) {
    if (effect.effect === 'defeat') {
      const p = getPlayerState(state, effect.ownerPlayer);
      const unit = p.field.find((u) => u.instanceId === effect.unitInstanceId);
      if (unit) {
        state = queueEffectAnimation(state, unit.card, 'PASSIVE', effect.ownerPlayer,
          `${unit.card.name_en} defeated at end of turn`);
        state = triggerDefeatHooks(state, effect.ownerPlayer, unit.card);
        state = defeatUnit(state, effect.ownerPlayer, effect.unitInstanceId);
        addLog(state, effect.ownerPlayer, 'END_TURN_DEFEAT', {
          cardName: unit.card.name_en,
          source: effect.sourceCardId,
        });
      }
    }
  }
  state.endOfTurnEffects = state.endOfTurnEffects.filter((e) => e.ownerPlayer !== player);
  return state;
}

// ═══════════════════════════════════════
// CONTINUOUS POWER
// ═══════════════════════════════════════

export function calculateContinuousPowerBonus(
  state: GameState, player: PlayerID, unit: UnitOnField
): number {
  let bonus = 0;
  const playerState = getPlayerState(state, player);

  for (const legend of playerState.legends) {
    if (!legend.isFaceUp) continue;
    if (legend.card.id === 'a005' && unit.isSpent && unit.card.classifications.includes('Arasaka')) {
      bonus += 1;
    }
  }

  if (unit.card.id === 'a018' && state.activePlayer === player) {
    bonus += playerState.legends.filter((l) => l.isFaceUp).length;
  }

  if (unit.card.id === 'a013') {
    bonus += playerState.gigArea.length * 2;
  }

  if (unit.card.id === 'b131' && state.activePlayer === player) {
    bonus += unit.gear.length * 2;
  }

  return bonus;
}

// ═══════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════

export function hasStreetCred(state: GameState, player: PlayerID, amount: number): boolean {
  return getPlayerState(state, player).streetCred >= amount;
}

export function drawCards(state: GameState, player: PlayerID, count: number): GameState {
  const p = getPlayerState(state, player);
  for (let i = 0; i < count; i++) {
    if (p.deck.length === 0) {
      state.phase = 'gameOver';
      state.winner = getOpponent(player);
      state.winReason = 'deckout';
      break;
    }
    p.hand.push(p.deck.pop()!);
  }
  return state;
}

export function increaseGig(state: GameState, player: PlayerID, gigIndex: number, amount: number): GameState {
  const p = getPlayerState(state, player);
  if (gigIndex < 0 || gigIndex >= p.gigArea.length) return state;
  const die = p.gigArea[gigIndex];
  die.value = Math.min(die.value + amount, die.maxValue);
  p.streetCred = calculateStreetCred(p.gigArea);
  return state;
}

export function decreaseGig(state: GameState, player: PlayerID, gigIndex: number, amount: number): GameState {
  const p = getPlayerState(state, player);
  if (gigIndex < 0 || gigIndex >= p.gigArea.length) return state;
  const die = p.gigArea[gigIndex];
  die.value = Math.max(1, die.value - amount);
  p.streetCred = calculateStreetCred(p.gigArea);
  state = triggerGigDecreaseHooks(state, player);
  return state;
}

export function defeatUnit(state: GameState, player: PlayerID, instanceId: string): GameState {
  const p = getPlayerState(state, player);
  const idx = p.field.findIndex((u) => u.instanceId === instanceId);
  if (idx === -1) return state;
  const unit = p.field[idx];
  p.trash.push(unit.card);
  for (const gear of unit.gear) p.trash.push(gear);
  if (unit.isGoSoloLegend && unit.legendSlotIndex !== undefined) {
    const legend = p.legends[unit.legendSlotIndex];
    if (legend) { legend.isOnField = false; legend.goSoloInstanceId = undefined; }
  }
  p.field.splice(idx, 1);
  return state;
}

export function spendUnit(state: GameState, player: PlayerID, instanceId: string): GameState {
  const p = getPlayerState(state, player);
  const unit = p.field.find((u) => u.instanceId === instanceId);
  if (unit) unit.isSpent = true;
  return state;
}

export function readyUnit(state: GameState, player: PlayerID, instanceId: string): GameState {
  const p = getPlayerState(state, player);
  const unit = p.field.find((u) => u.instanceId === instanceId);
  if (unit) unit.isSpent = false;
  return state;
}

export function returnUnitToHand(state: GameState, player: PlayerID, instanceId: string): GameState {
  const p = getPlayerState(state, player);
  const idx = p.field.findIndex((u) => u.instanceId === instanceId);
  if (idx === -1) return state;
  const unit = p.field[idx];
  p.hand.push(unit.card);
  for (const gear of unit.gear) p.hand.push(gear);
  if (unit.isGoSoloLegend && unit.legendSlotIndex !== undefined) {
    const legend = p.legends[unit.legendSlotIndex];
    if (legend) { legend.isOnField = false; legend.goSoloInstanceId = undefined; }
  }
  p.field.splice(idx, 1);
  return state;
}

export function bottomDeckUnit(state: GameState, player: PlayerID, instanceId: string): GameState {
  const p = getPlayerState(state, player);
  const idx = p.field.findIndex((u) => u.instanceId === instanceId);
  if (idx === -1) return state;
  const unit = p.field[idx];
  p.deck.unshift(unit.card);
  for (const gear of unit.gear) p.deck.unshift(gear);
  if (unit.isGoSoloLegend && unit.legendSlotIndex !== undefined) {
    const legend = p.legends[unit.legendSlotIndex];
    if (legend) { legend.isOnField = false; legend.goSoloInstanceId = undefined; }
  }
  p.field.splice(idx, 1);
  return state;
}

export function defeatGear(state: GameState, player: PlayerID, unitInstanceId: string, gearIndex: number): GameState {
  const p = getPlayerState(state, player);
  const unit = p.field.find((u) => u.instanceId === unitInstanceId);
  if (!unit || gearIndex < 0 || gearIndex >= unit.gear.length) return state;
  const gear = unit.gear.splice(gearIndex, 1)[0];
  unit.gearInstanceIds.splice(gearIndex, 1);
  p.trash.push(gear);
  return state;
}

function addLog(state: GameState, player: PlayerID, action: string, details?: Record<string, unknown>): void {
  state.log.push({
    turn: state.turn,
    phase: state.phase,
    player,
    action,
    details,
    timestamp: Date.now(),
  });
}
