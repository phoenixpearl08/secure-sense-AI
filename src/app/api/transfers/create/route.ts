import { NextRequest } from 'next/server';
import { transferService } from '@/services/transfers/transferService';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';
import { validateFileBuffer } from '@/lib/files/fileSecurity';
import { generateQrCodeDataUrl } from '@/lib/crypto/qr';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const fileName = body.fileName || 'ephemeral_payload.txt';
    const payloadData = body.payloadData || body.payload;
    const mimeType = body.mimeType || 'text/plain';
    const receiverEmail = body.receiverEmail || body.recipientEmail;
    const zeroPersistence = body.zeroPersistence ?? true;
    const expiresInMinutes = body.expiresInMinutes || 10;
    const otpCode = body.otpCode;

    if (!payloadData) {
      return jsonResponse({ success: false, error: 'Payload data is required' }, 400);
    }

    const buffer = Buffer.from(payloadData, 'utf-8');
    const validation = validateFileBuffer(buffer, fileName, mimeType || 'text/plain');

    if (!validation.valid) {
      return jsonResponse({ success: false, error: validation.error || 'Invalid file payload' }, 400);
    }

    const senderId = user ? user.id : 'demo-sender';
    const senderName = user ? user.name : 'Authorized Sender';

    const { session, rawOtp } = await transferService.createSession({
      fileName: validation.sanitizedFileName,
      fileSize: validation.fileSize,
      mimeType: validation.detectedMimeType,
      fileHash: validation.sha256Hash,
      senderId,
      senderName,
      receiverEmail,
      otpCode,
      zeroPersistence: zeroPersistence ?? true,
      expiresInMinutes: expiresInMinutes || 10,
      payloadData,
    });

    const accessUrl = `/transfers/receive?token=${session.sessionToken}`;
    let qrCode: string | undefined;
    try {
      qrCode = await generateQrCodeDataUrl(`http://localhost:3000${accessUrl}`);
    } catch {
      // Non-fatal
    }

    return jsonResponse(
      {
        success: true,
        data: {
          sessionToken: session.sessionToken,
          sessionId: session.id,
          fileName: session.fileName,
          fileSize: session.fileSize,
          fileHash: session.fileHash,
          rawOtp,
          accessUrl,
          qrCode,
          expiresAt: session.expiresAt,
          zeroPersistence: session.zeroPersistence,
        },
      },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create transfer session';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
