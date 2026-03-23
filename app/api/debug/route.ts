import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET() {
  try {
    const userCount = await prisma.user.count();
    const firstUser = await prisma.user.findFirst({
      select: { username: true, email: true },
    });
    return NextResponse.json({
      status: 'ok',
      dbConnected: true,
      userCount,
      firstUser: firstUser ? { username: firstUser.username, email: firstUser.email } : null,
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
        nextauthUrl: process.env.NEXTAUTH_URL,
        hasSecret: !!process.env.NEXTAUTH_SECRET,
        nodeEnv: process.env.NODE_ENV,
        port: process.env.PORT,
      },
    });
  } catch (error) {
    return NextResponse.json({
      status: 'error',
      dbConnected: false,
      error: String(error),
      env: {
        hasDbUrl: !!process.env.DATABASE_URL,
        dbUrlPrefix: process.env.DATABASE_URL?.substring(0, 30) + '...',
        nextauthUrl: process.env.NEXTAUTH_URL,
        nodeEnv: process.env.NODE_ENV,
      },
    });
  }
}
