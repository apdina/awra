import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag, revalidatePath } from 'next/cache';
import { logger } from "@/lib/logger";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, path, tag } = body;

    // Verify the secret to prevent unauthorized revalidation
    if (secret !== process.env.REVALIDATION_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    if (tag) {
      // Revalidate by tag (Next.js 16 requires second parameter)
      revalidateTag(tag, 'max');
      logger.log(`✅ Revalidated tag: ${tag}`);
    }

    if (path) {
      // Revalidate by path
      revalidatePath(path);
      logger.log(`✅ Revalidated path: ${path}`);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cache revalidated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Revalidation error:', error);
    return NextResponse.json(
      { error: 'Failed to revalidate' },
      { status: 500 }
    );
  }
}
