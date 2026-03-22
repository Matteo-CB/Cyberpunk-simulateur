import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { auth } from '@/lib/auth/auth';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [users, games] = await Promise.all([
    prisma.user.count(),
    prisma.game.count(),
  ]);

  return NextResponse.json({ users, games });
}
