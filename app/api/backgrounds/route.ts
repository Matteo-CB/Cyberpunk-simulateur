import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const backgrounds = await prisma.gameBackground.findMany({
      orderBy: { sortOrder: 'asc' },
    });

    return NextResponse.json(backgrounds);
  } catch (error) {
    console.error('Error fetching backgrounds:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
