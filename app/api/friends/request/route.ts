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
    const { receiverId } = await req.json();

    if (!receiverId) {
      return NextResponse.json({ error: 'receiverId is required' }, { status: 400 });
    }

    if (receiverId === userId) {
      return NextResponse.json({ error: 'Cannot send friend request to yourself' }, { status: 400 });
    }

    const receiver = await prisma.user.findUnique({ where: { id: receiverId } });
    if (!receiver) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if friendship already exists in either direction
    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId },
          { senderId: receiverId, receiverId: userId },
        ],
      },
    });

    if (existing) {
      if (existing.status === 'accepted') {
        return NextResponse.json({ error: 'Already friends' }, { status: 400 });
      }
      return NextResponse.json({ error: 'Friend request already pending' }, { status: 400 });
    }

    const friendship = await prisma.friendship.create({
      data: {
        senderId: userId,
        receiverId,
        status: 'pending',
      },
    });

    return NextResponse.json(friendship, { status: 201 });
  } catch (error) {
    console.error('Error sending friend request:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
