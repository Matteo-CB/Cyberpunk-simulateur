import type { CardData } from '@/lib/data/types';
import type {
  GameState, GameAction, PlayerID, PlayerState, LegendSlot,
  GameLogEntry, UnitOnField, EddyCard, PendingAction,
} from './types';
import {
  STARTING_HAND_SIZE, WIN_GIG_COUNT, CALL_COST, STEAL_POWER_THRESHOLD,
  getOpponent, getPlayerState, setPlayerState,
} from './types';
import {
  generateInstanceId, generateGameId, deepClone, shuffle, rollDie,
  createGigDice, calculateStreetCred, getAvailableEddies, spendEddies,
  calculateEffectivePower, calculateStealCount, createDefaultTrackers,
} from './utils';
import {
  resolvePlayEffect, resolveAttackEffect, resolveFlipEffect,
  resolveChoiceForHandler, triggerAttackHooks, triggerStealHooks,
  triggerFightWinHooks, triggerDefeatHooks, resolveEndOfTurnEffects,
  triggerPassiveOnPlay, triggerDefenseHooks, hasStreetCred,
  calculateContinuousPowerBonus, getHandler, queueEffectAnimation,
} from '@/lib/effects/EffectEngine';
import '@/lib/effects/handlers/index';

export class GameEngine {
  static createGame(
    player1Deck: CardData[],
    player1Legends: CardData[],
    player2Deck: CardData[],
    player2Legends: CardData[],
    options?: {
      player1UserId?: string;
      player2UserId?: string;
      isAI?: boolean;
      aiDifficulty?: string;
    }
  ): GameState {
    const gameId = generateGameId();

    const createPlayerState = (
      id: PlayerID,
      deck: CardData[],
      legends: CardData[],
      userId?: string,
      isAI = false,
      aiDifficulty?: string,
    ): PlayerState => {
      const shuffledLegends = shuffle(legends).map((card): LegendSlot => ({
        card,
        isFaceUp: false,
        isSpent: false,
        isOnField: false,
      }));

      return {
        id,
        userId: userId || null,
        isAI,
        aiDifficulty: aiDifficulty as PlayerState['aiDifficulty'],
        deck: shuffle([...deck]),
        hand: [],
        trash: [],
        field: [],
        legends: shuffledLegends,
        eddies: [],
        fixerArea: createGigDice(),
        gigArea: [],
        streetCred: 0,
        hasSoldThisTurn: false,
        hasCalledThisTurn: false,
        hasCalledInDefenseThisTurn: false,
        hasMulliganed: false,
      };
    };

    const state: GameState = {
      gameId,
      turn: 0,
      phase: 'setup',
      activePlayer: 'player1',
      player1: createPlayerState(
        'player1', player1Deck, player1Legends,
        options?.player1UserId, false
      ),
      player2: createPlayerState(
        'player2', player2Deck, player2Legends,
        options?.player2UserId, options?.isAI || false, options?.aiDifficulty
      ),
      log: [],
      pendingEffects: [],
      pendingActions: [],
      overtime: false,
      lastGigTakenThisTurn: { player1: false, player2: false },
      endOfTurnEffects: [],
      passiveTrackers: createDefaultTrackers(),
      effectAnimationQueue: [],
    };

    // Randomly choose first player
    state.activePlayer = Math.random() < 0.5 ? 'player1' : 'player2';

    // First player spends 2 legends as penalty
    const firstPlayer = getPlayerState(state, state.activePlayer);
    let spent = 0;
    for (const legend of firstPlayer.legends) {
      if (spent >= 2) break;
      legend.isSpent = true;
      spent++;
    }

    // Draw starting hands
    GameEngine.drawCards(state.player1, STARTING_HAND_SIZE);
    GameEngine.drawCards(state.player2, STARTING_HAND_SIZE);

    state.phase = 'mulligan';
    addLog(state, state.activePlayer, 'GAME_START', { firstPlayer: state.activePlayer });

    return state;
  }

  static applyAction(state: GameState, player: PlayerID, action: GameAction): GameState {
    const newState = deepClone(state);

    switch (action.type) {
      case 'MULLIGAN':
        return GameEngine.handleMulligan(newState, player, action.doMulligan);
      case 'CHOOSE_GIG_DIE':
        return GameEngine.handleChooseGig(newState, player, action.dieIndex);
      case 'SELL_CARD':
        return GameEngine.handleSellCard(newState, player, action.cardIndex);
      case 'CALL_LEGEND':
        return GameEngine.handleCallLegend(newState, player, action.legendIndex);
      case 'PLAY_UNIT':
        return GameEngine.handlePlayUnit(newState, player, action.cardIndex);
      case 'PLAY_GEAR':
        return GameEngine.handlePlayGear(newState, player, action.cardIndex, action.targetInstanceId);
      case 'PLAY_PROGRAM':
        return GameEngine.handlePlayProgram(newState, player, action.cardIndex);
      case 'GO_SOLO':
        return GameEngine.handleGoSolo(newState, player, action.legendIndex);
      case 'END_PLAY_PHASE':
        return GameEngine.handleEndPlayPhase(newState, player);
      case 'ATTACK_UNIT':
        return GameEngine.handleAttackUnit(newState, player, action.attackerInstanceId, action.targetInstanceId);
      case 'ATTACK_RIVAL':
        return GameEngine.handleAttackRival(newState, player, action.attackerInstanceId);
      case 'USE_BLOCKER':
        return GameEngine.handleUseBlocker(newState, player, action.blockerInstanceId);
      case 'CALL_LEGEND_DEFENSE':
        return GameEngine.handleCallLegendDefense(newState, player, action.legendIndex);
      case 'DECLINE_DEFENSE':
        return GameEngine.handleDeclineDefense(newState, player);
      case 'SELECT_GIG_TO_STEAL':
        return GameEngine.handleSelectGigToSteal(newState, player, action.gigDieIndex);
      case 'END_ATTACK_PHASE':
        return GameEngine.handleEndAttackPhase(newState, player);
      case 'FORFEIT':
        return GameEngine.handleForfeit(newState, player, action.reason);
      case 'SELECT_TARGET':
        return GameEngine.handleSelectTarget(newState, player, action.pendingActionId, action.selectedTargets);
      case 'DECLINE_OPTIONAL_EFFECT':
        return GameEngine.handleDeclineEffect(newState, player, action.pendingEffectId);
      case 'ACTIVATE_SPEND_ABILITY':
        return GameEngine.handleActivateSpendAbility(newState, player, action.unitInstanceId);
      default:
        return newState;
    }
  }

  static getValidActions(state: GameState, player: PlayerID): GameAction[] {
    const actions: GameAction[] = [];
    const playerState = getPlayerState(state, player);
    const opponent = getPlayerState(state, getOpponent(player));

    if (state.phase === 'gameOver') return [];

    // Pending actions take priority
    if (state.pendingActions.length > 0) {
      const pending = state.pendingActions[0];
      if (pending.player === player) {
        // For optional effects, add decline option
        if (pending.isOptional) {
          actions.push({
            type: 'DECLINE_OPTIONAL_EFFECT',
            pendingEffectId: pending.id,
          });
        }
        return pending.options.map((opt) => ({
          type: 'SELECT_TARGET' as const,
          pendingActionId: pending.id,
          selectedTargets: [opt],
        }));
      }
      return [];
    }

    if (state.phase === 'mulligan') {
      if (!playerState.hasMulliganed) {
        actions.push({ type: 'MULLIGAN', doMulligan: true });
        actions.push({ type: 'MULLIGAN', doMulligan: false });
      }
      return actions;
    }

    if (state.phase === 'ready' && state.activePlayer === player) {
      playerState.fixerArea.forEach((_, i) => {
        const die = playerState.fixerArea[i];
        if (die.type === 'd20' && playerState.fixerArea.length > 1) return;
        actions.push({ type: 'CHOOSE_GIG_DIE', dieIndex: i });
      });
      return actions;
    }

    if (state.phase === 'play' && state.activePlayer === player) {
      const availableEddies = getAvailableEddies(playerState);

      // Sell card (once per turn)
      if (!playerState.hasSoldThisTurn) {
        playerState.hand.forEach((card, i) => {
          if (card.sell_tag) {
            actions.push({ type: 'SELL_CARD', cardIndex: i });
          }
        });
      }

      // Call legend (once per turn)
      if (!playerState.hasCalledThisTurn && availableEddies >= CALL_COST) {
        playerState.legends.forEach((legend, i) => {
          if (!legend.isFaceUp && !legend.isOnField) {
            actions.push({ type: 'CALL_LEGEND', legendIndex: i });
          }
        });
      }

      // Play cards from hand
      playerState.hand.forEach((card, i) => {
        if (card.cost !== null && card.cost <= availableEddies) {
          if (card.card_type === 'unit') {
            actions.push({ type: 'PLAY_UNIT', cardIndex: i });
          } else if (card.card_type === 'gear') {
            for (const unit of playerState.field) {
              actions.push({ type: 'PLAY_GEAR', cardIndex: i, targetInstanceId: unit.instanceId });
            }
          } else if (card.card_type === 'program') {
            actions.push({ type: 'PLAY_PROGRAM', cardIndex: i });
          }
        }
      });

      // Go Solo
      playerState.legends.forEach((legend, i) => {
        if (legend.isFaceUp && !legend.isOnField && !legend.isSpent
            && legend.card.keywords.includes('Go Solo')
            && legend.card.cost !== null
            && legend.card.cost <= availableEddies) {
          actions.push({ type: 'GO_SOLO', legendIndex: i });
        }
      });

      // b067 Kerry Eurodyne: Spend ability
      for (const unit of playerState.field) {
        if (unit.card.id === 'b067' && !unit.isSpent) {
          const hasMaxGig = playerState.gigArea.some((g) => g.value >= g.maxValue);
          if (hasMaxGig) {
            actions.push({ type: 'ACTIVATE_SPEND_ABILITY', unitInstanceId: unit.instanceId });
          }
        }
      }

      actions.push({ type: 'END_PLAY_PHASE' });
      return actions;
    }

    if (state.phase === 'attack' && state.activePlayer === player) {
      // b102 Cyberpsychosis: playable during attack phase
      const availableEddies = getAvailableEddies(playerState);
      playerState.hand.forEach((card, i) => {
        if (card.id === 'b102' && card.cost !== null && card.cost <= availableEddies) {
          actions.push({ type: 'PLAY_PROGRAM', cardIndex: i });
        }
      });

      for (const unit of playerState.field) {
        // a014/a016: Can't attack
        if (unit.card.id === 'a014' || unit.card.id === 'a016') continue;
        // Can't attack check for units with "can't attack" passive
        if (unit.card.effects.some((e) => e.description_en.toLowerCase().includes("can't attack"))) continue;

        // b042 Riding Nomad: can attack spent units even when playedThisTurn
        if (unit.card.id === 'b042' && unit.playedThisTurn) {
          for (const target of opponent.field) {
            if (target.isSpent) {
              actions.push({
                type: 'ATTACK_UNIT',
                attackerInstanceId: unit.instanceId,
                targetInstanceId: target.instanceId,
              });
            }
          }
          continue;
        }

        // Sandevistan: canAttackThisTurn override
        if (unit.playedThisTurn && unit.canAttackThisTurn) {
          for (const target of opponent.field) {
            if (target.isSpent) {
              actions.push({
                type: 'ATTACK_UNIT',
                attackerInstanceId: unit.instanceId,
                targetInstanceId: target.instanceId,
              });
            }
          }
          actions.push({ type: 'ATTACK_RIVAL', attackerInstanceId: unit.instanceId });
          continue;
        }

        if (!unit.isSpent && !unit.playedThisTurn) {
          // Attack spent opponent units
          for (const target of opponent.field) {
            if (target.isSpent) {
              actions.push({
                type: 'ATTACK_UNIT',
                attackerInstanceId: unit.instanceId,
                targetInstanceId: target.instanceId,
              });
            }
          }
          // Attack rival directly
          actions.push({ type: 'ATTACK_RIVAL', attackerInstanceId: unit.instanceId });
        }
      }
      actions.push({ type: 'END_ATTACK_PHASE' });
      return actions;
    }

    if (state.phase === 'defense' && state.currentAttack) {
      const defender = getOpponent(state.currentAttack.attackerPlayer);
      if (player === defender) {
        const defenderState = getPlayerState(state, defender);

        // Check if attacker is a012 Flathead with 7+ SC (unblockable)
        const attackerState = getPlayerState(state, state.currentAttack.attackerPlayer);
        const attacker = attackerState.field.find((u) => u.instanceId === state.currentAttack!.attackerInstanceId);
        const isUnblockable = attacker?.card.id === 'a012' && hasStreetCred(state, state.currentAttack.attackerPlayer, 7);

        if (!isUnblockable) {
          // Use blocker
          for (const unit of defenderState.field) {
            if (!unit.isSpent) {
              // Check unit keywords
              if (unit.card.keywords.includes('Blocker') || unit.temporaryBlocker) {
                actions.push({ type: 'USE_BLOCKER', blockerInstanceId: unit.instanceId });
              }
              // Check gear with Blocker keyword (a027 Mandibular Upgrade)
              for (const gear of unit.gear) {
                if (gear.keywords.includes('Blocker')) {
                  actions.push({ type: 'USE_BLOCKER', blockerInstanceId: unit.instanceId });
                  break;
                }
              }
            }
          }
        }

        // Call legend in defense (once per turn)
        if (!defenderState.hasCalledInDefenseThisTurn && getAvailableEddies(defenderState) >= CALL_COST) {
          defenderState.legends.forEach((legend, i) => {
            if (!legend.isFaceUp && !legend.isOnField) {
              actions.push({ type: 'CALL_LEGEND_DEFENSE', legendIndex: i });
            }
          });
        }

        actions.push({ type: 'DECLINE_DEFENSE' });
      }
      return actions;
    }

    // Forfeit is always available
    actions.push({ type: 'FORFEIT', reason: 'abandon' });
    return actions;
  }

  // --- Phase Handlers ---

  private static handleMulligan(state: GameState, player: PlayerID, doMulligan: boolean): GameState {
    const playerState = getPlayerState(state, player);
    if (playerState.hasMulliganed) return state;

    if (doMulligan) {
      playerState.deck = shuffle([...playerState.deck, ...playerState.hand]);
      playerState.hand = [];
      GameEngine.drawCards(playerState, STARTING_HAND_SIZE);
      addLog(state, player, 'MULLIGAN', { accepted: true });
    } else {
      addLog(state, player, 'MULLIGAN', { accepted: false });
    }
    playerState.hasMulliganed = true;

    if (state.player1.hasMulliganed && state.player2.hasMulliganed) {
      state.turn = 1;
      state.phase = 'ready';
      addLog(state, state.activePlayer, 'TURN_START', { turn: 1 });
    } else {
      state.activePlayer = getOpponent(player);
    }

    return state;
  }

  private static handleChooseGig(state: GameState, player: PlayerID, dieIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    if (dieIndex < 0 || dieIndex >= playerState.fixerArea.length) return state;

    const die = playerState.fixerArea[dieIndex];
    if (die.type === 'd20' && playerState.fixerArea.length > 1) return state;

    die.value = rollDie(die.type);
    playerState.fixerArea.splice(dieIndex, 1);
    playerState.gigArea.push(die);
    playerState.streetCred = calculateStreetCred(playerState.gigArea);
    state.lastGigTakenThisTurn[player] = true;

    addLog(state, player, 'GAIN_GIG', { dieType: die.type, value: die.value });

    // Draw a card
    if (playerState.deck.length === 0) {
      state.phase = 'gameOver';
      state.winner = getOpponent(player);
      state.winReason = 'deckout';
      addLog(state, player, 'DECK_OUT');
      return state;
    }
    GameEngine.drawCards(playerState, 1);

    // Ready all spent cards
    GameEngine.readyAllCards(playerState);

    // Reset per-turn flags
    playerState.hasSoldThisTurn = false;
    playerState.hasCalledThisTurn = false;
    playerState.hasCalledInDefenseThisTurn = false;
    for (const unit of playerState.field) {
      unit.playedThisTurn = false;
      unit.powerModifiers = 0;
      unit.canAttackThisTurn = undefined;
      unit.temporaryBlocker = undefined;
    }

    // Reset passive trackers for this player
    state.passiveTrackers.a001_firstArasakaAttack[player] = false;
    state.passiveTrackers.a002_firstBlueCard[player] = false;
    state.passiveTrackers.b111_firstSteal[player] = false;
    state.passiveTrackers.b125_goroSpendUsed[player] = false;

    // Clear end-of-turn effects from previous turn
    state.endOfTurnEffects = state.endOfTurnEffects.filter((e) => e.ownerPlayer !== player);

    state.phase = 'play';
    return state;
  }

  private static handleSellCard(state: GameState, player: PlayerID, cardIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    if (playerState.hasSoldThisTurn) return state;

    const card = playerState.hand[cardIndex];
    if (!card || !card.sell_tag) return state;

    playerState.hand.splice(cardIndex, 1);
    playerState.eddies.push({
      instanceId: generateInstanceId(),
      originalCard: card,
      isSpent: false,
    });
    playerState.hasSoldThisTurn = true;

    addLog(state, player, 'SELL_CARD', { cardId: card.id, cardName: card.name_en });
    return state;
  }

  private static handleCallLegend(state: GameState, player: PlayerID, legendIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    if (playerState.hasCalledThisTurn) return state;
    if (getAvailableEddies(playerState) < CALL_COST) return state;

    const legend = playerState.legends[legendIndex];
    if (!legend || legend.isFaceUp || legend.isOnField) return state;

    spendEddies(playerState, CALL_COST);
    legend.isFaceUp = true;
    playerState.hasCalledThisTurn = true;

    addLog(state, player, 'CALL_LEGEND', { cardId: legend.card.id, cardName: legend.card.name_en });

    // Resolve FLIP/CALL triggers
    state = resolveFlipEffect(state, player, legend.card);
    return state;
  }

  private static handlePlayUnit(state: GameState, player: PlayerID, cardIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    const card = playerState.hand[cardIndex];
    if (!card || card.card_type !== 'unit') return state;
    if (card.cost === null || card.cost > getAvailableEddies(playerState)) return state;

    spendEddies(playerState, card.cost);
    playerState.hand.splice(cardIndex, 1);

    const unit: UnitOnField = {
      instanceId: generateInstanceId(),
      card,
      isSpent: false,
      gear: [],
      gearInstanceIds: [],
      powerModifiers: 0,
      playedThisTurn: true,
      controlledBy: player,
      originalOwner: player,
      isGoSoloLegend: false,
    };
    playerState.field.push(unit);

    addLog(state, player, 'PLAY_UNIT', { cardId: card.id, cardName: card.name_en, cost: card.cost });

    // Trigger passive on play (a002 Jackie)
    state = triggerPassiveOnPlay(state, player, card);

    // Resolve PLAY triggers
    state = resolvePlayEffect(state, player, card, unit.instanceId);
    return state;
  }

  private static handlePlayGear(state: GameState, player: PlayerID, cardIndex: number, targetInstanceId: string): GameState {
    const playerState = getPlayerState(state, player);
    const card = playerState.hand[cardIndex];
    if (!card || card.card_type !== 'gear') return state;
    if (card.cost === null || card.cost > getAvailableEddies(playerState)) return state;

    const target = playerState.field.find((u) => u.instanceId === targetInstanceId);
    if (!target) return state;

    spendEddies(playerState, card.cost);
    playerState.hand.splice(cardIndex, 1);
    target.gear.push(card);
    target.gearInstanceIds.push(generateInstanceId());

    addLog(state, player, 'PLAY_GEAR', {
      cardId: card.id, cardName: card.name_en,
      targetName: target.card.name_en, cost: card.cost,
    });

    // a024 Sandevistan: equipped unit can attack this turn
    if (card.id === 'a024') {
      target.canAttackThisTurn = true;
    }

    // Trigger passive on play (a002 Jackie for blue gear)
    state = triggerPassiveOnPlay(state, player, card);

    // Resolve PLAY triggers
    state = resolvePlayEffect(state, player, card, targetInstanceId);
    return state;
  }

  private static handlePlayProgram(state: GameState, player: PlayerID, cardIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    const card = playerState.hand[cardIndex];
    if (!card || card.card_type !== 'program') return state;
    if (card.cost === null || card.cost > getAvailableEddies(playerState)) return state;

    spendEddies(playerState, card.cost);
    playerState.hand.splice(cardIndex, 1);

    addLog(state, player, 'PLAY_PROGRAM', { cardId: card.id, cardName: card.name_en, cost: card.cost });

    // Resolve effect BEFORE trashing
    state = resolvePlayEffect(state, player, card);

    // Only trash if no pending actions were created (otherwise defer)
    if (state.pendingActions.length === 0) {
      playerState.trash.push(card);
    } else {
      // Store card in last pending action for deferred trash
      const lastPending = state.pendingActions[state.pendingActions.length - 1];
      if (lastPending && !lastPending.metadata?.programCardToTrash) {
        lastPending.metadata = { ...lastPending.metadata, programCardToTrash: card };
      }
    }

    return state;
  }

  private static handleGoSolo(state: GameState, player: PlayerID, legendIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    const legend = playerState.legends[legendIndex];
    if (!legend || !legend.isFaceUp || legend.isOnField || legend.isSpent) return state;
    if (!legend.card.keywords.includes('Go Solo')) return state;
    if (legend.card.cost === null || legend.card.cost > getAvailableEddies(playerState)) return state;

    spendEddies(playerState, legend.card.cost);
    legend.isOnField = true;

    const unit: UnitOnField = {
      instanceId: generateInstanceId(),
      card: legend.card,
      isSpent: false,
      gear: [],
      gearInstanceIds: [],
      powerModifiers: 0,
      playedThisTurn: false, // Go Solo units CAN attack this turn
      controlledBy: player,
      originalOwner: player,
      isGoSoloLegend: true,
      legendSlotIndex: legendIndex,
    };
    legend.goSoloInstanceId = unit.instanceId;
    playerState.field.push(unit);

    addLog(state, player, 'GO_SOLO', { cardId: legend.card.id, cardName: legend.card.name_en });
    return state;
  }

  private static handleEndPlayPhase(state: GameState, _player: PlayerID): GameState {
    state.phase = 'attack';
    addLog(state, state.activePlayer, 'END_PLAY_PHASE');
    return state;
  }

  private static handleAttackUnit(state: GameState, player: PlayerID, attackerInstanceId: string, targetInstanceId: string): GameState {
    const playerState = getPlayerState(state, player);
    const opponent = getPlayerState(state, getOpponent(player));
    const attacker = playerState.field.find((u) => u.instanceId === attackerInstanceId);
    const target = opponent.field.find((u) => u.instanceId === targetInstanceId);

    if (!attacker || !target) return state;

    // Validate: normal units must not be spent and not playedThisTurn
    // Exception: b042 can attack spent units when playedThisTurn
    // Exception: canAttackThisTurn (Sandevistan)
    const canAttack = (
      (!attacker.isSpent && !attacker.playedThisTurn) ||
      (attacker.card.id === 'b042' && attacker.playedThisTurn) ||
      (attacker.playedThisTurn && attacker.canAttackThisTurn)
    );
    if (!canAttack || !target.isSpent) return state;

    attacker.isSpent = true;
    state.currentAttack = {
      attackerInstanceId,
      attackerPlayer: player,
      targetType: 'unit',
      targetInstanceId,
      phase: 'defensive',
      resolved: false,
    };
    state.phase = 'defense';

    addLog(state, player, 'ATTACK_UNIT', {
      attackerName: attacker.card.name_en,
      targetName: target.card.name_en,
    });

    // Resolve ATTACK triggers (on attacker card + gear)
    state = triggerAttackHooks(state, player, attackerInstanceId);
    state = resolveAttackEffect(state, player, attacker.card, attackerInstanceId);
    for (const gear of attacker.gear) {
      state = resolveAttackEffect(state, player, gear, attackerInstanceId);
    }

    // Trigger defense hooks (b125 Goro Takemura)
    state = triggerDefenseHooks(state, getOpponent(player));

    return state;
  }

  private static handleAttackRival(state: GameState, player: PlayerID, attackerInstanceId: string): GameState {
    const playerState = getPlayerState(state, player);
    const attacker = playerState.field.find((u) => u.instanceId === attackerInstanceId);

    if (!attacker) return state;
    const canAttack = (!attacker.isSpent && !attacker.playedThisTurn) ||
      (attacker.playedThisTurn && attacker.canAttackThisTurn);
    if (!canAttack) return state;

    attacker.isSpent = true;
    state.currentAttack = {
      attackerInstanceId,
      attackerPlayer: player,
      targetType: 'rival',
      phase: 'defensive',
      resolved: false,
    };
    state.phase = 'defense';

    addLog(state, player, 'ATTACK_RIVAL', { attackerName: attacker.card.name_en });

    // Resolve ATTACK triggers
    state = triggerAttackHooks(state, player, attackerInstanceId);
    state = resolveAttackEffect(state, player, attacker.card, attackerInstanceId);
    for (const gear of attacker.gear) {
      state = resolveAttackEffect(state, player, gear, attackerInstanceId);
    }

    // Trigger defense hooks (b125 Goro Takemura)
    state = triggerDefenseHooks(state, getOpponent(player));

    return state;
  }

  private static handleUseBlocker(state: GameState, _player: PlayerID, blockerInstanceId: string): GameState {
    if (!state.currentAttack) return state;
    const defender = getOpponent(state.currentAttack.attackerPlayer);
    const defenderState = getPlayerState(state, defender);
    const blocker = defenderState.field.find((u) => u.instanceId === blockerInstanceId);

    if (!blocker || blocker.isSpent) return state;

    blocker.isSpent = true;
    state.currentAttack.blockerInstanceId = blockerInstanceId;
    state.currentAttack.targetType = 'unit';
    state.currentAttack.targetInstanceId = blockerInstanceId;

    addLog(state, defender, 'USE_BLOCKER', { blockerName: blocker.card.name_en });

    return GameEngine.resolveAttack(state);
  }

  private static handleCallLegendDefense(state: GameState, player: PlayerID, legendIndex: number): GameState {
    const playerState = getPlayerState(state, player);
    if (playerState.hasCalledInDefenseThisTurn) return state;
    if (getAvailableEddies(playerState) < CALL_COST) return state;

    const legend = playerState.legends[legendIndex];
    if (!legend || legend.isFaceUp || legend.isOnField) return state;

    spendEddies(playerState, CALL_COST);
    legend.isFaceUp = true;
    playerState.hasCalledInDefenseThisTurn = true;

    addLog(state, player, 'CALL_LEGEND_DEFENSE', { cardId: legend.card.id, cardName: legend.card.name_en });

    // Resolve FLIP/CALL triggers
    state = resolveFlipEffect(state, player, legend.card);

    return state;
  }

  private static handleDeclineDefense(state: GameState, _player: PlayerID): GameState {
    return GameEngine.resolveAttack(state);
  }

  private static handleSelectGigToSteal(state: GameState, player: PlayerID, gigDieIndex: number): GameState {
    const opponent = getPlayerState(state, getOpponent(player));
    if (gigDieIndex < 0 || gigDieIndex >= opponent.gigArea.length) return state;

    const playerState = getPlayerState(state, player);
    const die = opponent.gigArea.splice(gigDieIndex, 1)[0];
    die.stolenFrom = getOpponent(player);
    playerState.gigArea.push(die);
    playerState.streetCred = calculateStreetCred(playerState.gigArea);
    opponent.streetCred = calculateStreetCred(opponent.gigArea);

    addLog(state, player, 'STEAL_GIG', { dieType: die.type, value: die.value });

    // Trigger steal hooks (a008, a011, b111)
    state = triggerStealHooks(state, player, die);

    // Remove the first SELECT_GIG pending action (not all of them)
    const stealIdx = state.pendingActions.findIndex((a) => a.type === 'SELECT_GIG' && a.sourceCardId === 'steal');
    if (stealIdx !== -1) state.pendingActions.splice(stealIdx, 1);

    // Check if more gigs to steal
    const remaining = state.pendingActions.filter((a) => a.type === 'SELECT_GIG' && a.sourceCardId === 'steal');
    if (remaining.length === 0) {
      state.phase = 'attack';
      state.currentAttack = undefined;

      // Check overtime win
      if (state.overtime && playerState.gigArea.length > opponent.gigArea.length) {
        state.phase = 'gameOver';
        state.winner = player;
        state.winReason = 'overtime';
      }
    }

    return state;
  }

  private static handleEndAttackPhase(state: GameState, player: PlayerID): GameState {
    // Resolve end-of-turn effects (a028 Reboot Optics, b102 Cyberpsychosis)
    state = resolveEndOfTurnEffects(state, player);

    state.phase = 'ready';
    state.activePlayer = getOpponent(player);
    state.turn++;
    state.lastGigTakenThisTurn = { player1: false, player2: false };

    // Check win condition at start of opponent's turn
    const nextPlayer = getPlayerState(state, state.activePlayer);
    if (nextPlayer.gigArea.length >= WIN_GIG_COUNT) {
      state.phase = 'gameOver';
      state.winner = state.activePlayer;
      state.winReason = 'gigs';
      addLog(state, state.activePlayer, 'WIN', { reason: 'gigs', gigCount: nextPlayer.gigArea.length });
      return state;
    }

    // Check overtime
    if (nextPlayer.fixerArea.length === 0) {
      state.overtime = true;
    }

    addLog(state, state.activePlayer, 'TURN_START', { turn: state.turn });
    return state;
  }

  private static handleForfeit(state: GameState, player: PlayerID, reason: string): GameState {
    state.phase = 'gameOver';
    state.winner = getOpponent(player);
    state.winReason = 'forfeit';
    addLog(state, player, 'FORFEIT', { reason });
    return state;
  }

  private static handleSelectTarget(state: GameState, player: PlayerID, pendingActionId: string, selectedTargets: string[]): GameState {
    const pendingAction = state.pendingActions.find((a) => a.id === pendingActionId);
    if (!pendingAction || pendingAction.player !== player) return state;

    // Steal gig selection: route to handleSelectGigToSteal
    if (pendingAction.sourceCardId === 'steal' && pendingAction.type === 'SELECT_GIG') {
      const gigIdx = parseInt(selectedTargets[0]);
      state.pendingActions = state.pendingActions.filter((a) => a.id !== pendingActionId);
      return GameEngine.handleSelectGigToSteal(state, player, gigIdx);
    }

    // CONFIRM_EFFECT with _confirm handler: just dismiss (effect already applied)
    if (pendingAction.type === 'CONFIRM_EFFECT' && pendingAction.sourceHandlerId?.endsWith('_confirm')) {
      state.pendingActions = state.pendingActions.filter((a) => a.id !== pendingActionId);
      return state;
    }

    return resolveChoiceForHandler(state, player, pendingAction, selectedTargets);
  }

  private static handleDeclineEffect(state: GameState, _player: PlayerID, pendingEffectId: string): GameState {
    state.pendingEffects = state.pendingEffects.filter((e) => e.id !== pendingEffectId);
    const declined = state.pendingActions.find((a) => a.id === pendingEffectId);
    state.pendingActions = state.pendingActions.filter((a) => a.id !== pendingEffectId);

    // For CONFIRM_EFFECT that was just informational, also remove any _confirm pending
    if (declined?.type === 'CONFIRM_EFFECT') {
      state.pendingActions = state.pendingActions.filter(
        (a) => !(a.type === 'CONFIRM_EFFECT' && a.sourceHandlerId === declined.sourceHandlerId)
      );
    }
    return state;
  }

  private static handleActivateSpendAbility(state: GameState, player: PlayerID, unitInstanceId: string): GameState {
    const playerState = getPlayerState(state, player);
    const unit = playerState.field.find((u) => u.instanceId === unitInstanceId);
    if (!unit || unit.isSpent) return state;

    // b067 Kerry Eurodyne: Spend to draw 2 if gig at max
    if (unit.card.id === 'b067') {
      unit.isSpent = true;
      const handler = getHandler('b067');
      if (handler) {
        state = handler.resolve(state, player, unit.card);
      }
      addLog(state, player, 'SPEND_ABILITY', { cardName: unit.card.name_en });
    }

    return state;
  }

  // --- Resolution ---

  private static resolveAttack(state: GameState): GameState {
    if (!state.currentAttack) return state;

    const { attackerInstanceId, attackerPlayer, targetType, targetInstanceId } = state.currentAttack;
    const attackerState = getPlayerState(state, attackerPlayer);
    const defenderPlayer = getOpponent(attackerPlayer);
    const defenderState = getPlayerState(state, defenderPlayer);

    const attacker = attackerState.field.find((u) => u.instanceId === attackerInstanceId);
    if (!attacker) {
      state.phase = 'attack';
      state.currentAttack = undefined;
      return state;
    }

    const attackerPower = calculateEffectivePower(attacker) + calculateContinuousPowerBonus(state, attackerPlayer, attacker);

    if (targetType === 'unit' && targetInstanceId) {
      // FIGHT
      const target = defenderState.field.find((u) => u.instanceId === targetInstanceId);
      if (!target) {
        state.phase = 'attack';
        state.currentAttack = undefined;
        return state;
      }

      const targetPower = calculateEffectivePower(target) + calculateContinuousPowerBonus(state, defenderPlayer, target);

      addLog(state, attackerPlayer, 'FIGHT', {
        attackerName: attacker.card.name_en, attackerPower,
        targetName: target.card.name_en, targetPower,
      });

      if (attackerPower > targetPower) {
        // Attacker wins
        state = triggerFightWinHooks(state, attackerPlayer, attackerInstanceId);
        state = triggerDefeatHooks(state, defenderPlayer, target.card);
        GameEngine.defeatUnit(defenderState, targetInstanceId);
        addLog(state, attackerPlayer, 'DEFEAT', { defeated: target.card.name_en });
      } else if (targetPower > attackerPower) {
        state = triggerDefeatHooks(state, attackerPlayer, attacker.card);
        GameEngine.defeatUnit(attackerState, attackerInstanceId);
        addLog(state, defenderPlayer, 'DEFEAT', { defeated: attacker.card.name_en });
      } else {
        state = triggerDefeatHooks(state, defenderPlayer, target.card);
        state = triggerDefeatHooks(state, attackerPlayer, attacker.card);
        GameEngine.defeatUnit(defenderState, targetInstanceId);
        GameEngine.defeatUnit(attackerState, attackerInstanceId);
        addLog(state, attackerPlayer, 'MUTUAL_DEFEAT', {
          unit1: attacker.card.name_en, unit2: target.card.name_en,
        });
      }
    } else if (targetType === 'rival') {
      // STEAL
      if (defenderState.gigArea.length === 0) {
        addLog(state, attackerPlayer, 'STEAL_FAILED', { reason: 'no_gigs' });
        state.phase = 'attack';
        state.currentAttack = undefined;
        return state;
      }

      const stealCount = Math.min(calculateStealCount(attackerPower), defenderState.gigArea.length);

      // Create pending actions for each steal
      for (let i = 0; i < stealCount; i++) {
        state.pendingActions.push({
          id: generateInstanceId(),
          type: 'SELECT_GIG',
          player: attackerPlayer,
          description: `Choose a rival Gig Die to steal (${i + 1}/${stealCount})`,
          descriptionKey: 'effect.chooseRivalGigSteal',
          options: defenderState.gigArea.map((_, idx) => String(idx)),
          minSelections: 1,
          maxSelections: 1,
          sourceCardId: 'steal',
          sourceHandlerId: 'steal',
          metadata: { targetPlayer: defenderPlayer, current: String(i + 1), total: String(stealCount) },
        });
      }

      addLog(state, attackerPlayer, 'STEAL_ATTEMPT', { count: stealCount, power: attackerPower });

      if (stealCount === 1 && defenderState.gigArea.length === 1) {
        return GameEngine.handleSelectGigToSteal(state, attackerPlayer, 0);
      }

      return state;
    }

    state.phase = 'attack';
    state.currentAttack = undefined;
    return state;
  }

  // --- Utility Methods ---

  private static drawCards(player: PlayerState, count: number): void {
    for (let i = 0; i < count; i++) {
      if (player.deck.length === 0) break;
      player.hand.push(player.deck.pop()!);
    }
  }

  private static readyAllCards(player: PlayerState): void {
    for (const eddie of player.eddies) eddie.isSpent = false;
    for (const legend of player.legends) {
      if (!legend.isOnField) legend.isSpent = false;
    }
    for (const unit of player.field) unit.isSpent = false;
  }

  private static defeatUnit(player: PlayerState, instanceId: string): void {
    const idx = player.field.findIndex((u) => u.instanceId === instanceId);
    if (idx === -1) return;

    const unit = player.field[idx];
    player.trash.push(unit.card);
    for (const gear of unit.gear) {
      player.trash.push(gear);
    }

    if (unit.isGoSoloLegend && unit.legendSlotIndex !== undefined) {
      const legend = player.legends[unit.legendSlotIndex];
      if (legend) {
        legend.isOnField = false;
        legend.goSoloInstanceId = undefined;
      }
    }

    player.field.splice(idx, 1);
  }
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
