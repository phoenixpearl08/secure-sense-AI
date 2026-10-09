import { NextRequest } from 'next/server';
import { analyzePrivacyRisks } from '@/services/security/privacyGuard';
import { jsonResponse, checkRateLimit } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    if (!checkRateLimit(`guard:${ip}`, 60, 60)) {
      return jsonResponse({ success: false, error: 'Rate limit exceeded' }, 429);
    }

    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return jsonResponse({ success: false, error: 'Text content is required' }, 400);
    }

    const report = analyzePrivacyRisks(text);
    return jsonResponse({ success: true, data: report }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Privacy guard evaluation failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
