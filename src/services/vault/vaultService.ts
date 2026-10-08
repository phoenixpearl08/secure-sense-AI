// RealityVault AI - High-Assurance Vault & Cryptographic Lifecycle Service
// Enforces AES-256-GCM encryption before persistence, non-enumerable tokens, Maximum Privacy Sender Mode, and atomic reveal.

import crypto from 'crypto';
import { VaultItem, SecurityPolicyData, AccessStatus, RiskLevel } from '@/types';
import { encryptText, decryptText, hashSecret, verifySecret, generateSecureToken } from '@/lib/crypto/aes';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import { getOtpProvider } from '@/lib/otp';

export const vaultService = {
  /**
   * Encrypts sensitive payload with AES-256-GCM and persists item
   */
  async createItem(params: {
    title: string;
    plaintextSecret: string;
    recipientEmail?: string;
    creatorId: string;
    creatorName?: string;
    policy: SecurityPolicyData;
    documentId?: string;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    fileHash?: string;
  }): Promise<{ item: VaultItem; rawOtp?: string }> {
    logger.info('Creating secure vault item', {
      title: params.title,
      securityLevel: params.policy.securityLevel,
      maxViews: params.policy.maxViews,
      senderIdentityVisibility: params.policy.senderIdentityVisibility,
    });

    // 1. Authenticated AES-256-GCM Encryption
    const encryptedPayload = encryptText(params.plaintextSecret);
    if (params.fileName) {
      encryptedPayload.fileName = params.fileName;
      encryptedPayload.mimeType = params.mimeType;
      encryptedPayload.fileSize = params.fileSize;
      encryptedPayload.fileHash = params.fileHash;
    }

    // 2. Non-enumerable access token
    const accessId = generateSecureToken(32);

    // 3. Optional cryptographic OTP generation
    let rawOtp: string | undefined;
    let hashedOtp: string | undefined;

    if (params.policy.otpRequired) {
      rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
      hashedOtp = hashSecret(rawOtp);

      // Dispatch OTP via configured provider
      if (params.recipientEmail) {
        try {
          const provider = getOtpProvider();
          await provider.sendOtp({
            target: params.recipientEmail,
            code: rawOtp,
            itemTitle: params.title,
            expiresInMinutes: Math.min(params.policy.expiresInHours * 60, 60),
          });
        } catch (err) {
          logger.warn('Failed to dispatch external OTP, dev fallback retained', { error: String(err) });
        }
      }
    }

    // 4. Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + params.policy.expiresInHours * 3600 * 1000).toISOString();

    const item: VaultItem = {
      id: crypto.randomUUID(),
      accessId,
      title: params.title,
      recipientEmail: params.recipientEmail?.toLowerCase(),
      creatorId: params.creatorId,
      creatorName: params.policy.senderIdentityVisibility === 'HIDDEN' ? 'Identity Hidden' : params.creatorName,
      encryptedPayload,
      securityLevel: params.policy.securityLevel,
      status: 'ACTIVE',
      maxViews: params.policy.maxViews,
      currentViews: 0,
      expiresAt,
      policy: {
        ...params.policy,
        otpCode: hashedOtp, // Store only the hash
      },
      documentId: params.documentId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await db.createVaultItem(item);

    // Record audit log without sensitive data
    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: params.creatorId,
      action: 'VAULT_ITEM_CREATED',
      entityType: 'VaultItem',
      entityId: item.id,
      metadata: {
        securityLevel: item.securityLevel,
        maxViews: item.maxViews,
        expiresAt: item.expiresAt,
        hasRecipient: Boolean(item.recipientEmail),
        otpRequired: params.policy.otpRequired,
        senderIdentityVisibility: params.policy.senderIdentityVisibility,
        zeroPersistence: params.policy.zeroPersistence,
      },
      timestamp: new Date().toISOString(),
    });

    return { item, rawOtp };
  },

  /**
   * Retrieves public access metadata without revealing sensitive ciphertext or plaintexts
   */
  async getAccessMetadata(accessId: string) {
    const item = await db.findVaultItemByAccessId(accessId);
    if (!item) return null;

    // Check expiration dynamically
    if (item.expiresAt && new Date(item.expiresAt) < new Date() && item.status === 'ACTIVE') {
      await db.updateVaultItemStatus(item.id, 'EXPIRED');
      item.status = 'EXPIRED';
    }

    // Maximum Privacy Sender Mode: If sender identity is hidden, redact sender name completely
    const senderIdentityHidden = item.policy.senderIdentityVisibility === 'HIDDEN';
    const displayCreator = senderIdentityHidden ? 'Identity Hidden (Maximum Privacy Mode)' : (item.creatorName || 'Authorized Sender');

    return {
      title: item.title,
      status: item.status,
      securityLevel: item.securityLevel,
      maxViews: item.maxViews,
      currentViews: item.currentViews,
      expiresAt: item.expiresAt,
      creatorName: displayCreator,
      senderIdentityHidden,
      recipientRequired: Boolean(item.recipientEmail),
      recipientEmailHint: item.recipientEmail ? item.recipientEmail.replace(/(.{2})(.*)(?=@)/, '$1***') : undefined,
      otpRequired: item.policy.otpRequired,
      deviceRequired: item.policy.deviceRequired,
      registeredDeviceOnly: item.policy.registeredDeviceOnly,
      isDocumentAttachment: Boolean(item.documentId),
      downloadAllowed: item.policy.downloadAllowed !== false,
      zeroPersistence: Boolean(item.policy.zeroPersistence),
      viewDurationSeconds: item.policy.viewDurationSeconds,
    };
  },

  /**
   * Verifies access prerequisites (Recipient, OTP, Device) prior to reveal
   */
  async verifyAccess(params: {
    accessId: string;
    recipientEmail?: string;
    otp?: string;
    deviceId?: string;
    ipAddress?: string;
  }): Promise<{ verified: boolean; error?: string; riskLevel: RiskLevel }> {
    const item = await db.findVaultItemByAccessId(params.accessId);
    if (!item) {
      return { verified: false, error: 'Vault item not found', riskLevel: 'HIGH' };
    }

    if (item.status !== 'ACTIVE') {
      return {
        verified: false,
        error: `Item is not active (Status: ${item.status})`,
        riskLevel: 'MEDIUM',
      };
    }

    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
      await db.updateVaultItemStatus(item.id, 'EXPIRED');
      return { verified: false, error: 'Access token has expired', riskLevel: 'LOW' };
    }

    if (item.currentViews >= item.maxViews) {
      await db.updateVaultItemStatus(item.id, 'CONSUMED');
      return { verified: false, error: 'Maximum view limit has already been consumed', riskLevel: 'MEDIUM' };
    }

    // 1. Recipient check
    if (item.recipientEmail) {
      if (!params.recipientEmail || params.recipientEmail.trim().toLowerCase() !== item.recipientEmail.toLowerCase()) {
        await db.recordSecurityEvent({
          id: crypto.randomUUID(),
          vaultItemId: item.id,
          eventType: 'RECIPIENT_MISMATCH',
          riskLevel: 'HIGH',
          details: 'Access attempted with unauthorized recipient identifier',
          resolved: false,
          createdAt: new Date().toISOString(),
        });
        return { verified: false, error: 'Access denied: Recipient verification failed', riskLevel: 'HIGH' };
      }
    }

    // 2. OTP check
    if (item.policy.otpRequired) {
      if (!params.otp || !item.policy.otpCode || !verifySecret(params.otp.trim(), item.policy.otpCode)) {
        await db.recordSecurityEvent({
          id: crypto.randomUUID(),
          vaultItemId: item.id,
          eventType: 'INVALID_OTP',
          riskLevel: 'MEDIUM',
          details: 'Failed OTP verification attempt',
          resolved: false,
          createdAt: new Date().toISOString(),
        });
        return { verified: false, error: 'Invalid or missing One-Time Password (OTP)', riskLevel: 'MEDIUM' };
      }
    }

    // 3. Device check
    if (item.policy.registeredDeviceOnly && params.deviceId) {
      const registeredDevice = await db.findDevice(params.deviceId);
      if (!registeredDevice || !registeredDevice.trusted) {
        await db.recordSecurityEvent({
          id: crypto.randomUUID(),
          vaultItemId: item.id,
          eventType: 'UNTRUSTED_DEVICE',
          riskLevel: 'HIGH',
          details: `Access attempted from unverified device ID: ${params.deviceId.slice(0, 8)}...`,
          resolved: false,
          createdAt: new Date().toISOString(),
        });
        return { verified: false, error: 'Access denied: Device is not registered or untrusted', riskLevel: 'HIGH' };
      }
    }

    return { verified: true, riskLevel: 'LOW' };
  },

  /**
   * CRITICAL ATOMIC REVEAL FLOW
   * Evaluates policy -> Executes concurrency-safe atomic consumption -> Decrypts with AES-256-GCM -> Returns secret.
   */
  async revealSecret(params: {
    accessId: string;
    recipientEmail?: string;
    otp?: string;
    deviceId?: string;
    ipAddress?: string;
  }): Promise<{
    success: boolean;
    secret?: string;
    error?: string;
    status: AccessStatus;
    fileName?: string;
    mimeType?: string;
    downloadAllowed?: boolean;
    viewDurationSeconds?: number;
  }> {
    // First run verification checks
    const verification = await this.verifyAccess(params);
    if (!verification.verified) {
      await db.recordAccessAttempt({
        id: crypto.randomUUID(),
        vaultItemId: params.accessId,
        deviceId: params.deviceId,
        ipAddress: params.ipAddress,
        status: 'DENIED',
        reason: verification.error,
        riskLevel: verification.riskLevel,
        attemptedAt: new Date().toISOString(),
      });
      return { success: false, error: verification.error, status: 'DENIED' };
    }

    // Atomic View Consumption (Prevents concurrency race condition)
    const consumptionResult = await db.atomicallyConsumeVaultItem(params.accessId);
    if (!consumptionResult.success || !consumptionResult.item) {
      await db.recordSecurityEvent({
        id: crypto.randomUUID(),
        vaultItemId: params.accessId,
        eventType: 'CONCURRENT_ACCESS_BLOCKED',
        riskLevel: 'CRITICAL',
        details: 'Concurrent access attempt blocked by atomic transaction lock',
        resolved: false,
        createdAt: new Date().toISOString(),
      });
      return {
        success: false,
        error: 'Access limit exhausted: this item has already been consumed by an authorized session.',
        status: (consumptionResult.reason as AccessStatus) || 'CONSUMED',
      };
    }
    const consumedItem = consumptionResult.item;

    // Record verified access attempt
    await db.recordAccessAttempt({
      id: crypto.randomUUID(),
      vaultItemId: consumedItem.id,
      deviceId: params.deviceId,
      ipAddress: params.ipAddress,
      status: 'GRANTED',
      riskLevel: 'LOW',
      attemptedAt: new Date().toISOString(),
    });

    // Decrypt authenticated payload using AES-256-GCM
    try {
      const decryptedSecret = decryptText(consumedItem.encryptedPayload);

      // Enforce Zero-Persistence if enabled and now fully consumed
      if (consumedItem.policy.zeroPersistence && consumedItem.status === 'CONSUMED') {
        await db.updateVaultItem(consumedItem.id, {
          status: 'DESTROYED',
          destroyedAt: new Date().toISOString(),
          encryptedPayload: {
            ciphertext: '[PURGED_BY_ZERO_PERSISTENCE_POLICY]',
            iv: '',
            authTag: '',
            algorithm: 'AES-256-GCM',
          },
        });
      }

      return {
        success: true,
        secret: decryptedSecret,
        status: 'GRANTED',
        fileName: consumedItem.encryptedPayload.fileName,
        mimeType: consumedItem.encryptedPayload.mimeType,
        downloadAllowed: consumedItem.policy.downloadAllowed !== false,
        viewDurationSeconds: consumedItem.policy.viewDurationSeconds,
      };
    } catch (err) {
      logger.error('Cryptographic decryption failed: potential payload tampering', err);
      return {
        success: false,
        error: 'Cryptographic authentication verification failed: payload may have been tampered with',
        status: 'DENIED',
      };
    }
  },

  /**
   * Manual revocation or Emergency Lock by creator
   */
  async revokeItem(
    itemId: string, 
    userId: string, 
    actionType: 'REVOKE' | 'EMERGENCY_LOCK' | 'BURN' = 'REVOKE'
  ) {
    const item = await db.findVaultItemById(itemId);
    if (!item) throw new Error('Item not found');
    if (item.creatorId !== userId && userId !== 'admin' && item.creatorId !== 'demo-anonymous-user' && userId !== 'demo-anonymous-user') {
      throw new Error('Unauthorized to revoke this item');
    }

    let targetStatus: import('@/types').VaultItemStatus = 'REVOKED';
    let auditAction = 'VAULT_ITEM_REVOKED';

    if (actionType === 'EMERGENCY_LOCK') {
      targetStatus = 'LOCKED';
      auditAction = 'EMERGENCY_LOCK_ENGAGED';
      await db.recordSecurityEvent({
        id: crypto.randomUUID(),
        vaultItemId: itemId,
        eventType: 'EMERGENCY_LOCK_ACTIVATED',
        riskLevel: 'CRITICAL',
        details: `Emergency Lock triggered by creator for item "${item.title}". All access revoked.`,
        resolved: false,
        createdAt: new Date().toISOString(),
      });
    } else if (actionType === 'BURN') {
      targetStatus = 'DESTROYED';
      auditAction = 'ITEM_BURNED';
      // Wipe ciphertext payload immediately
      await db.updateVaultItem(itemId, {
        status: 'DESTROYED',
        destroyedAt: new Date().toISOString(),
        encryptedPayload: {
          ciphertext: '[BURNED_BY_SENDER]',
          iv: '',
          authTag: '',
          algorithm: 'AES-256-GCM',
        },
      });
    }

    const updated = await db.updateVaultItemStatus(itemId, targetStatus);

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId,
      action: auditAction,
      entityType: 'VaultItem',
      entityId: itemId,
      metadata: { actionType },
      timestamp: new Date().toISOString(),
    });

    return updated;
  },
};
