import { NextRequest } from 'next/server';
import { transferService } from '@/services/transfers/transferService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { sessionToken, reason } = body;

    if (!sessionToken) {
      return jsonResponse({ success: false, error: 'Session token is required' }, 400);
    }

    const cancelled = transferService.cancelSession(sessionToken, reason || 'User cancelled');
    return jsonResponse({ success: cancelled, data: { status: 'CANCELLED_AND_PURGED' } }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Transfer cancellation failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
