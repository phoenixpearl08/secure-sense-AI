import { NextRequest } from 'next/server';
import { deliveryEngine, DeliveryCategory } from '@/services/delivery/deliveryEngine';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get('category') as DeliveryCategory | null;

    const methods = category
      ? deliveryEngine.getMethodsByCategory(category)
      : deliveryEngine.getAllMethods();

    const summary = deliveryEngine.getStatusSummary();

    return jsonResponse({
      success: true,
      data: {
        summary,
        methods,
      },
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to retrieve delivery providers';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
