/**
 * Single-elimination bracket generator and manager.
 * Supports power-of-2 brackets with byes for non-power-of-2 participant counts.
 */

export interface TournamentParticipant {
  id: string;
  name: string;
  elo?: number;
  seed?: number;
}

export interface TournamentMatch {
  id: string;
  round: number;
  position: number;
  player1Id: string | null;
  player2Id: string | null;
  winnerId: string | null;
  loserId: string | null;
  nextMatchId: string | null;
  nextMatchSlot: 'player1' | 'player2' | null;
  isBye: boolean;
  status: 'pending' | 'ready' | 'in_progress' | 'completed';
}

/**
 * Calculate the total number of rounds for a given player count.
 */
export function calculateTotalRounds(playerCount: number): number {
  if (playerCount <= 1) return 0;
  return Math.ceil(Math.log2(playerCount));
}

/**
 * Generate a single-elimination bracket with seeding and byes.
 *
 * Participants are seeded by their array index (0 = top seed) unless
 * they have an explicit `seed` property. Higher-seeded players get byes
 * when the count is not a power of 2.
 */
export function generateBracket(participants: TournamentParticipant[]): TournamentMatch[] {
  if (participants.length < 2) {
    throw new Error('Need at least 2 participants to generate a bracket');
  }

  // Sort participants by seed (or index)
  const seeded = participants.map((p, i) => ({
    ...p,
    seed: p.seed ?? i + 1,
  }));
  seeded.sort((a, b) => a.seed - b.seed);

  const totalRounds = calculateTotalRounds(seeded.length);
  const bracketSize = Math.pow(2, totalRounds); // next power of 2
  const byeCount = bracketSize - seeded.length;

  // Place participants into bracket slots using standard seeding pattern
  const slots: (string | null)[] = new Array(bracketSize).fill(null);
  const seedOrder = generateSeedOrder(bracketSize);

  for (let i = 0; i < seeded.length; i++) {
    slots[seedOrder[i]] = seeded[i].id;
  }

  // Generate all matches
  const matches: TournamentMatch[] = [];
  let matchCounter = 0;

  // Build matches round by round
  // Round 1 has bracketSize/2 matches, round 2 has bracketSize/4, etc.
  const matchesByRound: TournamentMatch[][] = [];

  for (let round = 1; round <= totalRounds; round++) {
    const roundMatches: TournamentMatch[] = [];
    const matchCountInRound = bracketSize / Math.pow(2, round);

    for (let pos = 0; pos < matchCountInRound; pos++) {
      matchCounter++;
      const matchId = `match_${matchCounter}`;

      const match: TournamentMatch = {
        id: matchId,
        round,
        position: pos,
        player1Id: null,
        player2Id: null,
        winnerId: null,
        loserId: null,
        nextMatchId: null,
        nextMatchSlot: null,
        isBye: false,
        status: 'pending',
      };

      roundMatches.push(match);
      matches.push(match);
    }

    matchesByRound.push(roundMatches);
  }

  // Wire up next-match pointers
  for (let r = 0; r < matchesByRound.length - 1; r++) {
    const currentRound = matchesByRound[r];
    const nextRound = matchesByRound[r + 1];

    for (let i = 0; i < currentRound.length; i++) {
      const nextMatchIndex = Math.floor(i / 2);
      const slot: 'player1' | 'player2' = i % 2 === 0 ? 'player1' : 'player2';
      currentRound[i].nextMatchId = nextRound[nextMatchIndex].id;
      currentRound[i].nextMatchSlot = slot;
    }
  }

  // Fill first round with participants from slots
  const firstRound = matchesByRound[0];
  for (let i = 0; i < firstRound.length; i++) {
    const slot1 = slots[i * 2];
    const slot2 = slots[i * 2 + 1];

    firstRound[i].player1Id = slot1;
    firstRound[i].player2Id = slot2;

    // Handle byes
    if (slot1 && !slot2) {
      firstRound[i].isBye = true;
      firstRound[i].winnerId = slot1;
      firstRound[i].status = 'completed';
      propagateWinner(matches, firstRound[i].id, slot1);
    } else if (!slot1 && slot2) {
      firstRound[i].isBye = true;
      firstRound[i].winnerId = slot2;
      firstRound[i].status = 'completed';
      propagateWinner(matches, firstRound[i].id, slot2);
    } else if (slot1 && slot2) {
      firstRound[i].status = 'ready';
    }
  }

  // Process any cascading byes (both players in next round could be bye winners)
  let changed = true;
  while (changed) {
    changed = false;
    for (const match of matches) {
      if (match.status !== 'pending') continue;
      if (match.player1Id && match.player2Id) {
        match.status = 'ready';
        changed = true;
      } else if (match.player1Id && !match.player2Id) {
        // Check if the feeder match for player2 is completed
        const feeder = matches.find(
          (m) => m.nextMatchId === match.id && m.nextMatchSlot === 'player2' && m.status === 'completed',
        );
        if (feeder) continue; // already propagated, still waiting
      }
    }
  }

  return matches;
}

/**
 * Advance a winner from a completed match to the next round.
 */
export function advanceWinner(
  matches: TournamentMatch[],
  matchId: string,
  winnerId: string,
): TournamentMatch[] {
  const match = matches.find((m) => m.id === matchId);
  if (!match) throw new Error(`Match ${matchId} not found`);
  if (match.winnerId) throw new Error(`Match ${matchId} already has a winner`);
  if (match.player1Id !== winnerId && match.player2Id !== winnerId) {
    throw new Error(`Player ${winnerId} is not in match ${matchId}`);
  }

  match.winnerId = winnerId;
  match.loserId = match.player1Id === winnerId ? match.player2Id : match.player1Id;
  match.status = 'completed';

  propagateWinner(matches, matchId, winnerId);

  return matches;
}

/**
 * Get all matches that are ready to be played.
 */
export function getReadyMatches(matches: TournamentMatch[]): TournamentMatch[] {
  return matches.filter((m) => m.status === 'ready');
}

/**
 * Get the final match (grand final).
 */
export function getFinalMatch(matches: TournamentMatch[]): TournamentMatch | undefined {
  const maxRound = Math.max(...matches.map((m) => m.round));
  return matches.find((m) => m.round === maxRound);
}

/**
 * Get bracket results: all matches organized by round.
 */
export function getBracketByRound(matches: TournamentMatch[]): Map<number, TournamentMatch[]> {
  const byRound = new Map<number, TournamentMatch[]>();
  for (const match of matches) {
    const round = byRound.get(match.round) || [];
    round.push(match);
    byRound.set(match.round, round);
  }
  return byRound;
}

// --- Internal helpers ---

/**
 * Propagate a winner to the next match in the bracket.
 */
function propagateWinner(
  matches: TournamentMatch[],
  matchId: string,
  winnerId: string,
): void {
  const match = matches.find((m) => m.id === matchId);
  if (!match || !match.nextMatchId || !match.nextMatchSlot) return;

  const nextMatch = matches.find((m) => m.id === match.nextMatchId);
  if (!nextMatch) return;

  if (match.nextMatchSlot === 'player1') {
    nextMatch.player1Id = winnerId;
  } else {
    nextMatch.player2Id = winnerId;
  }

  // If both players are now set, mark as ready
  if (nextMatch.player1Id && nextMatch.player2Id && nextMatch.status === 'pending') {
    nextMatch.status = 'ready';
  }
}

/**
 * Generate the standard seeding order for a bracket of given size.
 * Ensures 1 vs bracketSize, 2 vs bracketSize-1, etc. with proper distribution
 * so top seeds meet latest.
 *
 * For an 8-player bracket: [0, 7, 3, 4, 1, 6, 2, 5]
 * This means seed 1 is at slot 0, seed 2 at slot 7, etc.
 */
function generateSeedOrder(bracketSize: number): number[] {
  if (bracketSize === 1) return [0];
  if (bracketSize === 2) return [0, 1];

  // Start with [0, 1] and recursively expand
  let order = [0, 1];

  while (order.length < bracketSize) {
    const newOrder: number[] = [];
    const currentSize = order.length;
    const nextSize = currentSize * 2;

    for (const seed of order) {
      newOrder.push(seed);
      newOrder.push(nextSize - 1 - seed);
    }

    order = newOrder;
  }

  // Convert: order[i] = which slot seed (i+1) goes into
  // We need: result[seedIndex] = slotIndex
  const result = new Array(bracketSize);
  for (let i = 0; i < order.length; i++) {
    result[i] = order[i];
  }

  return result;
}
