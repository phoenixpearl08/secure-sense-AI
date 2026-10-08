import { NextRequest } from 'next/server';
import { riskEngine } from '@/services/security/riskEngine';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const summary = await riskEngine.getSecurityDashboardSummary();
  return jsonResponse({ success: true, data: summary }, 200);
}
