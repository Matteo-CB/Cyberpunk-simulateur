import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const deck = await prisma.deck.findUnique({
      where: { id },
    });

    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }

    if (deck.userId !== (session as any).userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    return NextResponse.json(deck);
  } catch (error) {
    console.error('Error fetching deck:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    if (deck.userId !== (session as any).userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    const { name, cardIds, legendIds } = await req.json();

    const updateData: Record<string, unknown> = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json({ error: 'Invalid deck name' }, { status: 400 });
      }
      updateData.name = name.trim();
    }

    if (cardIds !== undefined) {
      if (!Array.isArray(cardIds)) {
        return NextResponse.json({ error: 'cardIds must be an array' }, { status: 400 });
      }
      if (cardIds.length < 40 || cardIds.length > 50) {
        return NextResponse.json({ error: 'Deck must have 40-50 cards (excluding legends)' }, { status: 400 });
      }
      updateData.cardIds = cardIds;
    }

    if (legendIds !== undefined) {
      if (!Array.isArray(legendIds)) {
        return NextResponse.json({ error: 'legendIds must be an array' }, { status: 400 });
      }
      if (legendIds.length > 3) {
        return NextResponse.json({ error: 'Maximum 3 legends allowed' }, { status: 400 });
      }
      updateData.legendIds = legendIds;
    }

    const updated = await prisma.deck.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error updating deck:', error);
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

    const deck = await prisma.deck.findUnique({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: 'Deck not found' }, { status: 404 });
    }
    if (deck.userId !== (session as any).userId) {
      return NextResponse.json({ error: 'Not authorized' }, { status: 403 });
    }

    await prisma.deck.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting deck:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
