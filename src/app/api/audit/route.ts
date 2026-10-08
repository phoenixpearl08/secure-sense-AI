import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const logs = await db.listAuditLogs();
  return jsonResponse({ success: true, data: logs }, 200);
}
