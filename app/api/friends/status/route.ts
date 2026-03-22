import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session as any).userId;
    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get('userId');

    if (!targetUserId) {
      return NextResponse.json({ error: 'userId query parameter is required' }, { status: 400 });
    }

    if (targetUserId === userId) {
      return NextResponse.json({ status: 'self' });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      },
    });

    if (!friendship) {
      return NextResponse.json({ status: 'none' });
    }

    if (friendship.status === 'accepted') {
      return NextResponse.json({ status: 'accepted', friendshipId: friendship.id });
    }

    // Pending - indicate direction
    if (friendship.senderId === userId) {
      return NextResponse.json({ status: 'pending_sent', friendshipId: friendship.id });
    }

    return NextResponse.json({ status: 'pending_received', friendshipId: friendship.id });
  } catch (error) {
    console.error('Error checking friend status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
