import { NextRequest } from 'next/server';
import { simulateSharePolicy, validateAndNormalizePolicy } from '@/services/ai/policyEngine';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { policy } = body;

    const validatedPolicy = validateAndNormalizePolicy(policy || {});
    const simulationResults = simulateSharePolicy(validatedPolicy);

    return jsonResponse({
      success: true,
      data: {
        policy: validatedPolicy,
        simulation: simulationResults,
      },
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Simulation failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
