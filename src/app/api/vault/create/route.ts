import { NextRequest } from 'next/server';
import { vaultService } from '@/services/vault/vaultService';
import { authService } from '@/services/auth/authService';
import { validateAndNormalizePolicy } from '@/services/ai/policyEngine';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const { title, plaintextSecret, recipientEmail, policy: rawPolicy, documentId } = body;

    if (!title || !plaintextSecret) {
      return jsonResponse({ success: false, error: 'Title and confidential content are required' }, 400);
    }

    // Strictly validate policy schema
    const policy = validateAndNormalizePolicy(rawPolicy || {});

    const creatorId = user ? user.id : 'demo-anonymous-user';
    const creatorName = user ? user.name : 'Authorized Security Officer';

    const { item, rawOtp } = await vaultService.createItem({
      title,
      plaintextSecret,
      recipientEmail: recipientEmail || policy.recipientEmail,
      creatorId,
      creatorName,
      policy,
      documentId,
    });

    return jsonResponse(
      {
        success: true,
        data: {
          accessId: item.accessId,
          title: item.title,
          status: item.status,
          securityLevel: item.securityLevel,
          expiresAt: item.expiresAt,
          maxViews: item.maxViews,
          rawOtp, // Provided to creator upon item generation
          accessUrl: `/vault/access/${item.accessId}`,
        },
      },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to create vault item';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
