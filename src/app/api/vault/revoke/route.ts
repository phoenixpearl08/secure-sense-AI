import { NextRequest } from 'next/server';
import { vaultService } from '@/services/vault/vaultService';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const { itemId, actionType } = body;

    if (!itemId) {
      return jsonResponse({ success: false, error: 'Item ID is required' }, 400);
    }

    const userId = user ? user.id : 'demo-anonymous-user';
    const updated = await vaultService.revokeItem(itemId, userId, actionType || 'REVOKE');

    return jsonResponse({ success: true, data: updated }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Revocation failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
