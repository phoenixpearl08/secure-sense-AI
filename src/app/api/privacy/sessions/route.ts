import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return jsonResponse({ success: false, error: 'Unauthorized: Authentication required to view active sessions' }, 401);
    }

    const sessions = await db.listActiveSessions(user.id);
    return jsonResponse({ success: true, data: sessions }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query active sessions';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return jsonResponse({ success: false, error: 'Unauthorized: Authentication required to revoke sessions' }, 401);
    }

    const body = await req.json();
    const { action } = body;

    if (action === 'REVOKE_ALL_SESSIONS') {
      const count = await db.revokeUserSessions(user.id);
      const response = jsonResponse({ success: true, message: `Revoked ${count} active session(s)` }, 200);
      response.cookies.delete('rv_session');
      return response;
    }

    return jsonResponse({ success: false, error: 'Unsupported session action' }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Session revocation failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
