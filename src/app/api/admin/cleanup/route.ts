import { NextRequest } from 'next/server';
import { runLifecycleSweeper } from '@/services/vault/lifecycleService';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);
    const forwardedFor = req.headers.get('x-forwarded-for');
    const isRemote = Boolean(forwardedFor && !forwardedFor.startsWith('127.0.0.1') && !forwardedFor.startsWith('::1'));

    if (isRemote && !user) {
      return jsonResponse({ success: false, error: 'Unauthorized: Administrative authentication required' }, 401);
    }

    const report = await runLifecycleSweeper();
    return jsonResponse({ success: true, data: report }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lifecycle sweeper failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
