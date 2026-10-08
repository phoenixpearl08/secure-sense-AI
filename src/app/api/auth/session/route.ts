import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const token = req.cookies.get('rv_session')?.value;
  if (!token) {
    return jsonResponse({ success: false, data: { user: null } }, 200);
  }

  const user = await authService.getCurrentUser(token);
  return jsonResponse({ success: true, data: { user } }, 200);
}
