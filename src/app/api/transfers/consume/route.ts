import { NextRequest } from 'next/server';
import { transferService } from '@/services/transfers/transferService';
import { jsonResponse, checkRateLimit } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const sessionToken = body.sessionToken || body.sessionId;
    const otp = body.otp;
    const receiverEmail = body.receiverEmail || body.recipientEmail;

    if (!sessionToken || !otp) {
      return jsonResponse({ success: false, error: 'Session token and OTP are required' }, 400);
    }

    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    if (!checkRateLimit(`consume:${sessionToken}:${ip}`, 60, 60)) {
      return jsonResponse({ success: false, error: 'Too many consumption attempts. Please wait 1 minute.' }, 429);
    }

    const result = await transferService.consumeTransfer({
      sessionToken,
      otp,
      receiverEmail,
    });

    if (!result.success) {
      return jsonResponse({ success: false, error: result.error }, 403);
    }

    return jsonResponse(
      {
        success: true,
        data: {
          payload: result.payload,
          decryptedPayload: result.payload,
          fileHash: result.fileHash,
          status: 'COMPLETED_AND_PURGED',
        },
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Transfer consumption failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
