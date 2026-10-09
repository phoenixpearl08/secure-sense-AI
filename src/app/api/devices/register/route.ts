import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { jsonResponse } from '@/lib/security/headers';
import { verifySessionToken } from '@/services/auth/authService';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { deviceId, deviceName, deviceType } = body;

    if (!deviceId || typeof deviceId !== 'string') {
      return jsonResponse({ success: false, error: 'A valid deviceId is required' }, 400);
    }

    // Try identifying user from session if logged in, else assign to receiver/guest
    const sessionToken = req.cookies.get('rv_session')?.value;
    const sessionUser = sessionToken ? verifySessionToken(sessionToken) : null;
    const userId = sessionUser?.userId || 'enrolled-receiver-device';

    const registeredDevice = await db.registerDevice({
      id: crypto.randomUUID(),
      userId,
      deviceId: deviceId.trim(),
      deviceName: deviceName || 'Authorized Client Hardware',
      deviceType: deviceType || 'Desktop/Browser',
      trusted: true,
      lastSeen: new Date().toISOString(),
    });

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId,
      action: 'DEVICE_REGISTERED',
      entityType: 'Device',
      entityId: registeredDevice.id,
      metadata: {
        deviceId: registeredDevice.deviceId,
        deviceName: registeredDevice.deviceName,
        trusted: true,
      },
      timestamp: new Date().toISOString(),
    });

    return jsonResponse({
      success: true,
      message: 'Hardware device registered and trusted by security policy',
      data: registeredDevice,
    }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to register device';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
