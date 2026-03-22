// Yorinobu Arasaka - Embracing Destruction (Legend, Red)
// PASSIVE: First time a friendly Arasaka unit attacks each turn, draw a card.
// Then, if < 20 Street Cred, discard 1 card.
import { registerHandler } from '../../EffectEngine';
import type { GameState, PlayerID } from '@/lib/engine/types';
import { getPlayerState } from '@/lib/engine/types';
import { drawCards, hasStreetCred } from '../../EffectEngine';

registerHandler('a001', {
  resolve: (state, player) => {
    // This is tracked per-turn via a flag. Actual trigger happens in AttackPhase.
    // For now, the logic is: after first Arasaka unit attack, draw 1, then maybe discard 1.
    state = drawCards(state, player, 1);
    if (!hasStreetCred(state, player, 20)) {
      const p = getPlayerState(state, player);
      if (p.hand.length > 0) {
        p.trash.push(p.hand.pop()!);
      }
    }
    return state;
  },
});
