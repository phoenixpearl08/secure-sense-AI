import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return jsonResponse({ success: false, error: 'Unauthorized: Authentication required to export personal data' }, 401);
    }

    const data = await db.exportUserData(user.id);
    if (!data) {
      return jsonResponse({ success: false, error: 'User record not found' }, 404);
    }

    return jsonResponse({ success: true, data }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Privacy export failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
