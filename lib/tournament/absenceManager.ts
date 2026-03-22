import type { TournamentMatch } from './tournamentEngine';

/**
 * Track player absence in tournament matches.
 * When a player fails to show up within a deadline, they forfeit the match.
 */

export interface AbsenceRecord {
  matchId: string;
  deadline: Date;
  player1CheckedIn: boolean;
  player2CheckedIn: boolean;
}

/** In-memory absence tracking store. */
const absenceRecords = new Map<string, AbsenceRecord>();

/**
 * Set an absence deadline for a match.
 * Players must check in before the deadline or forfeit.
 *
 * @param matchId - The match to set a deadline for.
 * @param minutes - Number of minutes from now until the deadline.
 * @returns The deadline Date.
 */
export function setAbsenceDeadline(matchId: string, minutes: number): Date {
  const deadline = new Date(Date.now() + minutes * 60 * 1000);
  absenceRecords.set(matchId, {
    matchId,
    deadline,
    player1CheckedIn: false,
    player2CheckedIn: false,
  });
  return deadline;
}

/**
 * Mark a player as checked in for a match.
 */
export function checkIn(matchId: string, playerId: string, match: TournamentMatch): void {
  const record = absenceRecords.get(matchId);
  if (!record) return;

  if (match.player1Id === playerId) {
    record.player1CheckedIn = true;
  } else if (match.player2Id === playerId) {
    record.player2CheckedIn = true;
  }
}

/**
 * Check if any player is absent (deadline passed without check-in).
 *
 * @returns Object indicating if someone is absent and which player.
 */
export function checkAbsence(match: TournamentMatch): {
  isAbsent: boolean;
  absentPlayerId: string | null;
} {
  const record = absenceRecords.get(match.id);

  // No deadline set -- nobody is absent
  if (!record) {
    return { isAbsent: false, absentPlayerId: null };
  }

  const now = new Date();

  // Deadline hasn't passed yet
  if (now < record.deadline) {
    return { isAbsent: false, absentPlayerId: null };
  }

  // Deadline passed -- check who hasn't shown up
  if (!record.player1CheckedIn && record.player2CheckedIn) {
    return { isAbsent: true, absentPlayerId: match.player1Id };
  }
  if (record.player1CheckedIn && !record.player2CheckedIn) {
    return { isAbsent: true, absentPlayerId: match.player2Id };
  }
  if (!record.player1CheckedIn && !record.player2CheckedIn) {
    // Both absent -- player1 gets the loss (arbitrary tiebreak)
    return { isAbsent: true, absentPlayerId: match.player1Id };
  }

  // Both checked in -- no absence
  return { isAbsent: false, absentPlayerId: null };
}

/**
 * Auto-forfeit a match due to player absence.
 * Marks the absent player as the loser and their opponent as the winner.
 *
 * @returns The updated match with winner/loser set, or null if no absence detected.
 */
export function autoForfeit(match: TournamentMatch): TournamentMatch | null {
  const { isAbsent, absentPlayerId } = checkAbsence(match);

  if (!isAbsent || !absentPlayerId) return null;

  const winnerId =
    match.player1Id === absentPlayerId ? match.player2Id : match.player1Id;

  if (!winnerId) return null;

  match.winnerId = winnerId;
  match.loserId = absentPlayerId;
  match.status = 'completed';

  // Clean up the record
  absenceRecords.delete(match.id);

  return match;
}

/**
 * Get the absence record for a match (if any).
 */
export function getAbsenceRecord(matchId: string): AbsenceRecord | undefined {
  return absenceRecords.get(matchId);
}

/**
 * Get the remaining time in milliseconds before the deadline.
 * Returns 0 if the deadline has passed or no record exists.
 */
export function getRemainingTime(matchId: string): number {
  const record = absenceRecords.get(matchId);
  if (!record) return 0;
  const remaining = record.deadline.getTime() - Date.now();
  return Math.max(0, remaining);
}

/**
 * Clear the absence record for a match (e.g., when the match starts).
 */
export function clearAbsenceRecord(matchId: string): void {
  absenceRecords.delete(matchId);
}
