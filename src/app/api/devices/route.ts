import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { jsonResponse } from '@/lib/security/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');

    if (deviceId) {
      const device = await db.findDevice(deviceId);
      return jsonResponse({
        success: true,
        data: device ? {
          deviceId: device.deviceId,
          deviceName: device.deviceName,
          trusted: device.trusted,
          lastSeen: device.lastSeen,
        } : null,
      }, 200);
    }

    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);
    if (!user) {
      return jsonResponse({ success: false, error: 'Unauthorized: Authentication required to list registered devices' }, 401);
    }

    const devices = await db.listDevices();
    const userDevices = (user.role !== 'USER')
      ? devices
      : devices.filter((d: any) => d.userId === user.id);

    const safeDevices = userDevices.map((d: any) => ({
      id: d.id,
      deviceId: d.deviceId,
      deviceName: d.deviceName,
      deviceType: d.deviceType,
      trusted: d.trusted,
      lastSeen: d.lastSeen,
    }));

    return jsonResponse({ success: true, data: safeDevices }, 200);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to query devices';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
