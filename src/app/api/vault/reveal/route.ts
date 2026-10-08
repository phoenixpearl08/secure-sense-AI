import { NextRequest } from 'next/server';
import { vaultService } from '@/services/vault/vaultService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessId, recipientEmail, otp, deviceId } = body;

    if (!accessId) {
      return jsonResponse({ success: false, error: 'Access identifier is required' }, 400);
    }

    const ipAddress = req.headers.get('x-forwarded-for') || '127.0.0.1';

    const result = await vaultService.revealSecret({
      accessId,
      recipientEmail,
      otp,
      deviceId,
      ipAddress,
    });

    if (!result.success) {
      const statusCode = result.status === 'CONSUMED' ? 410 : 403;
      return jsonResponse(
        {
          success: false,
          error: result.error,
          status: result.status,
        },
        statusCode
      );
    }

    return jsonResponse(
      {
        success: true,
        data: {
          secret: result.secret,
          status: result.status,
        },
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reveal operation failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
