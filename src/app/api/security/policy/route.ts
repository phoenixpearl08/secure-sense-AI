import { NextRequest } from 'next/server';
import { generateSecurityPolicy } from '@/services/ai/policyEngine';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { prompt } = body;

    if (!prompt || typeof prompt !== 'string') {
      return jsonResponse({ success: false, error: 'A natural language prompt is required' }, 400);
    }

    const result = await generateSecurityPolicy(prompt);

    return jsonResponse(
      {
        success: true,
        data: result,
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Policy generation failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
