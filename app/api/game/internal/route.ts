import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateElo, getLeagueTier } from '@/lib/elo/elo';
import { syncDiscordRole } from '@/lib/discord/roleSync';
import { sendRankUpWebhook, sendRankDownWebhook, sendPlacementCompletedWebhook } from '@/lib/discord/rankUpWebhook';

/** Internal-only route for the Socket.IO server to save games. No session auth — uses API key. */

function verifyKey(req: NextRequest): boolean {
  const key = req.headers.get('x-internal-key');
  return !!key && !!process.env.INTERNAL_API_KEY && key === process.env.INTERNAL_API_KEY;
}

/** POST /api/game/internal — Create + complete a game in one call */
export async function POST(req: NextRequest) {
  try {
    if (!verifyKey(req)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const {
      player1Id, player2Id, isRanked,
      winnerId, player1Score, player2Score,
      winReason, turn,
    } = await req.json();

    if (!player1Id || !player2Id) {
      return NextResponse.json({ error: 'player1Id and player2Id required' }, { status: 400 });
    }

    console.log(`[game/internal] Creating game: p1=${player1Id}, p2=${player2Id}, ranked=${isRanked}, winner=${winnerId}`);

    // Create the game record
    const game = await prisma.game.create({
      data: {
        player1Id,
        player2Id,
        isAiGame: false,
        isRanked: isRanked || false,
        gameState: { turn, winReason, winnerId },
        status: 'in_progress',
      },
    });

    // Now complete it
    const fullGame = await prisma.game.findUnique({
      where: { id: game.id },
      include: { player1: true, player2: true },
    });

    if (!fullGame || !fullGame.player1 || !fullGame.player2) {
      return NextResponse.json({ error: 'Game or players not found' }, { status: 500 });
    }

    let eloChange: number | null = null;

    if (winnerId) {
      const p1Result = winnerId === player1Id ? 'win' : winnerId === player2Id ? 'loss' : 'draw';
      const p2Result = winnerId === player2Id ? 'win' : winnerId === player1Id ? 'loss' : 'draw';

      const oldP1Elo = fullGame.player1.elo;
      const oldP2Elo = fullGame.player2.elo;

      if (isRanked) {
        // Calculate ELO
        const p1Elo = calculateElo(fullGame.player1.elo, fullGame.player2.elo, p1Result as 'win' | 'loss' | 'draw');
        const p2Elo = calculateElo(fullGame.player2.elo, fullGame.player1.elo, p2Result as 'win' | 'loss' | 'draw');
        eloChange = Math.abs(p1Elo.change);

        console.log(`[game/internal] ELO: ${fullGame.player1.username} ${oldP1Elo}->${p1Elo.newElo} (${p1Elo.change}), ${fullGame.player2.username} ${oldP2Elo}->${p2Elo.newElo} (${p2Elo.change})`);

        // Update player 1
        await prisma.user.update({
          where: { id: player1Id },
          data: {
            elo: p1Elo.newElo,
            wins: p1Result === 'win' ? { increment: 1 } : undefined,
            losses: p1Result === 'loss' ? { increment: 1 } : undefined,
            draws: p1Result === 'draw' ? { increment: 1 } : undefined,
          },
        });

        // Update player 2
        await prisma.user.update({
          where: { id: player2Id },
          data: {
            elo: p2Elo.newElo,
            wins: p2Result === 'win' ? { increment: 1 } : undefined,
            losses: p2Result === 'loss' ? { increment: 1 } : undefined,
            draws: p2Result === 'draw' ? { increment: 1 } : undefined,
          },
        });

        // Games played + placement + Discord
        const playerIds = [player1Id, player2Id];
        const oldElos = [oldP1Elo, oldP2Elo];
        const newElos = [p1Elo.newElo, p2Elo.newElo];

        for (let idx = 0; idx < playerIds.length; idx++) {
          const pid = playerIds[idx];
          const updated = await prisma.user.update({
            where: { id: pid },
            data: { gamesPlayed: { increment: 1 } },
            select: { gamesPlayed: true, placementCompleted: true, discordId: true, elo: true, username: true },
          });

          // Placement completion
          if (updated.gamesPlayed >= 5 && !updated.placementCompleted) {
            await prisma.user.update({ where: { id: pid }, data: { placementCompleted: true } });
            updated.placementCompleted = true;

            const placedTier = getLeagueTier(newElos[idx]);
            console.log(`[game/internal] ${updated.username} completed placement -> ${placedTier.name}`);
            try {
              if (updated.discordId) await syncDiscordRole(updated.discordId, updated.elo, true);
              await sendPlacementCompletedWebhook(updated.discordId || null, updated.username, placedTier, updated.elo);
            } catch (e) { console.error('Placement webhook error:', e); }
            continue;
          }

          // Role sync + tier change notifications
          if (updated.placementCompleted) {
            try {
              const oldTier = getLeagueTier(oldElos[idx]);
              const newTier = getLeagueTier(newElos[idx]);
              if (updated.discordId) await syncDiscordRole(updated.discordId, updated.elo, updated.placementCompleted);
              if (oldTier.key !== newTier.key) {
                if (newElos[idx] > oldElos[idx]) {
                  await sendRankUpWebhook(updated.discordId || null, updated.username, newTier, updated.elo, oldTier.key);
                } else {
                  await sendRankDownWebhook(updated.discordId || null, updated.username, newTier, updated.elo, oldTier.key);
                }
              }
            } catch (e) { console.error('Discord sync error:', e); }
          }
        }
      } else {
        // Casual: just increment wins/losses
        await prisma.user.update({
          where: { id: player1Id },
          data: {
            wins: p1Result === 'win' ? { increment: 1 } : undefined,
            losses: p1Result === 'loss' ? { increment: 1 } : undefined,
            draws: p1Result === 'draw' ? { increment: 1 } : undefined,
          },
        });
        await prisma.user.update({
          where: { id: player2Id },
          data: {
            wins: p2Result === 'win' ? { increment: 1 } : undefined,
            losses: p2Result === 'loss' ? { increment: 1 } : undefined,
            draws: p2Result === 'draw' ? { increment: 1 } : undefined,
          },
        });
      }
    }

    // Mark game complete
    const updatedGame = await prisma.game.update({
      where: { id: game.id },
      data: {
        status: 'completed',
        winnerId: winnerId || null,
        player1Score: player1Score ?? 0,
        player2Score: player2Score ?? 0,
        eloChange,
        completedAt: new Date(),
      },
    });

    console.log(`[game/internal] Game saved: id=${game.id}, eloChange=${eloChange}`);
    return NextResponse.json({ id: updatedGame.id, eloChange, status: 'completed' });
  } catch (error) {
    console.error('[game/internal] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
