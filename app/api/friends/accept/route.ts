import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session as any).userId;
    const { friendshipId } = await req.json();

    if (!friendshipId) {
      return NextResponse.json({ error: 'friendshipId is required' }, { status: 400 });
    }

    const friendship = await prisma.friendship.findUnique({
      where: { id: friendshipId },
    });

    if (!friendship) {
      return NextResponse.json({ error: 'Friend request not found' }, { status: 404 });
    }

    if (friendship.receiverId !== userId) {
      return NextResponse.json({ error: 'Not authorized to accept this request' }, { status: 403 });
    }

    if (friendship.status !== 'pending') {
      return NextResponse.json({ error: 'Request is no longer pending' }, { status: 400 });
    }

    const updated = await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: 'accepted' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Error accepting friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
