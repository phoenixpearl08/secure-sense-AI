import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const token = req.cookies.get('rv_session')?.value;
  const user = await authService.getCurrentUser(token);

  let items: import('@/types').VaultItem[] = [];
  if (user) {
    if (user.role !== 'USER') {
      items = await db.listVaultItems();
    } else {
      items = await db.listVaultItems(user.id);
    }
  } else {
    // Enforce tenant isolation: unauthenticated queries only see anonymous demo items
    items = await db.listVaultItems('demo-anonymous-user');
  }

  // Return items without ciphertext
  const safeItems = items.map((i) => ({
    id: i.id,
    accessId: i.accessId,
    title: i.title,
    recipientEmail: i.recipientEmail,
    creatorName: i.creatorName,
    securityLevel: i.securityLevel,
    status: i.status,
    maxViews: i.maxViews,
    currentViews: i.currentViews,
    expiresAt: i.expiresAt,
    consumedAt: i.consumedAt,
    revokedAt: i.revokedAt,
    policy: {
      otpRequired: i.policy.otpRequired,
      deviceRequired: i.policy.deviceRequired,
      registeredDeviceOnly: i.policy.registeredDeviceOnly,
    },
    createdAt: i.createdAt,
  }));

  return jsonResponse({ success: true, data: safeItems }, 200);
}
