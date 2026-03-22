import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const game = await prisma.game.findUnique({
      where: { id },
      include: {
        player1: {
          select: { id: true, username: true, elo: true },
        },
        player2: {
          select: { id: true, username: true, elo: true },
        },
      },
    });

    if (!game) {
      return NextResponse.json({ error: 'Game not found' }, { status: 404 });
    }

    return NextResponse.json(game);
  } catch (error) {
    console.error('Error fetching game:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
