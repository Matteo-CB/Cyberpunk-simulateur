import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';

import { ADMIN_USERNAMES } from '@/lib/auth/authOptions';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        participants: {
          orderBy: { seed: 'asc' },
        },
        matches: {
          orderBy: [{ round: 'asc' }, { matchIndex: 'asc' }],
        },
      },
    });

    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error('Error fetching tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    const username = (session as any).username;
    const isAdmin = ADMIN_USERNAMES.includes(username);
    const isCreator = tournament.creatorId === (session as any).userId;

    if (!isAdmin && !isCreator) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    // Delete all related data first
    await prisma.tournamentMatch.deleteMany({ where: { tournamentId: id } });
    await prisma.tournamentParticipant.deleteMany({ where: { tournamentId: id } });
    await prisma.tournament.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
