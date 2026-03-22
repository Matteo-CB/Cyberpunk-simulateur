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

    const tournament = await prisma.tournament.findUnique({ where: { id } });
    if (!tournament) {
      return NextResponse.json({ error: 'Tournament not found' }, { status: 404 });
    }

    if (tournament.status !== 'pending') {
      return NextResponse.json({ error: 'Cannot leave a tournament that has already started' }, { status: 400 });
    }

    const participant = await prisma.tournamentParticipant.findFirst({
      where: { tournamentId: id, userId },
    });

    if (!participant) {
      return NextResponse.json({ error: 'Not a participant in this tournament' }, { status: 400 });
    }

    await prisma.tournamentParticipant.delete({
      where: { id: participant.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error leaving tournament:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
