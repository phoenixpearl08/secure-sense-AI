import { NextRequest } from 'next/server';
import { vaultService } from '@/services/vault/vaultService';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const accessId = searchParams.get('id');

  if (!accessId) {
    return jsonResponse({ success: false, error: 'Access identifier is required' }, 400);
  }

  const metadata = await vaultService.getAccessMetadata(accessId);

  if (!metadata) {
    return jsonResponse({ success: false, error: 'Secure item not found or invalid link' }, 404);
  }

  return jsonResponse({ success: true, data: metadata }, 200);
}
