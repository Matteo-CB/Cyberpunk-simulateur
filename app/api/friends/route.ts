import { auth } from '@/lib/auth/auth';
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session as any).userId;

    const friendships = await prisma.friendship.findMany({
      where: {
        status: 'accepted',
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
      },
      include: {
        sender: {
          select: { id: true, username: true, elo: true, discordUsername: true },
        },
        receiver: {
          select: { id: true, username: true, elo: true, discordUsername: true },
        },
      },
    });

    const friends = friendships.map((f) => {
      const friend = f.senderId === userId ? f.receiver : f.sender;
      return {
        friendshipId: f.id,
        ...friend,
      };
    });

    return NextResponse.json(friends);
  } catch (error) {
    console.error('Error fetching friends:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
