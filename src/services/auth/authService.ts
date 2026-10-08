// RealityVault AI - Authentication & Identity Service
// Enforces server-side authorization, PBKDF2/scrypt password hashing, session signing, and RBAC.

import crypto from 'crypto';
import { UserRole } from '@/types';
import { db } from '@/lib/db';
import { hashSecret, verifySecret } from '@/lib/crypto/aes';

const SESSION_SECRET = process.env.SESSION_SECRET || 'realityvault_session_secret_min_32_bytes_hackathon_demo';

// Generates an HMAC-signed session token containing userId and expiration
export function createSessionToken(user: { id: string; email: string; role: UserRole }): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000, // 7 days
  };

  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = crypto
    .createHmac('sha256', SESSION_SECRET)
    .update(encodedPayload)
    .digest('base64url');

  return `${encodedPayload}.${signature}`;
}

// Verifies session token authenticity and returns parsed user payload
export function verifySessionToken(token: string): { userId: string; email: string; role: UserRole } | null {
  try {
    const [encodedPayload, signature] = token.split('.');
    if (!encodedPayload || !signature) return null;

    const expectedSignature = crypto
      .createHmac('sha256', SESSION_SECRET)
      .update(encodedPayload)
      .digest('base64url');

    // Constant-time signature comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      return null;
    }

    const payload = JSON.parse(Buffer.from(encodedPayload, 'base64url').toString('utf-8'));
    if (Date.now() > payload.expiresAt) {
      return null;
    }

    return {
      userId: payload.userId,
      email: payload.email,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export const authService = {
  async register(params: { email: string; name: string; password: string; role?: UserRole }) {
    const cleanEmail = params.email.trim().toLowerCase();
    
    // Check existing
    const existing = await db.findUserByEmail(cleanEmail);
    if (existing) {
      throw new Error('User already exists with this email');
    }

    if (params.password.length < 8) {
      throw new Error('Password must be at least 8 characters long');
    }

    const passwordHash = hashSecret(params.password);
    const userId = crypto.randomUUID();
    const role: UserRole = params.role || 'USER';

    const newUser = await db.createUser({
      id: userId,
      email: cleanEmail,
      name: params.name.trim(),
      passwordHash,
      role,
    });

    // Record audit
    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: newUser.id,
      userEmail: newUser.email,
      action: 'USER_REGISTERED',
      entityType: 'User',
      entityId: newUser.id,
      timestamp: new Date().toISOString(),
    });

    const sessionToken = createSessionToken(newUser);
    return { user: newUser, sessionToken };
  },

  async login(params: { email: string; password: string; deviceId?: string; deviceName?: string }) {
    const cleanEmail = params.email.trim().toLowerCase();
    const userRecord = await db.findUserByEmail(cleanEmail);

    if (!userRecord) {
      throw new Error('Invalid email or password');
    }

    const valid = verifySecret(params.password, userRecord.passwordHash);
    if (!valid) {
      // Record failed login audit
      await db.recordSecurityEvent({
        id: crypto.randomUUID(),
        eventType: 'FAILED_LOGIN',
        riskLevel: 'MEDIUM',
        details: `Failed authentication attempt for email: ${cleanEmail}`,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
      throw new Error('Invalid email or password');
    }

    const safeUser = {
      id: userRecord.id,
      email: userRecord.email,
      name: userRecord.name,
      role: userRecord.role,
      organizationId: userRecord.organizationId,
      createdAt: userRecord.createdAt,
    };

    // Register or update device if provided
    if (params.deviceId) {
      await db.registerDevice({
        id: crypto.randomUUID(),
        userId: safeUser.id,
        deviceId: params.deviceId,
        deviceName: params.deviceName || 'Web Browser',
        deviceType: 'Browser',
        trusted: true,
        lastSeen: new Date().toISOString(),
      });
    }

    const sessionToken = createSessionToken(safeUser);

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: safeUser.id,
      userEmail: safeUser.email,
      action: 'USER_LOGIN',
      entityType: 'User',
      entityId: safeUser.id,
      timestamp: new Date().toISOString(),
    });

    return { user: safeUser, sessionToken };
  },

  async getCurrentUser(token?: string) {
    if (!token) return null;
    const session = verifySessionToken(token);
    if (!session) return null;
    return db.findUserById(session.userId);
  },
};
