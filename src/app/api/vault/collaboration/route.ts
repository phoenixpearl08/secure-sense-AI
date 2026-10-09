import { NextRequest } from 'next/server';
import { vaultService } from '@/services/vault/vaultService';
import { authService } from '@/services/auth/authService';
import { db } from '@/lib/db';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { action, accessId, itemId, payload } = body;

    if (!action) {
      return jsonResponse({ success: false, error: 'Action is required' }, 400);
    }

    if (action === 'ADD_COMMENT') {
      if (!accessId || !payload?.authorEmail || !payload?.text) {
        return jsonResponse({ success: false, error: 'accessId, authorEmail, and text are required' }, 400);
      }
      const res = await vaultService.addComment(accessId, {
        authorEmail: payload.authorEmail,
        text: payload.text,
        pageNumber: payload.pageNumber,
      });
      return jsonResponse(res, res.success ? 200 : 404);
    }

    if (action === 'REQUEST_EXTENSION') {
      if (!accessId || !payload?.requesterEmail || !payload?.reason) {
        return jsonResponse({ success: false, error: 'accessId, requesterEmail, and reason are required' }, 400);
      }
      const res = await vaultService.requestExtension(accessId, {
        requesterEmail: payload.requesterEmail,
        reason: payload.reason,
        requestedHours: payload.requestedHours || 24,
      });
      return jsonResponse(res, res.success ? 200 : 404);
    }

    if (action === 'REQUEST_DOWNLOAD') {
      if (!accessId || !payload?.requesterEmail || !payload?.reason) {
        return jsonResponse({ success: false, error: 'accessId, requesterEmail, and reason are required' }, 400);
      }
      const res = await vaultService.requestDownload(accessId, {
        requesterEmail: payload.requesterEmail,
        reason: payload.reason,
      });
      return jsonResponse(res, res.success ? 200 : 404);
    }

    if (action === 'ACKNOWLEDGE_RECEIPT') {
      if (!accessId || !payload?.userEmail) {
        return jsonResponse({ success: false, error: 'accessId and userEmail are required' }, 400);
      }
      const res = await vaultService.acknowledgeReceipt(accessId, payload.userEmail);
      return jsonResponse(res, res.success ? 200 : 404);
    }

    if (action === 'UPDATE_EXPIRY') {
      if (!itemId || !payload?.newExpiresAt) {
        return jsonResponse({ success: false, error: 'itemId and newExpiresAt are required' }, 400);
      }
      const token = req.cookies.get('rv_session')?.value;
      const user = await authService.getCurrentUser(token);
      const item = await db.findVaultItemById(itemId);
      if (!item) {
        return jsonResponse({ success: false, error: 'Vault item not found' }, 404);
      }
      const isOwner = Boolean(user && (user.id === item.creatorId || user.role !== 'USER'));
      const isDemoItem = item.creatorId === 'demo-anonymous-user';
      if (!isOwner && !isDemoItem) {
        return jsonResponse({ success: false, error: 'Forbidden: Only the item creator or administrator can modify access policies' }, 403);
      }

      const res = await vaultService.updateExpiry(itemId, payload.newExpiresAt);
      return jsonResponse(res, res.success ? 200 : 404);
    }

    if (action === 'UPDATE_DOWNLOAD_PERMISSION') {
      if (!itemId || payload?.allowed === undefined) {
        return jsonResponse({ success: false, error: 'itemId and allowed boolean are required' }, 400);
      }
      const token = req.cookies.get('rv_session')?.value;
      const user = await authService.getCurrentUser(token);
      const item = await db.findVaultItemById(itemId);
      if (!item) {
        return jsonResponse({ success: false, error: 'Vault item not found' }, 404);
      }
      const isOwner = Boolean(user && (user.id === item.creatorId || user.role !== 'USER'));
      const isDemoItem = item.creatorId === 'demo-anonymous-user';
      if (!isOwner && !isDemoItem) {
        return jsonResponse({ success: false, error: 'Forbidden: Only the item creator or administrator can modify access policies' }, 403);
      }

      const res = await vaultService.updateDownloadPermission(itemId, Boolean(payload.allowed));
      return jsonResponse(res, res.success ? 200 : 404);
    }

    return jsonResponse({ success: false, error: `Unsupported action: ${action}` }, 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Collaboration request failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
