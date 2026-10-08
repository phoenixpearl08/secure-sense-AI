import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, deviceId, deviceName } = body;

    if (!email || !password) {
      return jsonResponse({ success: false, error: 'Email and password are required' }, 400);
    }

    const { user, sessionToken } = await authService.login({
      email,
      password,
      deviceId,
      deviceName,
    });

    const response = jsonResponse({ success: true, data: { user } }, 200);
    response.cookies.set('rv_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Invalid credentials';
    return jsonResponse({ success: false, error: msg }, 401);
  }
}
