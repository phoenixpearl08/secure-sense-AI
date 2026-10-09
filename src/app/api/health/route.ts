// RealityVault AI - System Health & Diagnostics Endpoint
// Path: GET /api/health

import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonResponse } from '@/lib/security/headers';


export async function GET(req: NextRequest) {
  const startTime = Date.now();
  const dbHealth = await db.checkConnection();

  const responsePayload = {
    status: 'ok',
    service: 'SECURE SENSE AI + DocSenseAI',
    version: '1.0.0-hackathon',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.round(process.uptime()),
    database: {
      status: dbHealth.status,
      provider: dbHealth.provider,
      fallbackActive: dbHealth.fallbackActive,
      details: dbHealth.details,
    },
    modules: {
      realityVault: 'ACTIVE',
      secureSense: 'ACTIVE',
      docSenseAI: 'ACTIVE',
      combinedMode: 'ACTIVE',
      aiPolicyEngine: 'ACTIVE',
      threatEngine: 'ACTIVE',
      secureMeetings: 'ACTIVE',
    },
    latencyMs: Date.now() - startTime,
  };

  return jsonResponse(responsePayload, 200);
}
