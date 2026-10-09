import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  const token = req.cookies.get('rv_session')?.value;
  if (token) {
    await authService.logout(token);
  }

  const response = jsonResponse({ success: true, message: 'Logged out successfully' }, 200);
  response.cookies.delete('rv_session');
  return response;
}
