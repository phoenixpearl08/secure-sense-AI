import { NextRequest } from 'next/server';
import { transferService } from '@/services/transfers/transferService';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('rv_session')?.value;
  const user = await authService.getCurrentUser(token);
  const userId = user ? user.id : 'all';

  const sessions = transferService.listSessionsForUser(userId);
  return jsonResponse({ success: true, data: sessions }, 200);
}
