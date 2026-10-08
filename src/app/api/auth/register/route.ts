import { NextRequest } from 'next/server';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, name, password, role } = body;

    if (!email || !name || !password) {
      return jsonResponse({ success: false, error: 'Email, name, and password are required' }, 400);
    }

    const { user, sessionToken } = await authService.register({
      email,
      name,
      password,
      role,
    });

    const response = jsonResponse({ success: true, data: { user } }, 201);
    // Set HTTP-only secure cookie
    response.cookies.set('rv_session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Registration failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
