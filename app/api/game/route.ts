import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { calculateElo, getLeagueTier } from '@/lib/elo/elo';
import { syncDiscordRole } from '@/lib/discord/roleSync';
import { sendRankUpWebhook } from '@/lib/discord/rankUpWebhook';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { player1Id, player2Id, isAiGame, aiDifficulty, gameState } = await req.json();

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
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { id, winnerId, player1Score, player2Score } = await req.json();

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

    // Calculate ELO only for non-AI games with two players
    if (!game.isAiGame && game.player1 && game.player2 && winnerId) {
      const p1Result = winnerId === game.player1Id ? 'win' : winnerId === game.player2Id ? 'loss' : 'draw';
      const p2Result = winnerId === game.player2Id ? 'win' : winnerId === game.player1Id ? 'loss' : 'draw';

      const oldP1Elo = game.player1.elo;
      const oldP2Elo = game.player2.elo;

      const p1Elo = calculateElo(game.player1.elo, game.player2.elo, p1Result as 'win' | 'loss' | 'draw');
      const p2Elo = calculateElo(game.player2.elo, game.player1.elo, p2Result as 'win' | 'loss' | 'draw');

      eloChange = Math.abs(p1Elo.change);

      // Update player 1 stats
      await prisma.user.update({
        where: { id: game.player1Id },
        data: {
          elo: p1Elo.newElo,
          wins: p1Result === 'win' ? { increment: 1 } : undefined,
          losses: p1Result === 'loss' ? { increment: 1 } : undefined,
          draws: p1Result === 'draw' ? { increment: 1 } : undefined,
        },
      });

      // Update player 2 stats
      await prisma.user.update({
        where: { id: game.player2Id! },
        data: {
          elo: p2Elo.newElo,
          wins: p2Result === 'win' ? { increment: 1 } : undefined,
          losses: p2Result === 'loss' ? { increment: 1 } : undefined,
          draws: p2Result === 'draw' ? { increment: 1 } : undefined,
        },
      });

      // Update games played and check placement
      const playerIds = [game.player1Id, game.player2Id!];
      const oldElos = [oldP1Elo, oldP2Elo];
      const newElos = [p1Elo.newElo, p2Elo.newElo];

      for (let idx = 0; idx < playerIds.length; idx++) {
        const pid = playerIds[idx];
        const updated = await prisma.user.update({
          where: { id: pid },
          data: {
            gamesPlayed: { increment: 1 },
          },
          select: { gamesPlayed: true, placementCompleted: true, discordId: true, elo: true, username: true }
        });

        if (updated.gamesPlayed >= 5 && !updated.placementCompleted) {
          await prisma.user.update({ where: { id: pid }, data: { placementCompleted: true } });
          updated.placementCompleted = true;
        }

        // Discord role sync if player has discord linked
        if (updated.discordId && updated.placementCompleted) {
          try {
            const oldTier = getLeagueTier(oldElos[idx]);
            const newTier = getLeagueTier(newElos[idx]);
            await syncDiscordRole(updated.discordId, updated.elo);
            if (oldTier.key !== newTier.key) {
              await sendRankUpWebhook(updated.discordId, updated.username, newTier, updated.elo, oldTier.key);
            }
          } catch (e) { console.error('Discord sync error:', e); }
        }
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
