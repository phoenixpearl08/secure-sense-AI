import { NextRequest } from 'next/server';
import { runLifecycleSweeper } from '@/services/vault/lifecycleService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const report = await runLifecycleSweeper();
    return jsonResponse({ success: true, data: report }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Lifecycle sweeper failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
