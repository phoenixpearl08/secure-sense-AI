// RealityVault AI - Ephemeral Real-Time Transfer Service (Zero-Persistence Relay)
// Secure relay for direct file/message transfers without persistent storage retention.
// Payload buffers exist only in transient memory during transfer and are purged immediately.

import crypto from 'crypto';
import { TransferSession, TransferState } from '@/types';
import { hashSecret, verifySecret } from '@/lib/crypto/aes';
import { logger } from '@/lib/logger';
import { db } from '@/lib/db';

// In-memory ephemeral transfer registry
const activeTransferSessions = new Map<string, TransferSession>();

export const transferService = {
  /**
   * Initializes a new ephemeral transfer session
   */
  async createSession(params: {
    fileName: string;
    fileSize: number;
    mimeType: string;
    fileHash: string;
    senderId: string;
    senderName: string;
    receiverEmail?: string;
    otpCode?: string;
    zeroPersistence?: boolean;
    expiresInMinutes?: number;
    payloadData?: string; // Encrypted ciphertext payload held only in memory
  }): Promise<{ session: TransferSession; rawOtp?: string }> {
    const sessionId = crypto.randomUUID();
    const sessionToken = `trx_${crypto.randomBytes(24).toString('base64url')}`;
    const rawOtp = params.otpCode || Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = hashSecret(rawOtp);
    const expiresIn = params.expiresInMinutes || 10;
    const expiresAt = new Date(Date.now() + expiresIn * 60 * 1000).toISOString();

    const session: TransferSession = {
      id: sessionId,
      sessionToken,
      fileName: params.fileName,
      fileSize: params.fileSize,
      mimeType: params.mimeType,
      fileHash: params.fileHash,
      senderId: params.senderId,
      senderName: params.senderName,
      receiverEmail: params.receiverEmail,
      state: 'WAITING_RECEIVER',
      otpCodeHash: otpHash,
      totalChunks: Math.max(1, Math.ceil(params.fileSize / (1024 * 1024))), // 1MB chunks
      transferredChunks: 0,
      zeroPersistence: params.zeroPersistence ?? true,
      expiresAt,
      createdAt: new Date().toISOString(),
      payloadBuffer: params.payloadData, // In-memory only
    };

    activeTransferSessions.set(sessionToken, session);

    logger.info('Ephemeral transfer session created', {
      sessionToken: sessionToken.slice(0, 10),
      fileName: session.fileName,
      zeroPersistence: session.zeroPersistence,
    });

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: params.senderId,
      action: 'EPHEMERAL_TRANSFER_CREATED',
      entityType: 'TransferSession',
      entityId: session.id,
      metadata: {
        fileName: session.fileName,
        fileSize: session.fileSize,
        zeroPersistence: session.zeroPersistence,
      },
      timestamp: new Date().toISOString(),
    });

    return { session, rawOtp };
  },

  /**
   * Retrieves transfer session public status without payload
   */
  getSession(tokenOrId: string): Omit<TransferSession, 'payloadBuffer' | 'otpCodeHash'> | null {
    const session = activeTransferSessions.get(tokenOrId) || Array.from(activeTransferSessions.values()).find((s) => s.id === tokenOrId);
    if (!session) return null;

    // Check expiration
    if (new Date(session.expiresAt) <= new Date() && session.state !== 'COMPLETED') {
      session.state = 'EXPIRED';
      session.payloadBuffer = undefined; // Memory wipe
    }

    const { payloadBuffer: _, otpCodeHash: __, ...publicData } = session;
    return publicData;
  },

  /**
   * Receives verified payload from ephemeral transfer session
   */
  async consumeTransfer(params: {
    sessionToken: string;
    otp: string;
    receiverEmail?: string;
  }): Promise<{ success: boolean; payload?: string; fileHash?: string; error?: string }> {
    const session = activeTransferSessions.get(params.sessionToken) || Array.from(activeTransferSessions.values()).find((s) => s.id === params.sessionToken);
    if (!session) {
      return { success: false, error: 'Transfer session not found or already closed' };
    }

    if (session.state === 'COMPLETED' || session.state === 'CLEANED_UP') {
      return { success: false, error: 'Transfer has already been completed and purged' };
    }

    if (session.state === 'CANCELLED' || session.state === 'EXPIRED') {
      return { success: false, error: `Transfer is inactive (State: ${session.state})` };
    }

    // Verify OTP
    if (session.otpCodeHash) {
      if (!params.otp || !verifySecret(params.otp.trim(), session.otpCodeHash)) {
        return { success: false, error: 'Invalid verification passcode (OTP)' };
      }
    }

    // Deliver payload and immediately purge memory if zero-persistence
    const payload = session.payloadBuffer;
    session.transferredChunks = session.totalChunks;
    session.state = 'COMPLETED';
    session.completedAt = new Date().toISOString();

    if (session.zeroPersistence) {
      // Immediate memory wipe
      session.payloadBuffer = undefined;
      session.state = 'CLEANED_UP';
    }

    logger.info('Ephemeral transfer successfully consumed and purged', {
      sessionToken: params.sessionToken.slice(0, 10),
      zeroPersistencePurged: session.zeroPersistence,
    });

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      action: 'EPHEMERAL_TRANSFER_COMPLETED',
      entityType: 'TransferSession',
      entityId: session.id,
      metadata: {
        fileName: session.fileName,
        zeroPersistence: session.zeroPersistence,
      },
      timestamp: new Date().toISOString(),
    });

    return {
      success: true,
      payload,
      fileHash: session.fileHash,
    };
  },

  /**
   * Cancels transfer and purges memory buffer
   */
  cancelSession(sessionToken: string, reason: string): boolean {
    const session = activeTransferSessions.get(sessionToken);
    if (!session) return false;

    session.state = 'CANCELLED';
    session.payloadBuffer = undefined; // Wipe memory immediately

    logger.warn('Transfer session cancelled by user', {
      sessionToken: sessionToken.slice(0, 10),
      reason,
    });

    return true;
  },

  /**
   * Sweeps and purges expired ephemeral transfer sessions from memory
   */
  sweepExpiredSessions(): number {
    const now = new Date();
    let purged = 0;
    for (const [token, session] of activeTransferSessions.entries()) {
      if (new Date(session.expiresAt) <= now && session.state !== 'COMPLETED') {
        session.state = 'EXPIRED';
        session.payloadBuffer = undefined; // Immediate memory wipe
        activeTransferSessions.delete(token);
        purged++;
      }
    }
    return purged;
  },

  /**
   * Lists active transfer sessions for sender (strictly isolated to owner or admin)
   */
  listSessionsForUser(userId: string, role?: string): Omit<TransferSession, 'payloadBuffer' | 'otpCodeHash'>[] {
    const list: Omit<TransferSession, 'payloadBuffer' | 'otpCodeHash'>[] = [];
    const isAdmin = role === 'ADMIN' || role === 'SECURITY_OFFICER';
    for (const session of activeTransferSessions.values()) {
      if (isAdmin || session.senderId === userId) {
        const { payloadBuffer: _, otpCodeHash: __, ...publicData } = session;
        list.push(publicData);
      }
    }
    return list;
  },
};
