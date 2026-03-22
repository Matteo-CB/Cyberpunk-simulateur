import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');

    const where: Record<string, unknown> = {};
    if (status) {
      where.status = status;
    }

    const tournaments = await prisma.tournament.findMany({
      where,
      include: {
        participants: {
          select: { id: true, userId: true, username: true, eliminated: true },
        },
        _count: {
          select: { participants: true },
        },
      },
      orderBy: { id: 'desc' },
    });

    return NextResponse.json(tournaments);
  } catch (error) {
    console.error('Error fetching tournaments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, type, gameMode, maxPlayers, isPublic, joinCode, requiresDiscord, useBanList, bannedCardIds, allowedLeagues, discordRoleReward, discordRoleBadge } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Tournament name is required' }, { status: 400 });
    }

    if (!type) {
      return NextResponse.json({ error: 'Tournament type is required' }, { status: 400 });
    }

    // Calculate total rounds based on max players
    const mp = maxPlayers || 8;
    const totalRounds = Math.ceil(Math.log2(mp));

    const tournament = await prisma.tournament.create({
      data: {
        name: name.trim(),
        type,
        gameMode: gameMode || 'standard',
        maxPlayers: mp,
        totalRounds,
        isPublic: isPublic !== undefined ? isPublic : true,
        joinCode: joinCode || null,
        creatorId: (session as any).userId,
        requiresDiscord: requiresDiscord || false,
        useBanList: useBanList || false,
        bannedCardIds: bannedCardIds || [],
        allowedLeagues: allowedLeagues || [],
        discordRoleReward: discordRoleReward || null,
        discordRoleBadge: discordRoleBadge || null,
      },
    });

    // Auto-join creator as first participant
    await prisma.tournamentParticipant.create({
      data: {
        tournamentId: tournament.id,
        userId: (session as any).userId,
        username: (session as any).username,
        seed: 1,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error) {
    console.error('Error creating tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
