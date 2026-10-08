import { NextRequest } from 'next/server';
import { transferService } from '@/services/transfers/transferService';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get('token') || searchParams.get('sessionId');

  if (!token) {
    return jsonResponse({ success: false, error: 'Session token or sessionId is required' }, 400);
  }

  const session = transferService.getSession(token);
  if (!session) {
    return jsonResponse({ success: false, error: 'Transfer session not found or expired' }, 404);
  }

  return jsonResponse({ success: true, data: session }, 200);
}
