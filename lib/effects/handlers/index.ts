/**
 * All 41 card effect handlers. 5 cards are vanilla: a009, a010, a015, a017, n001
 *
 * CORE RULE: Never auto-resolve. Every effect MUST show UI via CONFIRM_EFFECT or PendingAction.
 * Even with 0 or 1 valid targets, show a window explaining what happened.
 */
import { registerHandler } from '../EffectEngine';
import {
  drawCards, hasStreetCred, increaseGig, decreaseGig,
  defeatUnit, spendUnit, readyUnit, returnUnitToHand, bottomDeckUnit,
  defeatGear, queueEffectAnimation, createConfirmAction,
  resolvePlayEffect,
} from '../EffectEngine';
import type { GameState, PlayerID, PendingAction } from '@/lib/engine/types';
import { getPlayerState, getOpponent } from '@/lib/engine/types';
import { generateInstanceId, calculateStreetCred } from '@/lib/engine/utils';
import type { CardData } from '@/lib/data/types';

// ═══════════════════════════════════════
// ALPHA — LEGENDS
// ═══════════════════════════════════════

// a001 Yorinobu Arasaka: PASSIVE — First Arasaka attack: draw 1, if <20 SC discard 1
registerHandler('a001', {
  resolve: (state, player, source) => {
    state = drawCards(state, player, 1);
    const sc = getPlayerState(state, player).streetCred;
    let result = 'Drew 1 card';
    if (sc < 20) {
      const p = getPlayerState(state, player);
      if (p.hand.length > 0) {
        const discarded = p.hand.pop()!;
        p.trash.push(discarded);
        result += `. Discarded ${discarded.name_en} (Street Cred < 20)`;
      }
    }
    return createConfirmAction(state, player, source, `Yorinobu Arasaka: ${result}`, result);
  },
  resolveChoice: (state) => state,
});
registerHandler('a001_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a002 Jackie Welles: PASSIVE — First blue unit/gear: increase gig by 2, if max draw 1
registerHandler('a002', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    if (p.gigArea.length === 0) {
      return createConfirmAction(state, player, source, 'Jackie Welles: No gigs to increase', 'No effect');
    }
    state = queueEffectAnimation(state, source, 'PASSIVE', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_GIG',
      player,
      description: 'Jackie Welles: Choose a Gig to increase by 2',
      descriptionKey: 'effect.chooseGigIncrease',
      options: p.gigArea.map((_, i) => String(i)),
      optionLabels: p.gigArea.map((g) => `${g.type} (${g.value}/${g.maxValue})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a002',
      sourceHandlerId: 'a002',
      metadata: { amount: '2' },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const gigIdx = parseInt(selected[0]);
    const p = getPlayerState(state, player);
    if (isNaN(gigIdx) || gigIdx >= p.gigArea.length) return state;
    const gig = p.gigArea[gigIdx];
    const oldVal = gig.value;
    state = increaseGig(state, player, gigIdx, 2);
    let result = `${gig.type}: ${oldVal} -> ${gig.value}`;
    if (gig.value >= gig.maxValue) {
      state = drawCards(state, player, 1);
      result += '. Gig at max! Drew 1 card';
    }
    return createConfirmAction(state, player, p.legends.find((l) => l.card.id === 'a002')?.card || {} as CardData, `Jackie Welles: ${result}`, result);
  },
});
registerHandler('a002_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a003 V Corporate Exile: GO SOLO keyword only
registerHandler('a003', { resolve: (state) => state });

// a004 Goro Takemura Hands Unclean: GO SOLO + BLOCKER keywords only
registerHandler('a004', { resolve: (state) => state });

// a005 Saburo Arasaka: PASSIVE in calculateContinuousPowerBonus
registerHandler('a005', { resolve: (state) => state });

// a006 Viktor Vektor: FLIP — Search top 5 for up to 2 gear cost <=2
registerHandler('a006', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const count = Math.min(5, p.deck.length);
    if (count === 0) {
      return createConfirmAction(state, player, source, 'Viktor Vektor: Deck is empty', 'No cards to search');
    }
    const top5 = p.deck.splice(-count);
    const validGear = top5.filter((c) => c.card_type === 'gear' && c.cost !== null && c.cost <= 2);
    const rest = top5.filter((c) => !validGear.includes(c));

    if (validGear.length === 0) {
      p.deck.unshift(...rest.sort(() => Math.random() - 0.5));
      return createConfirmAction(state, player, source,
        'Viktor Vektor: Searched top 5 cards. No valid Gear found (cost 2 or less)',
        'No valid Gear found. Cards returned to bottom of deck.');
    }
    // Always show choice UI even with <=2 gear
    const allRevealed = [...validGear, ...rest];
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_CARD',
      player,
      description: `Viktor Vektor: Found ${validGear.length} valid Gear. Choose up to 2 to add to hand.`,
      descriptionKey: 'effect.chooseGearToAdd',
      options: validGear.map((c) => c.id),
      optionLabels: validGear.map((c) => `${c.name_en} (cost ${c.cost}, +${c.power || 0} power)`),
      optionCardIds: validGear.map((c) => c.id),
      minSelections: 0,
      maxSelections: Math.min(2, validGear.length),
      sourceCardId: 'a006',
      sourceHandlerId: 'a006',
      metadata: { revealedCards: allRevealed, validGearIds: validGear.map((c) => c.id), count: String(validGear.length) },
    });
    return state;
  },
  resolveChoice: (state, player, pa, selected) => {
    const p = getPlayerState(state, player);
    const allRevealed = (pa.metadata?.revealedCards || []) as CardData[];
    const taken = allRevealed.filter((c) => selected.includes(c.id));
    const rest = allRevealed.filter((c) => !selected.includes(c.id));
    p.hand.push(...taken);
    p.deck.unshift(...rest.sort(() => Math.random() - 0.5));
    const result = taken.length > 0
      ? `Added ${taken.map((c) => c.name_en).join(', ')} to hand`
      : 'No gear selected';
    return createConfirmAction(state, player, { id: 'a006', name_en: 'Viktor Vektor' } as CardData,
      `Viktor Vektor: ${result}`, result);
  },
});
registerHandler('a006_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// ═══════════════════════════════════════
// ALPHA — UNITS
// ═══════════════════════════════════════

// a007 Armored Minotaur: PLAY — If 12+ SC, defeat rival unit power <=5
registerHandler('a007', {
  canActivate: (state, player) => hasStreetCred(state, player, 12),
  resolve: (state, player, source) => {
    if (!hasStreetCred(state, player, 12)) {
      return createConfirmAction(state, player, source,
        'Armored Minotaur: Need 12+ Street Cred to activate', 'No effect (Street Cred too low)');
    }
    const opp = getPlayerState(state, getOpponent(player));
    const targets = opp.field.filter((u) => (u.card.power || 0) <= 5);
    if (targets.length === 0) {
      return createConfirmAction(state, player, source,
        'Armored Minotaur: No rival units with power 5 or less', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Armored Minotaur: Choose a rival unit with power 5 or less to defeat',
      descriptionKey: 'effect.chooseRivalUnitDefeat',
      options: targets.map((u) => u.instanceId),
      optionLabels: targets.map((u) => `${u.card.name_en} (Power: ${u.card.power || 0})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a007',
      sourceHandlerId: 'a007',
      metadata: { power: '5' },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const opp = getPlayerState(state, getOpponent(player));
    const target = opp.field.find((u) => u.instanceId === selected[0]);
    const name = target?.card.name_en || 'unit';
    state = defeatUnit(state, getOpponent(player), selected[0]);
    return createConfirmAction(state, player, { id: 'a007', name_en: 'Armored Minotaur' } as CardData,
      `Armored Minotaur: Defeated ${name}`, `Defeated ${name}`);
  },
});
registerHandler('a007_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a008 Ruthless Lowlife: PASSIVE — handled in triggerStealHooks
registerHandler('a008', { resolve: (state) => state });

// a011 Evelyn Parker Scheming Siren: PASSIVE — handled in triggerStealHooks
registerHandler('a011', { resolve: (state) => state });

// a012 MT0D12 Flathead: PASSIVE — unblockable at 7+ SC (handled in getValidActions)
registerHandler('a012', { resolve: (state) => state });

// a013 Jackie Welles Ride Or Die: +2 per gig (calculateContinuousPowerBonus)
registerHandler('a013', { resolve: (state) => state });

// a014 Secondhand Bombus: Can't attack + BLOCKER
registerHandler('a014', { resolve: (state) => state });

// a016 Corpo Security: Can't attack + BLOCKER
registerHandler('a016', { resolve: (state) => state });

// a018 Goro Takemura Losing His Way: +1 per face-up legend (calculateContinuousPowerBonus)
registerHandler('a018', { resolve: (state) => state });

// ═══════════════════════════════════════
// ALPHA — GEAR
// ═══════════════════════════════════════

// a019 Mantis Blades: +2 power (stat only)
registerHandler('a019', { resolve: (state) => state });

// a020 Satori: ATTACK — If wins fight, draw 1 (handled in triggerFightWinHooks)
registerHandler('a020', { resolve: (state) => state });

// a022 Dying Night: ATTACK — If 7+ SC, defeat rival gear cost <=2
registerHandler('a022', {
  canActivate: (state, player) => hasStreetCred(state, player, 7),
  resolve: (state, player, source) => {
    if (!hasStreetCred(state, player, 7)) return state;
    const opp = getPlayerState(state, getOpponent(player));
    const targets: { unitId: string; gearIdx: number; card: CardData; unitName: string }[] = [];
    for (const unit of opp.field) {
      for (let gi = 0; gi < unit.gear.length; gi++) {
        const g = unit.gear[gi];
        if (g.cost !== null && g.cost <= 2) {
          targets.push({ unitId: unit.instanceId, gearIdx: gi, card: g, unitName: unit.card.name_en });
        }
      }
    }
    if (targets.length === 0) {
      return createConfirmAction(state, player, source,
        'Dying Night: No rival Gear with cost 2 or less', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'ATTACK', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Dying Night: Choose a rival Gear (cost 2 or less) to defeat',
      descriptionKey: 'effect.chooseRivalGearDefeat',
      options: targets.map((t) => `${t.unitId}:${t.gearIdx}`),
      optionLabels: targets.map((t) => `${t.card.name_en} (on ${t.unitName})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a022',
      sourceHandlerId: 'a022',
      metadata: { cost: '2' },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const [unitId, gearIdxStr] = selected[0].split(':');
    state = defeatGear(state, getOpponent(player), unitId, parseInt(gearIdxStr));
    return createConfirmAction(state, player, { id: 'a022', name_en: 'Dying Night' } as CardData,
      'Dying Night: Gear defeated', 'Defeated rival Gear');
  },
});
registerHandler('a022_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a024 Sandevistan: PLAY — canAttackThisTurn (handled in GameEngine)
registerHandler('a024', {
  resolve: (state, player, source) => {
    return createConfirmAction(state, player, source,
      'Sandevistan: Equipped unit can attack this turn', 'Unit can attack this turn');
  },
  resolveChoice: (state) => state,
});
registerHandler('a024_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a026 Kiroshi Optics: ATTACK — Look at face-down legend
registerHandler('a026', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const faceDown = p.legends
      .map((l, i) => ({ legend: l, index: i }))
      .filter(({ legend }) => !legend.isFaceUp);
    if (faceDown.length === 0) {
      return createConfirmAction(state, player, source,
        'Kiroshi Optics: All Legends are face-up', 'No face-down Legends to peek at');
    }
    state = queueEffectAnimation(state, source, 'ATTACK', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'VIEW_CARD',
      player,
      description: faceDown.length === 1
        ? `Kiroshi Optics: Your face-down Legend is ${faceDown[0].legend.card.name_en}`
        : 'Kiroshi Optics: Choose a face-down Legend to peek at',
      descriptionKey: faceDown.length === 1 ? 'effect.legendPeek' : 'effect.chooseLegendPeek',
      options: faceDown.map(({ index }) => String(index)),
      optionLabels: faceDown.length === 1
        ? [faceDown[0].legend.card.name_en]
        : faceDown.map((_, i) => `Legend ${i + 1}`),
      optionCardIds: faceDown.map(({ legend }) => legend.card.id),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a026',
      sourceHandlerId: 'a026',
      metadata: { name: faceDown.length === 1 ? faceDown[0].legend.card.name_en : '' },
    });
    return state;
  },
  resolveChoice: (state) => state,
});

// a027 Mandibular Upgrade: BLOCKER keyword on gear (handled in GameEngine)
registerHandler('a027', { resolve: (state) => state });

// ═══════════════════════════════════════
// ALPHA — PROGRAMS
// ═══════════════════════════════════════

// a021 Industrial Assembly: PLAY — Increase gig by 4. If 7+ SC, draw 1
registerHandler('a021', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    if (p.gigArea.length === 0) {
      return createConfirmAction(state, player, source,
        'Industrial Assembly: No gigs to increase', 'No effect');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_GIG',
      player,
      description: 'Industrial Assembly: Choose a Gig to increase by 4',
      descriptionKey: 'effect.chooseGigIncrease',
      options: p.gigArea.map((_, i) => String(i)),
      optionLabels: p.gigArea.map((g) => `${g.type} (${g.value}/${g.maxValue})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a021',
      sourceHandlerId: 'a021',
      metadata: { amount: '4' },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const gigIdx = parseInt(selected[0]);
    const p = getPlayerState(state, player);
    const gig = p.gigArea[gigIdx];
    const oldVal = gig?.value || 0;
    state = increaseGig(state, player, gigIdx, 4);
    let result = `${gig?.type}: ${oldVal} -> ${gig?.value}`;
    if (hasStreetCred(state, player, 7)) {
      state = drawCards(state, player, 1);
      result += '. 7+ Street Cred! Drew 1 card';
    }
    return createConfirmAction(state, player, { id: 'a021', name_en: 'Industrial Assembly' } as CardData,
      `Industrial Assembly: ${result}`, result);
  },
});
registerHandler('a021_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a023 Floor It: PLAY — Return spent unit cost <=4 to hand
registerHandler('a023', {
  resolve: (state, player, source) => {
    const targets: { playerId: PlayerID; unit: typeof state.player1.field[0] }[] = [];
    for (const pid of ['player1', 'player2'] as PlayerID[]) {
      const p = getPlayerState(state, pid);
      for (const unit of p.field) {
        if (unit.isSpent && unit.card.cost !== null && unit.card.cost <= 4) {
          targets.push({ playerId: pid, unit });
        }
      }
    }
    if (targets.length === 0) {
      return createConfirmAction(state, player, source,
        'Floor It: No spent units with cost 4 or less', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Floor It: Choose a spent unit (cost 4 or less) to return to hand',
      descriptionKey: 'effect.chooseSpentUnitReturn',
      options: targets.map((t) => `${t.playerId}:${t.unit.instanceId}`),
      optionLabels: targets.map((t) => `${t.unit.card.name_en} (${t.playerId === player ? 'yours' : 'rival'}, cost ${t.unit.card.cost})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a023',
      sourceHandlerId: 'a023',
      metadata: { cost: '4' },
    });
    return state;
  },
  resolveChoice: (state, _player, _pa, selected) => {
    const [pid, instId] = selected[0].split(':');
    const p = getPlayerState(state, pid as PlayerID);
    const unit = p.field.find((u) => u.instanceId === instId);
    const name = unit?.card.name_en || 'unit';
    state = returnUnitToHand(state, pid as PlayerID, instId);
    return createConfirmAction(state, _player, { id: 'a023', name_en: 'Floor It' } as CardData,
      `Floor It: Returned ${name} to hand`, `Returned ${name} to hand`);
  },
});
registerHandler('a023_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a025 Corporate Surveillance: PLAY — Spend rival unit cost <=3
registerHandler('a025', {
  resolve: (state, player, source) => {
    const opp = getPlayerState(state, getOpponent(player));
    const targets = opp.field.filter((u) => !u.isSpent && u.card.cost !== null && u.card.cost <= 3);
    if (targets.length === 0) {
      return createConfirmAction(state, player, source,
        'Corporate Surveillance: No ready rival units with cost 3 or less', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Corporate Surveillance: Choose a rival unit (cost 3 or less) to spend',
      descriptionKey: 'effect.chooseRivalUnitSpend',
      options: targets.map((u) => u.instanceId),
      optionLabels: targets.map((u) => `${u.card.name_en} (Cost: ${u.card.cost})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a025',
      sourceHandlerId: 'a025',
      metadata: { cost: '3' },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const opp = getPlayerState(state, getOpponent(player));
    const target = opp.field.find((u) => u.instanceId === selected[0]);
    const name = target?.card.name_en || 'unit';
    state = spendUnit(state, getOpponent(player), selected[0]);
    return createConfirmAction(state, player, { id: 'a025', name_en: 'Corporate Surveillance' } as CardData,
      `Corporate Surveillance: Spent ${name}`, `${name} is now spent`);
  },
});
registerHandler('a025_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// a028 Reboot Optics: PLAY — +4 power to friendly unit, defeat at end of turn
registerHandler('a028', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    if (p.field.length === 0) {
      return createConfirmAction(state, player, source,
        'Reboot Optics: No friendly units on field', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Reboot Optics: Choose a friendly unit to get +4 power (defeated at end of turn!)',
      descriptionKey: 'effect.chooseFriendlyUnitBoost',
      options: p.field.map((u) => u.instanceId),
      optionLabels: p.field.map((u) => `${u.card.name_en} (Power: ${u.card.power || 0} -> ${(u.card.power || 0) + 4})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'a028',
      sourceHandlerId: 'a028',
      metadata: { power: '4' },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const unit = p.field.find((u) => u.instanceId === selected[0]);
    if (unit) {
      unit.powerModifiers += 4;
      state.endOfTurnEffects.push({
        unitInstanceId: unit.instanceId,
        ownerPlayer: player,
        effect: 'defeat',
        sourceCardId: 'a028',
      });
    }
    const name = unit?.card.name_en || 'unit';
    return createConfirmAction(state, player, { id: 'a028', name_en: 'Reboot Optics' } as CardData,
      `Reboot Optics: ${name} gains +4 power. Will be defeated at end of turn.`,
      `${name}: +4 power (defeated at end of turn)`);
  },
});
registerHandler('a028_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// ═══════════════════════════════════════
// SPOILER — LEGENDS
// ═══════════════════════════════════════

// b032 Panam Palmer: CALL — Ready. Attack hook: spend to equip free gear + ready attacker
registerHandler('b032', {
  resolve: (state, player, source, context) => {
    if (context?.triggerType === 'ATTACK') {
      const p = getPlayerState(state, player);
      const gearsInHand = p.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter(({ card }) => card.card_type === 'gear');
      if (gearsInHand.length === 0) return state;

      state.pendingActions.push({
        id: generateInstanceId(),
        type: 'CHOOSE_CARD',
        player,
        description: 'Panam Palmer: Spend to equip a free Gear from hand to the attacker and ready it?',
        descriptionKey: 'effect.spendEquipGear',
        options: ['decline', ...gearsInHand.map(({ card }) => card.id)],
        optionLabels: ['Skip', ...gearsInHand.map(({ card }) => `${card.name_en} (+${card.power || 0} power)`)],
        optionCardIds: ['', ...gearsInHand.map(({ card }) => card.id)],
        minSelections: 1,
        maxSelections: 1,
        isOptional: true,
        sourceCardId: 'b032',
        sourceHandlerId: 'b032',
        metadata: { attackerInstanceId: context.instanceId },
      });
      return state;
    }
    return createConfirmAction(state, player, source,
      'Panam Palmer: Legend is now ready', 'Panam Palmer is ready');
  },
  resolveChoice: (state, player, pa, selected) => {
    if (selected[0] === 'decline') return state;
    const p = getPlayerState(state, player);
    const cardId = selected[0];
    const handIdx = p.hand.findIndex((c) => c.id === cardId);
    if (handIdx === -1) return state;

    const panamLegend = p.legends.find((l) => l.card.id === 'b032');
    if (panamLegend) panamLegend.isSpent = true;

    const gear = p.hand.splice(handIdx, 1)[0];
    const attackerInstId = pa.metadata?.attackerInstanceId as string;
    const attacker = p.field.find((u) => u.instanceId === attackerInstId);
    if (attacker) {
      attacker.gear.push(gear);
      attacker.gearInstanceIds.push(generateInstanceId());
      attacker.isSpent = false;
    }
    return createConfirmAction(state, player, { id: 'b032', name_en: 'Panam Palmer' } as CardData,
      `Panam Palmer: Equipped ${gear.name_en} to ${attacker?.card.name_en}. Attacker readied.`,
      `Equipped ${gear.name_en}. Attacker readied.`);
  },
});
registerHandler('b032_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b121 Alt Cunningham: GO SOLO — steal hook in EffectEngine
registerHandler('b121', {
  resolve: (state) => state,
  resolveChoice: (state, player, _pa, selected) => {
    if (selected[0] === 'skip') return state;
    const p = getPlayerState(state, player);
    // Remove Alt from field (NOT to trash — removed from game)
    const altUnit = p.field.find((u) => u.card.id === 'b121' && u.isGoSoloLegend);
    if (altUnit) {
      const idx = p.field.findIndex((u) => u.instanceId === altUnit.instanceId);
      if (idx !== -1) p.field.splice(idx, 1);
      if (altUnit.legendSlotIndex !== undefined) {
        const legend = p.legends[altUnit.legendSlotIndex];
        if (legend) { legend.isOnField = false; legend.goSoloInstanceId = undefined; }
      }
      state.passiveTrackers.b121_removedFromGame[player] = true;
    }
    // Choose program from trash
    const programs = p.trash.filter((c) => c.card_type === 'program');
    if (programs.length === 0) {
      return createConfirmAction(state, player, { id: 'b121', name_en: 'Alt Cunningham' } as CardData,
        'Alt Cunningham: Removed from game. No Programs in trash.', 'No Programs available');
    }
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_CARD',
      player,
      description: 'Alt Cunningham: Choose a Program from trash to play for free',
      descriptionKey: 'effect.chooseProgramFromTrash',
      options: programs.map((c) => c.id),
      optionLabels: programs.map((c) => c.name_en),
      optionCardIds: programs.map((c) => c.id),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b121',
      sourceHandlerId: 'b121_program',
    });
    return state;
  },
});

registerHandler('b121_program', {
  resolve: (state) => state,
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const cardId = selected[0];
    const trashIdx = p.trash.findIndex((c) => c.id === cardId && c.card_type === 'program');
    if (trashIdx === -1) return state;
    const card = p.trash.splice(trashIdx, 1)[0];
    state = resolvePlayEffect(state, player, card);
    if (state.pendingActions.length === 0) {
      p.trash.push(card);
    } else {
      const lastPending = state.pendingActions[state.pendingActions.length - 1];
      lastPending.metadata = { ...lastPending.metadata, programCardToTrash: card };
    }
    return state;
  },
});
registerHandler('b121_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b122 Evelyn Parker Beautiful Enigma: CALL — Decrease rival gig by 3
registerHandler('b122', {
  resolve: (state, player, source) => {
    const opp = getPlayerState(state, getOpponent(player));
    if (opp.gigArea.length === 0) {
      return createConfirmAction(state, player, source,
        'Evelyn Parker: Rival has no Gigs to decrease', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'CALL', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_GIG',
      player,
      description: 'Evelyn Parker: Choose a rival Gig to decrease by 3',
      descriptionKey: 'effect.chooseRivalGigDecrease',
      options: opp.gigArea.map((_, i) => String(i)),
      optionLabels: opp.gigArea.map((g) => `${g.type} (${g.value}/${g.maxValue})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b122',
      sourceHandlerId: 'b122',
      metadata: { targetPlayer: getOpponent(player), amount: '3' },
    });
    return state;
  },
  resolveChoice: (state, player, pa, selected) => {
    const gigIdx = parseInt(selected[0]);
    const targetPlayer = (pa.metadata?.targetPlayer || getOpponent(player)) as PlayerID;
    const opp = getPlayerState(state, targetPlayer);
    const gig = opp.gigArea[gigIdx];
    const oldVal = gig?.value || 0;
    state = decreaseGig(state, targetPlayer, gigIdx, 3);
    return createConfirmAction(state, player, { id: 'b122', name_en: 'Evelyn Parker' } as CardData,
      `Evelyn Parker: Rival's ${gig?.type}: ${oldVal} -> ${gig?.value}`,
      `Decreased rival gig by 3`);
  },
});
registerHandler('b122_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b125 Goro Takemura Vengeful Bodyguard: CALL — Ready. Defense hook in EffectEngine.
registerHandler('b125', {
  resolve: (state, player, source, context) => {
    if (context?.triggerType === 'CALL') {
      return createConfirmAction(state, player, source,
        'Goro Takemura: Legend is now ready. Can spend during enemy attacks if you have same-sided Gigs.',
        'Goro is ready for defense');
    }
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    if (selected[0] === 'skip') return state;
    // Activate Goro: choose unit to buff
    const p = getPlayerState(state, player);
    const goro = p.legends.find((l) => l.card.id === 'b125');
    if (goro) goro.isSpent = true;
    state.passiveTrackers.b125_goroSpendUsed[player] = true;

    const eligible = p.field.filter((u) => u.card.cost !== null && u.card.cost <= 4 && !u.isSpent);
    if (eligible.length === 0) {
      return createConfirmAction(state, player, { id: 'b125', name_en: 'Goro Takemura' } as CardData,
        'Goro Takemura: No eligible units (cost 4 or less, not spent)', 'No valid targets');
    }
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Goro Takemura: Choose a friendly unit (cost 4 or less) to get +1 power and BLOCKER',
      descriptionKey: 'effect.chooseFriendlyUnitBlocker',
      options: eligible.map((u) => u.instanceId),
      optionLabels: eligible.map((u) => `${u.card.name_en} (cost ${u.card.cost})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b125',
      sourceHandlerId: 'b125_target',
      metadata: { cost: '4' },
    });
    return state;
  },
});
registerHandler('b125_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

registerHandler('b125_target', {
  resolve: (state) => state,
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const unit = p.field.find((u) => u.instanceId === selected[0]);
    if (unit) {
      unit.powerModifiers += 1;
      unit.temporaryBlocker = true;
    }
    const name = unit?.card.name_en || 'unit';
    return createConfirmAction(state, player, { id: 'b125', name_en: 'Goro Takemura' } as CardData,
      `Goro Takemura: ${name} gains +1 power and BLOCKER this turn`,
      `${name}: +1 power + BLOCKER`);
  },
});
registerHandler('b125_target_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b131 Royce: GO SOLO — +2 per gear (calculateContinuousPowerBonus)
registerHandler('b131', { resolve: (state) => state });

// b132a V Streetkid: GO SOLO DEFEATED — Discard top 3, choose Braindance from trash
registerHandler('b132a', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const discarded: string[] = [];
    for (let i = 0; i < 3 && p.deck.length > 0; i++) {
      const card = p.deck.pop()!;
      p.trash.push(card);
      discarded.push(card.name_en);
    }
    const braindances = p.trash
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.card_type === 'program' && card.classifications.includes('Braindance'));

    if (braindances.length === 0) {
      return createConfirmAction(state, player, source,
        `V Streetkid: Discarded ${discarded.join(', ')}. No Braindance Programs in trash.`,
        `Discarded ${discarded.length} cards. No Braindance Programs available.`);
    }
    state = queueEffectAnimation(state, source, 'DEFEATED', player, `Discarded: ${discarded.join(', ')}`);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_CARD',
      player,
      description: `V Streetkid: Discarded ${discarded.join(', ')}. Choose a Braindance Program from trash.`,
      descriptionKey: 'effect.discardedCards',
      options: braindances.map(({ card }) => card.id),
      optionLabels: braindances.map(({ card }) => card.name_en),
      optionCardIds: braindances.map(({ card }) => card.id),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b132a',
      sourceHandlerId: 'b132a',
      metadata: { cards: discarded.join(', ') },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const cardId = selected[0];
    const trashIdx = p.trash.findIndex((c) => c.id === cardId);
    if (trashIdx !== -1) {
      const card = p.trash.splice(trashIdx, 1)[0];
      p.hand.push(card);
      return createConfirmAction(state, player, { id: 'b132a', name_en: 'V Streetkid' } as CardData,
        `V Streetkid: Added ${card.name_en} to hand`, `Added ${card.name_en} to hand`);
    }
    return state;
  },
});
registerHandler('b132a_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b133 Dum Dum: CALL — May defeat friendly Gear for draw 4, else draw 1
registerHandler('b133', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const gearedUnits = p.field.filter((u) => u.gear.length > 0);
    if (gearedUnits.length === 0) {
      state = drawCards(state, player, 1);
      return createConfirmAction(state, player, source,
        'Dum Dum: No friendly Gear to defeat. Drew 1 card.', 'Drew 1 card');
    }
    state = queueEffectAnimation(state, source, 'CALL', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_EFFECT',
      player,
      description: 'Dum Dum: Defeat a friendly Gear to draw 4 cards, or skip to draw 1?',
      descriptionKey: 'effect.defeatGearDrawChoice',
      options: ['defeat_gear', 'skip'],
      optionLabels: ['Defeat Gear (Draw 4)', 'Skip (Draw 1)'],
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b133',
      sourceHandlerId: 'b133',
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    if (selected[0] === 'skip') {
      state = drawCards(state, player, 1);
      return createConfirmAction(state, player, { id: 'b133', name_en: 'Dum Dum' } as CardData,
        'Dum Dum: Drew 1 card', 'Drew 1 card');
    }
    const p = getPlayerState(state, player);
    const gearTargets: { unitId: string; gearIdx: number; card: CardData; unitName: string }[] = [];
    for (const unit of p.field) {
      for (let gi = 0; gi < unit.gear.length; gi++) {
        gearTargets.push({ unitId: unit.instanceId, gearIdx: gi, card: unit.gear[gi], unitName: unit.card.name_en });
      }
    }
    if (gearTargets.length === 0) {
      state = drawCards(state, player, 1);
      return createConfirmAction(state, player, { id: 'b133', name_en: 'Dum Dum' } as CardData,
        'Dum Dum: No Gear available. Drew 1 card', 'Drew 1 card');
    }
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Dum Dum: Choose a Gear to defeat (then draw 4)',
      descriptionKey: 'effect.chooseGearDefeat',
      options: gearTargets.map((t) => `${t.unitId}:${t.gearIdx}`),
      optionLabels: gearTargets.map((t) => `${t.card.name_en} (on ${t.unitName})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b133',
      sourceHandlerId: 'b133_gear',
    });
    return state;
  },
});

registerHandler('b133_gear', {
  resolve: (state) => state,
  resolveChoice: (state, player, _pa, selected) => {
    const [unitId, gearIdxStr] = selected[0].split(':');
    state = defeatGear(state, player, unitId, parseInt(gearIdxStr));
    state = drawCards(state, player, 4);
    return createConfirmAction(state, player, { id: 'b133', name_en: 'Dum Dum' } as CardData,
      'Dum Dum: Gear defeated. Drew 4 cards!', 'Defeated Gear. Drew 4 cards');
  },
});
registerHandler('b133_gear_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b135 River Ward: CALL — Draw 1. Attack hook: equip free gear <=2 to Yellow unit
registerHandler('b135', {
  resolve: (state, player, source, context) => {
    if (context?.triggerType === 'ATTACK') {
      const p = getPlayerState(state, player);
      const cheapGear = p.hand
        .map((c, i) => ({ card: c, index: i }))
        .filter(({ card }) => card.card_type === 'gear' && card.cost !== null && card.cost <= 2);
      const yellowUnits = p.field.filter((u) => u.card.color === 'yellow');
      if (cheapGear.length === 0 || yellowUnits.length === 0) return state;

      state.pendingActions.push({
        id: generateInstanceId(),
        type: 'CHOOSE_CARD',
        player,
        description: 'River Ward: Spend to equip a free Gear (cost 2 or less) to a Yellow unit?',
        descriptionKey: 'effect.spendEquipCheapGear',
        options: ['decline', ...cheapGear.map(({ card }) => card.id)],
        optionLabels: ['Skip', ...cheapGear.map(({ card }) => `${card.name_en} (+${card.power || 0})`)],
        optionCardIds: ['', ...cheapGear.map(({ card }) => card.id)],
        minSelections: 1,
        maxSelections: 1,
        isOptional: true,
        sourceCardId: 'b135',
        sourceHandlerId: 'b135',
        metadata: { yellowUnitIds: yellowUnits.map((u) => u.instanceId), cost: '2' },
      });
      return state;
    }
    // CALL: Draw 1
    state = drawCards(state, player, 1);
    return createConfirmAction(state, player, source,
      'River Ward: Drew 1 card. Can spend during attacks to equip free Gear to Yellow units.',
      'Drew 1 card');
  },
  resolveChoice: (state, player, pa, selected) => {
    if (selected[0] === 'decline') return state;
    const p = getPlayerState(state, player);
    const cardId = selected[0];
    const handIdx = p.hand.findIndex((c) => c.id === cardId);
    if (handIdx === -1) return state;

    const riverLegend = p.legends.find((l) => l.card.id === 'b135');
    if (riverLegend) riverLegend.isSpent = true;

    const gear = p.hand.splice(handIdx, 1)[0];
    const yellowUnitIds = (pa.metadata?.yellowUnitIds || []) as string[];

    if (yellowUnitIds.length === 1) {
      const target = p.field.find((u) => u.instanceId === yellowUnitIds[0]);
      if (target) {
        target.gear.push(gear);
        target.gearInstanceIds.push(generateInstanceId());
      }
      return createConfirmAction(state, player, { id: 'b135', name_en: 'River Ward' } as CardData,
        `River Ward: Equipped ${gear.name_en} to ${target?.card.name_en}`,
        `Equipped ${gear.name_en}`);
    }
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'River Ward: Choose a Yellow unit to equip the Gear to',
      descriptionKey: 'effect.chooseYellowUnit',
      options: yellowUnitIds,
      optionLabels: yellowUnitIds.map((id) => {
        const u = p.field.find((f) => f.instanceId === id);
        return u ? u.card.name_en : id;
      }),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b135',
      sourceHandlerId: 'b135_target',
      metadata: { gearCard: gear },
    });
    return state;
  },
});
registerHandler('b135_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

registerHandler('b135_target', {
  resolve: (state) => state,
  resolveChoice: (state, player, pa, selected) => {
    const p = getPlayerState(state, player);
    const gear = pa.metadata?.gearCard as CardData;
    const target = p.field.find((u) => u.instanceId === selected[0]);
    if (target && gear) {
      target.gear.push(gear);
      target.gearInstanceIds.push(generateInstanceId());
    }
    return createConfirmAction(state, player, { id: 'b135', name_en: 'River Ward' } as CardData,
      `River Ward: Equipped ${gear?.name_en} to ${target?.card.name_en}`,
      `Equipped ${gear?.name_en}`);
  },
});
registerHandler('b135_target_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// ═══════════════════════════════════════
// SPOILER — UNITS
// ═══════════════════════════════════════

// b042 Riding Nomad: Can attack spent rival units when played (GameEngine validation)
registerHandler('b042', { resolve: (state) => state });

// b067 Kerry Eurodyne: Spend ability — draw 2 if gig at max
registerHandler('b067', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const hasMaxGig = p.gigArea.some((g) => g.value >= g.maxValue);
    if (hasMaxGig) {
      state = drawCards(state, player, 2);
      return createConfirmAction(state, player, source,
        'Kerry Eurodyne: Gig at max value! Drew 2 cards.', 'Drew 2 cards');
    }
    return createConfirmAction(state, player, source,
      'Kerry Eurodyne: No gig at max value. No effect.', 'No effect');
  },
  resolveChoice: (state) => state,
});
registerHandler('b067_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b069 Meredith Stout: PASSIVE — triggered via triggerGigDecreaseHooks
registerHandler('b069', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    if (p.trash.length === 0) {
      return createConfirmAction(state, player, source,
        'Meredith Stout: Trash is empty. No card to recover.', 'No cards in trash');
    }
    state = queueEffectAnimation(state, source, 'PASSIVE', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_CARD',
      player,
      description: 'Meredith Stout: Rival decreased your Gig. Choose a card from trash to add to hand.',
      descriptionKey: 'effect.gigDecreaseRecoverTrash',
      options: p.trash.map((c, i) => `${i}:${c.id}`),
      optionLabels: p.trash.map((c) => `${c.name_en} (${c.card_type})`),
      optionCardIds: p.trash.map((c) => c.id),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b069',
      sourceHandlerId: 'b069',
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const [idxStr] = selected[0].split(':');
    const idx = parseInt(idxStr);
    if (idx >= 0 && idx < p.trash.length) {
      const card = p.trash.splice(idx, 1)[0];
      p.hand.push(card);
      return createConfirmAction(state, player, { id: 'b069', name_en: 'Meredith Stout' } as CardData,
        `Meredith Stout: Added ${card.name_en} to hand`, `Recovered ${card.name_en}`);
    }
    return state;
  },
});
registerHandler('b069_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b073 Placide: PLAY/ATTACK — May discard Program to bottom-deck rival Unit
registerHandler('b073', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const opp = getPlayerState(state, getOpponent(player));
    const programs = p.hand.filter((c) => c.card_type === 'program');
    if (programs.length === 0 || opp.field.length === 0) {
      return createConfirmAction(state, player, source,
        'Placide: No Programs in hand or no rival Units', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_EFFECT',
      player,
      description: 'Placide: Discard a Program from hand to put a rival Unit on the bottom of their deck?',
      descriptionKey: 'effect.discardProgramBottomDeck',
      options: ['yes', 'no'],
      optionLabels: ['Discard Program', 'Skip'],
      minSelections: 1,
      maxSelections: 1,
      isOptional: true,
      sourceCardId: 'b073',
      sourceHandlerId: 'b073',
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    if (selected[0] === 'no') return state;
    const p = getPlayerState(state, player);
    const programs = p.hand
      .map((c, i) => ({ card: c, index: i }))
      .filter(({ card }) => card.card_type === 'program');
    if (programs.length === 0) return state;

    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_CARD',
      player,
      description: 'Placide: Choose a Program to discard',
      descriptionKey: 'effect.chooseProgramDiscard',
      options: programs.map(({ card }) => card.id),
      optionLabels: programs.map(({ card }) => card.name_en),
      optionCardIds: programs.map(({ card }) => card.id),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b073',
      sourceHandlerId: 'b073_program',
    });
    return state;
  },
});

registerHandler('b073_program', {
  resolve: (state) => state,
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const cardId = selected[0];
    const handIdx = p.hand.findIndex((c) => c.id === cardId && c.card_type === 'program');
    if (handIdx !== -1) p.trash.push(p.hand.splice(handIdx, 1)[0]);

    const opp = getPlayerState(state, getOpponent(player));
    if (opp.field.length === 0) return state;

    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Placide: Choose a rival Unit to put on the bottom of their deck',
      descriptionKey: 'effect.chooseRivalUnitBottomDeck',
      options: opp.field.map((u) => u.instanceId),
      optionLabels: opp.field.map((u) => u.card.name_en),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b073',
      sourceHandlerId: 'b073_target',
    });
    return state;
  },
});

registerHandler('b073_target', {
  resolve: (state) => state,
  resolveChoice: (state, player, _pa, selected) => {
    const opp = getPlayerState(state, getOpponent(player));
    const target = opp.field.find((u) => u.instanceId === selected[0]);
    const name = target?.card.name_en || 'unit';
    state = bottomDeckUnit(state, getOpponent(player), selected[0]);
    return createConfirmAction(state, player, { id: 'b073', name_en: 'Placide' } as CardData,
      `Placide: ${name} sent to bottom of rival's deck`, `${name} bottom-decked`);
  },
});
registerHandler('b073_target_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b126 Hanako Arasaka: PLAY — Reveal top 4, choose gig, add matching-cost cards
registerHandler('b126', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    if (p.gigArea.length === 0) {
      const top4 = p.deck.splice(-Math.min(4, p.deck.length));
      p.trash.push(...top4);
      return createConfirmAction(state, player, source,
        `Hanako Arasaka: No Gigs. Trashed ${top4.length} cards.`,
        `No Gigs available. ${top4.length} cards trashed.`);
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_GIG',
      player,
      description: 'Hanako Arasaka: Choose a Gig. Cards with matching cost will be added to your hand.',
      descriptionKey: 'effect.chooseGigMatchCost',
      options: p.gigArea.map((_, i) => String(i)),
      optionLabels: p.gigArea.map((g) => `${g.type} (value: ${g.value})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b126',
      sourceHandlerId: 'b126',
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const gigIdx = parseInt(selected[0]);
    const gigValue = p.gigArea[gigIdx]?.value;
    if (gigValue === undefined) return state;
    const top4 = p.deck.splice(-Math.min(4, p.deck.length));
    const matching = top4.filter((c) => c.cost === gigValue);
    const rest = top4.filter((c) => c.cost !== gigValue);
    p.hand.push(...matching);
    p.trash.push(...rest);
    const result = matching.length > 0
      ? `Added ${matching.map((c) => c.name_en).join(', ')} (cost ${gigValue}). Trashed ${rest.length} cards.`
      : `No cards with cost ${gigValue} found. Trashed ${rest.length} cards.`;
    return createConfirmAction(state, player, { id: 'b126', name_en: 'Hanako Arasaka' } as CardData,
      `Hanako Arasaka: ${result}`, result);
  },
});
registerHandler('b126_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b137 Adam Smasher: PLAY — Defeat all other Units
registerHandler('b137', {
  resolve: (state, player, source) => {
    const defeated: string[] = [];
    for (const pid of ['player1', 'player2'] as PlayerID[]) {
      const p = getPlayerState(state, pid);
      const toDefeat = p.field
        .filter((u) => u.card.id !== 'b137')
        .map((u) => ({ instanceId: u.instanceId, name: u.card.name_en }));
      for (const { instanceId, name } of toDefeat) {
        state = defeatUnit(state, pid, instanceId);
        defeated.push(name);
      }
    }
    const result = defeated.length > 0
      ? `Defeated: ${defeated.join(', ')}`
      : 'No other units on the field';
    return createConfirmAction(state, player, source,
      `Adam Smasher: ${result}`, result);
  },
  resolveChoice: (state) => state,
});
registerHandler('b137_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// ═══════════════════════════════════════
// SPOILER — GEAR
// ═══════════════════════════════════════

// b111 Gorilla Arms: PASSIVE — handled in triggerStealHooks
registerHandler('b111', { resolve: (state) => state });

// b111 confirm handler for bonus steal
registerHandler('b111_confirm', {
  resolve: (state) => state,
  resolveChoice: (state, player, pa) => {
    const defender = getOpponent(player);
    const defenderState = getPlayerState(state, defender);
    const matchIdx = (pa.metadata?.matchingGigIndex ?? -1) as number;
    if (matchIdx >= 0 && matchIdx < defenderState.gigArea.length) {
      const attackerState = getPlayerState(state, player);
      const bonusDie = defenderState.gigArea.splice(matchIdx, 1)[0];
      bonusDie.stolenFrom = defender;
      attackerState.gigArea.push(bonusDie);
      attackerState.streetCred = calculateStreetCred(attackerState.gigArea);
      defenderState.streetCred = calculateStreetCred(defenderState.gigArea);
    }
    return state;
  },
});

// ═══════════════════════════════════════
// SPOILER — PROGRAMS
// ═══════════════════════════════════════

// b102 Cyberpsychosis: PLAY — +2 power per gear, defeat at end of turn
registerHandler('b102', {
  resolve: (state, player, source) => {
    const p = getPlayerState(state, player);
    const equipped = p.field.filter((u) => u.gear.length > 0);
    if (equipped.length === 0) {
      return createConfirmAction(state, player, source,
        'Cyberpsychosis: No units with Gear on field', 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_TARGET',
      player,
      description: 'Cyberpsychosis: Choose a unit with Gear to boost (+2 per Gear, defeated at end of turn)',
      descriptionKey: 'effect.chooseUnitGearBoost',
      options: equipped.map((u) => u.instanceId),
      optionLabels: equipped.map((u) => `${u.card.name_en} (${u.gear.length} Gear = +${u.gear.length * 2} power)`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b102',
      sourceHandlerId: 'b102',
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const p = getPlayerState(state, player);
    const unit = p.field.find((u) => u.instanceId === selected[0]);
    if (unit) {
      const boost = unit.gear.length * 2;
      unit.powerModifiers += boost;
      state.endOfTurnEffects.push({
        unitInstanceId: unit.instanceId,
        ownerPlayer: player,
        effect: 'defeat',
        sourceCardId: 'b102',
      });
      return createConfirmAction(state, player, { id: 'b102', name_en: 'Cyberpsychosis' } as CardData,
        `Cyberpsychosis: ${unit.card.name_en} gains +${boost} power. Defeated at end of turn.`,
        `${unit.card.name_en}: +${boost} power (defeated at EOT)`);
    }
    return state;
  },
});
registerHandler('b102_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

// b116 Afterparty at Lizzie's: PLAY — Adjust rival gig by up to ±2
registerHandler('b116', {
  resolve: (state, player, source) => {
    const opp = getPlayerState(state, getOpponent(player));
    if (opp.gigArea.length === 0) {
      return createConfirmAction(state, player, source,
        "Afterparty at Lizzie's: Rival has no Gigs", 'No valid targets');
    }
    state = queueEffectAnimation(state, source, 'PLAY', player);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'SELECT_GIG',
      player,
      description: "Afterparty at Lizzie's: Choose a rival Gig to adjust",
      descriptionKey: 'effect.chooseRivalGigAdjust',
      options: opp.gigArea.map((_, i) => String(i)),
      optionLabels: opp.gigArea.map((g) => `${g.type} (${g.value}/${g.maxValue})`),
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b116',
      sourceHandlerId: 'b116',
      metadata: { targetPlayer: getOpponent(player) },
    });
    return state;
  },
  resolveChoice: (state, player, _pa, selected) => {
    const opp = getPlayerState(state, getOpponent(player));
    const gigIdx = parseInt(selected[0]);
    state.pendingActions.push({
      id: generateInstanceId(),
      type: 'CHOOSE_DIRECTION',
      player,
      description: `Afterparty: Adjust ${opp.gigArea[gigIdx]?.type} (value: ${opp.gigArea[gigIdx]?.value}) by how much?`,
      descriptionKey: 'effect.adjustGigDirection',
      options: ['increase_1', 'increase_2', 'decrease_1', 'decrease_2'],
      optionLabels: ['+1', '+2', '-1', '-2'],
      minSelections: 1,
      maxSelections: 1,
      sourceCardId: 'b116',
      sourceHandlerId: 'b116_direction',
      metadata: { gigIndex: gigIdx, targetPlayer: getOpponent(player), die: opp.gigArea[gigIdx]?.type || '', value: String(opp.gigArea[gigIdx]?.value || 0) },
    });
    return state;
  },
});

registerHandler('b116_direction', {
  resolve: (state) => state,
  resolveChoice: (state, player, pa, selected) => {
    const gigIdx = (pa.metadata?.gigIndex ?? 0) as number;
    const targetPlayer = (pa.metadata?.targetPlayer || getOpponent(player)) as PlayerID;
    const direction = selected[0];
    const opp = getPlayerState(state, targetPlayer);
    const oldVal = opp.gigArea[gigIdx]?.value || 0;

    if (direction === 'increase_1') state = increaseGig(state, targetPlayer, gigIdx, 1);
    else if (direction === 'increase_2') state = increaseGig(state, targetPlayer, gigIdx, 2);
    else if (direction === 'decrease_1') state = decreaseGig(state, targetPlayer, gigIdx, 1);
    else if (direction === 'decrease_2') state = decreaseGig(state, targetPlayer, gigIdx, 2);

    const newVal = opp.gigArea[gigIdx]?.value || 0;
    const p = getPlayerState(state, player);
    let result = `${opp.gigArea[gigIdx]?.type}: ${oldVal} -> ${newVal}`;
    if (p.gigArea.some((g) => g.value === newVal)) {
      state = drawCards(state, player, 1);
      result += '. Friendly gig matches! Drew 1 card';
    }
    return createConfirmAction(state, player, { id: 'b116', name_en: "Afterparty at Lizzie's" } as CardData,
      `Afterparty: ${result}`, result);
  },
});
registerHandler('b116_direction_confirm', { resolve: (s) => s, resolveChoice: (s) => s });

export function initializeAllHandlers(): void {
  // All handlers registered via side-effects on import.
}
