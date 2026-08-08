import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { ImportService } from '@/src/lib/services/importService';
import { logger } from '@/src/lib/logger';

export async function POST(req) {
  try {
    const session = await getServerSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();

    if (!body || !body.metadata) {
      return NextResponse.json({ error: 'Invalid import payload' }, { status: 400 });
    }

    const result = await ImportService.processUserImport(session.user.id, body);
    
    return NextResponse.json(result);
  } catch (error) {
    logger.error({ error: error.message }, 'Import API failed');
    return NextResponse.json({ error: 'Failed to process import' }, { status: 500 });
  }
}
