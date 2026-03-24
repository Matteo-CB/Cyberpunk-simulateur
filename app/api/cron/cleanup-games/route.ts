import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const ONE_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  // Verify internal API key
  const key = req.headers.get('x-internal-key');
  if (!key || key !== process.env.INTERNAL_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const oneMonthAgo = new Date(Date.now() - ONE_MONTH_MS);

    const result = await prisma.game.deleteMany({
      where: {
        createdAt: { lt: oneMonthAgo },
      },
    });

    console.log(`[cleanup] Deleted ${result.count} games older than 1 month`);
    return NextResponse.json({ deleted: result.count });
  } catch (error) {
    console.error('[cleanup] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
