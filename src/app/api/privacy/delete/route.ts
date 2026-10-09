import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    if (!user) {
      return jsonResponse({ success: false, error: 'Unauthorized: Authentication required to execute data deletion' }, 401);
    }

    const body = await req.json();
    const { confirmation } = body;

    if (confirmation !== 'DELETE_ALL_MY_DATA') {
      return jsonResponse(
        {
          success: false,
          error: 'Explicit confirmation required. Please submit { confirmation: "DELETE_ALL_MY_DATA" } to execute purge.',
        },
        400
      );
    }

    // Invalidate user session token first
    if (token) {
      await authService.logout(token);
    }

    const result = await db.deleteUserData(user.id);

    const response = jsonResponse(
      {
        success: true,
        message: 'All personal data, associated vault items, and documents permanently destroyed.',
        data: result,
      },
      200
    );
    response.cookies.delete('rv_session');
    return response;
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Privacy deletion failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
