import { NextRequest } from 'next/server';
import { vaultService } from '@/services/vault/vaultService';
import { jsonResponse, checkRateLimit } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { accessId, recipientEmail, otp, deviceId } = body;

    if (!accessId) {
      return jsonResponse({ success: false, error: 'Access identifier is required' }, 400);
    }

    const ipAddress = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';

    // Anti-Brute-Force Rate Limiting: 120 requests per minute per IP & Access ID
    if (!checkRateLimit(`reveal:${accessId}:${ipAddress}`, 120, 60)) {
      return jsonResponse({ success: false, error: 'Too many verification attempts. Please wait 1 minute.' }, 429);
    }

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
          file: result.file,
          files: result.files,
          fileName: result.fileName,
          mimeType: result.mimeType,
          fileSize: result.fileSize,
          fileHash: result.fileHash,
          downloadAllowed: result.downloadAllowed,
          viewDurationSeconds: result.viewDurationSeconds,
          allowComments: result.allowComments,
          allowAnnotations: result.allowAnnotations,
          allowAiAnalysis: result.allowAiAnalysis,
          allowAiExport: result.allowAiExport,
          allowPrint: result.allowPrint,
          allowCopyText: result.allowCopyText,
          customBranding: result.customBranding,
          shareTemplate: result.shareTemplate,
        },
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Reveal operation failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
