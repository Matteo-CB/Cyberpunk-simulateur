import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const decks = await prisma.deck.findMany({
      where: { userId: (session as any).userId },
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(decks);
  } catch (error) {
    console.error('Error fetching decks:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const { name, cardIds, legendIds } = await req.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Deck name is required' }, { status: 400 });
    }

    if (!Array.isArray(cardIds)) {
      return NextResponse.json({ error: 'cardIds must be an array' }, { status: 400 });
    }

    if (!Array.isArray(legendIds)) {
      return NextResponse.json({ error: 'legendIds must be an array' }, { status: 400 });
    }

    if (legendIds.length > 3) {
      return NextResponse.json({ error: 'Maximum 3 legends allowed' }, { status: 400 });
    }

    if (cardIds.length < 40 || cardIds.length > 50) {
      return NextResponse.json({ error: 'Deck must have 40-50 cards (excluding legends)' }, { status: 400 });
    }

    const existingDecks = await prisma.deck.count({
      where: { userId: (session as any).userId },
    });

    const deck = await prisma.deck.create({
      data: {
        userId: (session as any).userId,
        name: name.trim(),
        cardIds,
        legendIds,
        sortOrder: existingDecks,
      },
    });

    return NextResponse.json(deck, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
