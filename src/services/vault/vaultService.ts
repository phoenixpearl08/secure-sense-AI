// RealityVault AI - Vault Service & Controlled Access Lifecycle
// Core Rules: Encrypt before persist -> Non-enumerable access tokens -> Verification -> Atomic consumption -> Zero-leakage.

import crypto from 'crypto';
import { VaultItem, SecurityPolicyData, RiskLevel, AccessStatus } from '@/types';
import { db } from '@/lib/db';
import { encryptPayload, decryptPayload, generateSecureAccessId, generateOtp, hashSecret, verifySecret } from '@/lib/crypto/aes';
import { logger } from '@/lib/logger';

export const vaultService = {
  /**
   * Creates a new encrypted vault item and generates non-enumerable secure access link
   */
  async createItem(params: {
    title: string;
    plaintextSecret: string;
    recipientEmail?: string;
    creatorId: string;
    creatorName?: string;
    policy: SecurityPolicyData;
    documentId?: string;
  }): Promise<{ item: VaultItem; rawOtp?: string }> {
    logger.info('Creating secure vault item', {
      title: params.title,
      securityLevel: params.policy.securityLevel,
      maxViews: params.policy.maxViews,
    });

    // Encrypt sensitive content using AES-256-GCM
    const encryptedPayload = encryptPayload(params.plaintextSecret);

    // Generate secure non-enumerable 256-bit access token
    const accessId = generateSecureAccessId();

    // Calculate expiration timestamp
    const expiresAt = new Date(Date.now() + params.policy.expiresInHours * 60 * 60 * 1000).toISOString();

    // If OTP is required, generate secure random OTP and store its salted scrypt hash
    let rawOtp: string | undefined;
    let hashedOtp: string | undefined;
    if (params.policy.otpRequired) {
      rawOtp = generateOtp();
      hashedOtp = hashSecret(rawOtp);
    }

    const item: VaultItem = {
      id: crypto.randomUUID(),
      accessId,
      title: params.title,
      recipientEmail: params.recipientEmail?.toLowerCase(),
      creatorId: params.creatorId,
      creatorName: params.creatorName,
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

    // Return strictly sanitized public metadata
    return {
      title: item.title,
      status: item.status,
      securityLevel: item.securityLevel,
      maxViews: item.maxViews,
      currentViews: item.currentViews,
      expiresAt: item.expiresAt,
      creatorName: item.creatorName || 'Authorized Sender',
      recipientRequired: Boolean(item.recipientEmail),
      recipientEmailHint: item.recipientEmail ? item.recipientEmail.replace(/(.{2})(.*)(?=@)/, '$1***') : undefined,
      otpRequired: item.policy.otpRequired,
      deviceRequired: item.policy.deviceRequired,
      registeredDeviceOnly: item.policy.registeredDeviceOnly,
      isDocumentAttachment: Boolean(item.documentId),
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

    // 1. Recipient check
    if (item.recipientEmail) {
      if (!params.recipientEmail || params.recipientEmail.trim().toLowerCase() !== item.recipientEmail) {
        await db.recordSecurityEvent({
          id: crypto.randomUUID(),
          vaultItemId: item.id,
          eventType: 'RECIPIENT_MISMATCH',
          riskLevel: 'HIGH',
          details: 'Access attempted with unauthorized recipient email',
          resolved: false,
          createdAt: new Date().toISOString(),
        });
        return { verified: false, error: 'Recipient email does not match authorized recipient', riskLevel: 'HIGH' };
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

    // ATOMIC CONSUMPTION STEP:
    // Guarantees only ONE concurrent request can successfully consume a maxViews=1 item
    const consumeResult = await db.atomicallyConsumeVaultItem(params.accessId);

    if (!consumeResult.success || !consumeResult.item) {
      const reasonMsg =
        consumeResult.reason === 'ALREADY_CONSUMED'
          ? 'This secure item has already been viewed and destroyed.'
          : consumeResult.reason === 'EXPIRED'
          ? 'This secure item has expired.'
          : 'Access denied or item revoked.';

      await db.recordAccessAttempt({
        id: crypto.randomUUID(),
        vaultItemId: params.accessId,
        deviceId: params.deviceId,
        ipAddress: params.ipAddress,
        status: 'CONSUMED',
        reason: reasonMsg,
        riskLevel: 'MEDIUM',
        attemptedAt: new Date().toISOString(),
      });

      return { success: false, error: reasonMsg, status: 'CONSUMED' };
    }

    // Decrypt authenticated payload using AES-256-GCM
    try {
      const decryptedSecret = decryptPayload(consumeResult.item.encryptedPayload);

      await db.recordAccessAttempt({
        id: crypto.randomUUID(),
        vaultItemId: consumeResult.item.id,
        deviceId: params.deviceId,
        ipAddress: params.ipAddress,
        status: 'GRANTED',
        riskLevel: 'LOW',
        attemptedAt: new Date().toISOString(),
      });

      await db.recordAuditLog({
        id: crypto.randomUUID(),
        action: 'VAULT_ITEM_REVEALED',
        entityType: 'VaultItem',
        entityId: consumeResult.item.id,
        metadata: {
          currentViews: consumeResult.item.currentViews,
          maxViews: consumeResult.item.maxViews,
          finalStatus: consumeResult.item.status,
        },
        timestamp: new Date().toISOString(),
      });

      return {
        success: true,
        secret: decryptedSecret,
        status: 'GRANTED',
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
   * Manual revocation by creator
   */
  async revokeItem(itemId: string, userId: string) {
    const item = await db.findVaultItemById(itemId);
    if (!item) throw new Error('Item not found');
    if (item.creatorId !== userId) throw new Error('Unauthorized to revoke this item');

    const updated = await db.updateVaultItemStatus(itemId, 'REVOKED');

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId,
      action: 'VAULT_ITEM_REVOKED',
      entityType: 'VaultItem',
      entityId: itemId,
      timestamp: new Date().toISOString(),
    });

    return updated;
  },
};
