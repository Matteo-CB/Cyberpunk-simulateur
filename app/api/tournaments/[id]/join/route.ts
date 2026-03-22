import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session as any).userId;
    const username = (session as any).username;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { participants: true } },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'pending') {
      return NextResponse.json({ error: 'Tournament is not open for registration' }, { status: 400 });
    }

    if (tournament._count.participants >= tournament.maxPlayers) {
      return NextResponse.json({ error: 'Tournament is full' }, { status: 400 });
    }

    // Check if user already joined
    const existing = await prisma.tournamentParticipant.findFirst({
      where: { tournamentId: id, userId },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already joined this tournament' }, { status: 400 });
    }

    // Check Discord requirement
    if (tournament.requiresDiscord) {
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user?.discordId) {
        return NextResponse.json({ error: 'Discord account required to join this tournament' }, { status: 400 });
      }
    }

    const participant = await prisma.tournamentParticipant.create({
      data: {
        tournamentId: id,
        userId,
        username,
        seed: tournament._count.participants + 1,
      },
    });

    return NextResponse.json(participant, { status: 201 });
  } catch (error) {
    console.error('Error joining tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
