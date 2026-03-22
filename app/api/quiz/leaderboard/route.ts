import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100);
    const difficulty = searchParams.get('difficulty');

    const where: Record<string, unknown> = {};
    if (difficulty) {
      where.difficulty = parseInt(difficulty, 10);
    }

    const scores = await prisma.quizScore.findMany({
      where,
      include: {
        user: {
          select: { username: true },
        },
      },
      orderBy: { score: 'desc' },
      take: limit,
    });

    const leaderboard = scores.map((s) => ({
      id: s.id,
      username: s.user.username,
      score: s.score,
      correct: s.correct,
      total: s.total,
      accuracy: s.accuracy,
      bestStreak: s.bestStreak,
      difficulty: s.difficulty,
      completedAt: s.completedAt,
    }));

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error('Error fetching quiz leaderboard:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
