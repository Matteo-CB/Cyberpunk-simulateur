import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateElo, getLeagueTier } from '@/lib/elo/elo';
import { syncDiscordRole } from '@/lib/discord/roleSync';
import { sendRankUpWebhook, sendRankDownWebhook, sendPlacementCompletedWebhook } from '@/lib/discord/rankUpWebhook';

/** Check if request is from internal server (Socket.IO) via shared API key */
function isInternalRequest(req: NextRequest): boolean {
  const key = req.headers.get('x-internal-key');
  return !!key && key === process.env.INTERNAL_API_KEY;
}

export async function POST(req: NextRequest) {
  try {
    // Read body FIRST before auth() to avoid "body already consumed" errors
    const body = await req.json();

    // Allow internal server calls (Socket.IO) or authenticated users
    if (!isInternalRequest(req)) {
      const session = await auth();
      if (!session || !(session as any).userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
    }

    const { player1Id, player2Id, isAiGame, aiDifficulty, gameState, isRanked } = body;

    if (!player1Id) {
      return NextResponse.json({ error: 'player1Id is required' }, { status: 400 });
    }

    if (!isAiGame && !player2Id) {
      return NextResponse.json({ error: 'player2Id is required for non-AI games' }, { status: 400 });
    }

    const game = await prisma.game.create({
      data: {
        player1Id,
        player2Id: player2Id || null,
        isAiGame: isAiGame || false,
        isRanked: isRanked || false,
        aiDifficulty: aiDifficulty || null,
        gameState: gameState || {},
        status: 'in_progress',
      },
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error) {
    console.error('Error creating game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    // Read body FIRST before auth() to avoid "body already consumed" errors
    const body = await req.json();

    // Allow internal server calls (Socket.IO) or authenticated users
    if (!isInternalRequest(req)) {
      const session = await auth();
      if (!session || !(session as any).userId) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
      }
    }

    const { id, winnerId, player1Score, player2Score } = body;

    if (!id) {
      return NextResponse.json({ error: 'Game id is required' }, { status: 400 });
    }

    const game = await prisma.game.findUnique({
      where: { id },
      include: { player1: true, player2: true },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    if (game.status === 'completed') {
      return NextResponse.json({ error: 'Game already completed' }, { status: 400 });
    }

    let eloChange: number | null = null;

    // Process stats for non-AI games with two players
    if (!game.isAiGame && game.player1 && game.player2 && winnerId) {
      const p1Result = winnerId === game.player1Id ? 'win' : winnerId === game.player2Id ? 'loss' : 'draw';
      const p2Result = winnerId === game.player2Id ? 'win' : winnerId === game.player1Id ? 'loss' : 'draw';

      const oldP1Elo = game.player1.elo;
      const oldP2Elo = game.player2.elo;

      // ELO calculation only for ranked games
      if (game.isRanked) {
        const p1Elo = calculateElo(game.player1.elo, game.player2.elo, p1Result as 'win' | 'loss' | 'draw');
        const p2Elo = calculateElo(game.player2.elo, game.player1.elo, p2Result as 'win' | 'loss' | 'draw');

        eloChange = Math.abs(p1Elo.change);

        // Update player 1 stats + ELO
        await prisma.user.update({
          where: { id: game.player1Id },
          data: {
            elo: p1Elo.newElo,
            wins: p1Result === 'win' ? { increment: 1 } : undefined,
            losses: p1Result === 'loss' ? { increment: 1 } : undefined,
            draws: p1Result === 'draw' ? { increment: 1 } : undefined,
          },
        });

        // Update player 2 stats + ELO
        await prisma.user.update({
          where: { id: game.player2Id! },
          data: {
            elo: p2Elo.newElo,
            wins: p2Result === 'win' ? { increment: 1 } : undefined,
            losses: p2Result === 'loss' ? { increment: 1 } : undefined,
            draws: p2Result === 'draw' ? { increment: 1 } : undefined,
          },
        });

        // Update games played, check placement, Discord sync
        const playerIds = [game.player1Id, game.player2Id!];
        const oldElos = [oldP1Elo, oldP2Elo];
        const newElos = [p1Elo.newElo, p2Elo.newElo];

        for (let idx = 0; idx < playerIds.length; idx++) {
          const pid = playerIds[idx];
          const updated = await prisma.user.update({
            where: { id: pid },
            data: { gamesPlayed: { increment: 1 } },
            select: { gamesPlayed: true, placementCompleted: true, discordId: true, elo: true, username: true },
          });

          // Check placement completion (5 ranked games)
          if (updated.gamesPlayed >= 5 && !updated.placementCompleted) {
            await prisma.user.update({ where: { id: pid }, data: { placementCompleted: true } });
            updated.placementCompleted = true;

            // Special placement completion notification
            const placedTier = getLeagueTier(newElos[idx]);
            try {
              if (updated.discordId) {
                await syncDiscordRole(updated.discordId, updated.elo, true);
              }
              await sendPlacementCompletedWebhook(
                updated.discordId || null,
                updated.username,
                placedTier,
                updated.elo
              );
            } catch (e) { console.error('Placement webhook error:', e); }
            continue; // Skip normal tier change check — placement notification is sufficient
          }

          // Discord notifications and role sync (only for placed players)
          if (updated.placementCompleted) {
            try {
              const oldTier = getLeagueTier(oldElos[idx]);
              const newTier = getLeagueTier(newElos[idx]);
              // Sync Discord role if linked
              if (updated.discordId) {
                await syncDiscordRole(updated.discordId, updated.elo, updated.placementCompleted);
              }
              // Send webhook notification for tier changes
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
        // Casual game: only increment wins/losses, no ELO change
        await prisma.user.update({
          where: { id: game.player1Id },
          data: {
            wins: p1Result === 'win' ? { increment: 1 } : undefined,
            losses: p1Result === 'loss' ? { increment: 1 } : undefined,
            draws: p1Result === 'draw' ? { increment: 1 } : undefined,
          },
        });
        await prisma.user.update({
          where: { id: game.player2Id! },
          data: {
            wins: p2Result === 'win' ? { increment: 1 } : undefined,
            losses: p2Result === 'loss' ? { increment: 1 } : undefined,
            draws: p2Result === 'draw' ? { increment: 1 } : undefined,
          },
        });
      }
    }

    const updatedGame = await prisma.game.update({
      where: { id },
      data: {
        status: 'completed',
        winnerId: winnerId || null,
        player1Score: player1Score ?? 0,
        player2Score: player2Score ?? 0,
        eloChange,
        completedAt: new Date(),
      },
    });

    return NextResponse.json(updatedGame);
  } catch (error) {
    console.error('Error completing game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
