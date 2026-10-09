import { NextRequest } from 'next/server';
import { deliveryEngine } from '@/services/delivery/deliveryEngine';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { methodId, accessId, recipientEmail, accessUrl } = body;

    if (!methodId || !accessId) {
      return jsonResponse({ success: false, error: 'methodId and accessId are required' }, 400);
    }

    const fullUrl = accessUrl || `http://localhost:3000/vault/access/${accessId}`;
    const result = await deliveryEngine.dispatch({
      methodId,
      accessId,
      recipientEmail,
      accessUrl: fullUrl,
    });

    return jsonResponse({
      success: result.success,
      data: result,
    }, result.success ? 200 : 400);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Delivery dispatch failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
