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
    const { difficulty, score, correct, total, accuracy, bestStreak } = await req.json();

    if (difficulty === undefined || score === undefined || correct === undefined || total === undefined || accuracy === undefined) {
      return NextResponse.json({ error: 'Missing required fields: difficulty, score, correct, total, accuracy' }, { status: 400 });
    }

    if (typeof difficulty !== 'number' || typeof score !== 'number' || typeof correct !== 'number' || typeof total !== 'number' || typeof accuracy !== 'number') {
      return NextResponse.json({ error: 'Fields must be numbers' }, { status: 400 });
    }

    const quizScore = await prisma.quizScore.create({
      data: {
        userId,
        difficulty,
        score,
        correct,
        total,
        accuracy,
        bestStreak: bestStreak || 0,
      },
    });

    return NextResponse.json(quizScore, { status: 201 });
  } catch (error) {
    console.error('Error submitting quiz score:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
