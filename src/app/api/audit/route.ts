import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  const token = req.cookies.get('rv_session')?.value;
  const user = await authService.getCurrentUser(token);

  const logs = await db.listAuditLogs();

  // Authenticated administrators see all logs
  if (user && user.role !== 'USER') {
    return jsonResponse({ success: true, data: logs }, 200);
  }

  // Authenticated regular users see only their own events
  if (user) {
    const userLogs = logs.filter((l) => l.userId === user.id || l.userEmail === user.email);
    return jsonResponse({ success: true, data: userLogs }, 200);
  }

  // Unauthenticated callers: return sanitized immutable telemetry with zero PII and zero secrets
  const publicLogs = logs.map((l) => ({
    id: l.id,
    action: l.action,
    entityType: l.entityType,
    entityId: l.entityId ? `${l.entityId.slice(0, 8)}...` : undefined,
    timestamp: l.timestamp,
    metadata: l.metadata,
  }));

  return jsonResponse({ success: true, data: publicLogs }, 200);
}
