import { auth } from '@/lib/auth/auth';
import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

const VALID_BACKGROUNDS = [
  'default',
  'night-city',
  'afterlife',
  'netspace',
  'corpo-plaza',
  'badlands',
];

interface PreferencesBody {
  animationsEnabled?: boolean;
  gameBackground?: string;
}

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    if (!session || !(session as any).userId) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }

    const userId = (session as any).userId as string;
    const body: PreferencesBody = await req.json();

    // Build update data, only including fields that were actually sent
    const updateData: Record<string, unknown> = {};

    if (typeof body.animationsEnabled === 'boolean') {
      updateData.animationsEnabled = body.animationsEnabled;
    }

    if (typeof body.gameBackground === 'string') {
      const bg = body.gameBackground.trim();
      // Validate against known backgrounds or allow custom ones stored in DB
      if (bg.length === 0 || bg.length > 100) {
        return NextResponse.json(
          { error: 'Invalid background value' },
          { status: 400 }
        );
      }

      // If not a built-in background, check if it exists in GameBackground table
      if (!VALID_BACKGROUNDS.includes(bg)) {
        const customBg = await prisma.gameBackground.findUnique({
          where: { name: bg },
        });
        if (!customBg) {
          return NextResponse.json(
            { error: 'Unknown background' },
            { status: 400 }
          );
        }
      }

      updateData.gameBackground = bg;
    }

    // Nothing to update
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'No valid fields to update' },
        { status: 400 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        animationsEnabled: true,
        gameBackground: true,
      },
    });

    return NextResponse.json({
      success: true,
      preferences: updatedUser,
    });
  } catch (error) {
    console.error('[preferences] Error updating preferences:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
