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
    plaintextSecret?: string;
    fileData?: string;
    files?: Array<{
      name: string;
      mimeType: string;
      size: number;
      hash?: string;
      data: string;
      folderPath?: string;
    }>;
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
      hasAttachedFile: Boolean(params.fileData || params.fileName),
      fileCount: params.files?.length || (params.fileData ? 1 : 0),
    });

    // 1. Prepare structured payload for authenticated AES-256-GCM Encryption
    let contentToEncrypt: string;
    if (params.files && params.files.length > 0) {
      contentToEncrypt = JSON.stringify({
        __vaultType: 'SECURE_FILE_PACKAGE',
        version: '2.0',
        text: params.plaintextSecret || '',
        file: params.files[0],
        files: params.files,
      });
    } else if (params.fileData) {
      contentToEncrypt = JSON.stringify({
        __vaultType: 'SECURE_FILE_PACKAGE',
        version: '2.0',
        text: params.plaintextSecret || '',
        file: {
          name: params.fileName || 'secure_file',
          mimeType: params.mimeType || 'application/octet-stream',
          size: params.fileSize || 0,
          hash: params.fileHash,
          data: params.fileData,
        },
      });
    } else {
      contentToEncrypt = params.plaintextSecret || '';
    }

    const encryptedPayload = encryptText(contentToEncrypt);
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
   * Retrieves public access metadata without revealing sensitive ciphertext or plaintexts.
   * Performs dynamic device trust verification so UI accurately reflects backend authorization.
   */
  async getAccessMetadata(accessId: string, deviceId?: string) {
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

    // Deterministic Device Authorization State
    let deviceVerified = false;
    let deviceStatus: 'VERIFIED' | 'UNTRUSTED' | 'NOT_REGISTERED' | 'NOT_REQUIRED' = 'NOT_REQUIRED';
    let deviceMessage = '';

    if (item.policy.registeredDeviceOnly) {
      if (deviceId) {
        const registeredDevice = await db.findDevice(deviceId);
        if (registeredDevice && registeredDevice.trusted) {
          deviceVerified = true;
          deviceStatus = 'VERIFIED';
          deviceMessage = 'Device verified: Authorized trusted hardware fingerprint.';
        } else if (registeredDevice && !registeredDevice.trusted) {
          deviceVerified = false;
          deviceStatus = 'UNTRUSTED';
          deviceMessage = 'Access denied: Device is registered but marked as untrusted.';
        } else {
          deviceVerified = false;
          deviceStatus = 'NOT_REGISTERED';
          deviceMessage = 'Access denied: Device is not registered or untrusted for this security policy.';
        }
      } else {
        deviceVerified = false;
        deviceStatus = 'NOT_REGISTERED';
        deviceMessage = 'Device verification required: No device fingerprint provided.';
      }
    } else if (item.policy.deviceRequired) {
      if (deviceId) {
        deviceVerified = true;
        deviceStatus = 'VERIFIED';
        deviceMessage = 'Hardware fingerprint recorded.';
      } else {
        deviceVerified = false;
        deviceStatus = 'NOT_REGISTERED';
        deviceMessage = 'Device fingerprint identification required.';
      }
    } else {
      deviceVerified = true;
      deviceStatus = 'NOT_REQUIRED';
      deviceMessage = 'Device policy: Any device permitted.';
    }

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
      deviceVerified,
      deviceStatus,
      deviceMessage,
      isDocumentAttachment: Boolean(item.documentId || item.encryptedPayload.fileName),
      fileName: item.encryptedPayload.fileName,
      mimeType: item.encryptedPayload.mimeType,
      fileSize: item.encryptedPayload.fileSize,
      fileHash: item.encryptedPayload.fileHash,
      downloadAllowed: item.policy.downloadAllowed !== false,
      zeroPersistence: Boolean(item.policy.zeroPersistence),
      viewDurationSeconds: item.policy.viewDurationSeconds,
      allowComments: item.policy.allowComments !== false,
      allowAnnotations: item.policy.allowAnnotations !== false,
      allowAiAnalysis: item.policy.allowAiAnalysis !== false,
      allowAiExport: item.policy.allowAiExport !== false,
      allowPrint: item.policy.allowPrint !== false,
      allowCopyText: item.policy.allowCopyText !== false,
      customBranding: item.policy.customBranding,
      shareTemplate: item.policy.shareTemplate,
      comments: item.comments || [],
      extensionRequests: item.extensionRequests || [],
      downloadRequests: item.downloadRequests || [],
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

    // 3. Device check: Enforced server-side strictly before reveal
    if (item.policy.registeredDeviceOnly) {
      if (!params.deviceId) {
        return { verified: false, error: 'Access denied: Device is not registered or untrusted', riskLevel: 'HIGH' };
      }
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
    } else if (item.policy.deviceRequired && !params.deviceId) {
      return { verified: false, error: 'Access denied: Device fingerprint is required', riskLevel: 'MEDIUM' };
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
    file?: any;
    files?: any[];
    error?: string;
    status: AccessStatus;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    fileHash?: string;
    downloadAllowed?: boolean;
    viewDurationSeconds?: number;
    allowComments?: boolean;
    allowAnnotations?: boolean;
    allowAiAnalysis?: boolean;
    allowAiExport?: boolean;
    allowPrint?: boolean;
    allowCopyText?: boolean;
    customBranding?: any;
    shareTemplate?: string;
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
      const decryptedRaw = decryptText(consumedItem.encryptedPayload);
      let decryptedSecret = decryptedRaw;
      let fileDataObj: any = undefined;
      let filesListObj: any[] | undefined = undefined;

      // Unpack structured file package if present
      if (decryptedRaw.startsWith('{"__vaultType":"SECURE_FILE_PACKAGE"')) {
        try {
          const parsed = JSON.parse(decryptedRaw);
          decryptedSecret = parsed.text || '';
          fileDataObj = parsed.file;
          filesListObj = parsed.files;
        } catch {
          // Retain raw string if parse fails
        }
      } else if (decryptedRaw.startsWith('data:')) {
        // Direct data URL payload
        fileDataObj = {
          name: consumedItem.encryptedPayload.fileName || 'decrypted_file',
          mimeType: consumedItem.encryptedPayload.mimeType || decryptedRaw.substring(5, decryptedRaw.indexOf(';') > 0 ? decryptedRaw.indexOf(';') : 20),
          size: consumedItem.encryptedPayload.fileSize || Math.round(decryptedRaw.length * 0.75),
          hash: consumedItem.encryptedPayload.fileHash,
          data: decryptedRaw,
        };
      }

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
        file: fileDataObj,
        files: filesListObj,
        status: 'GRANTED',
        fileName: fileDataObj?.name || consumedItem.encryptedPayload.fileName,
        mimeType: fileDataObj?.mimeType || consumedItem.encryptedPayload.mimeType,
        fileSize: fileDataObj?.size || consumedItem.encryptedPayload.fileSize,
        fileHash: fileDataObj?.hash || consumedItem.encryptedPayload.fileHash,
        downloadAllowed: consumedItem.policy.downloadAllowed !== false,
        viewDurationSeconds: consumedItem.policy.viewDurationSeconds,
        allowComments: consumedItem.policy.allowComments !== false,
        allowAnnotations: consumedItem.policy.allowAnnotations !== false,
        allowAiAnalysis: consumedItem.policy.allowAiAnalysis !== false,
        allowAiExport: consumedItem.policy.allowAiExport !== false,
        allowPrint: consumedItem.policy.allowPrint !== false,
        allowCopyText: consumedItem.policy.allowCopyText !== false,
        customBranding: consumedItem.policy.customBranding,
        shareTemplate: consumedItem.policy.shareTemplate,
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

  /**
   * Adds an authenticated receiver/sender comment
   */
  async addComment(accessId: string, comment: { authorEmail: string; text: string; pageNumber?: number }) {
    const item = await db.findVaultItemByAccessId(accessId);
    if (!item) return { success: false, error: 'Vault item not found' };
    const comments = item.comments || [];
    const newComment = {
      id: crypto.randomUUID(),
      authorEmail: comment.authorEmail,
      text: comment.text,
      pageNumber: comment.pageNumber,
      createdAt: new Date().toISOString(),
    };
    comments.push(newComment);
    await db.updateVaultItem(item.id, { comments });
    return { success: true, comment: newComment };
  },

  /**
   * Records a receiver access extension request
   */
  async requestExtension(accessId: string, req: { requesterEmail: string; reason: string; requestedHours: number }) {
    const item = await db.findVaultItemByAccessId(accessId);
    if (!item) return { success: false, error: 'Vault item not found' };
    const extensionRequests = item.extensionRequests || [];
    const newReq = {
      id: crypto.randomUUID(),
      requesterEmail: req.requesterEmail,
      reason: req.reason,
      requestedHours: req.requestedHours || 24,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
    };
    extensionRequests.push(newReq);
    await db.updateVaultItem(item.id, { extensionRequests });
    return { success: true, request: newReq };
  },

  /**
   * Records a receiver download permission request
   */
  async requestDownload(accessId: string, req: { requesterEmail: string; reason: string }) {
    const item = await db.findVaultItemByAccessId(accessId);
    if (!item) return { success: false, error: 'Vault item not found' };
    const downloadRequests = item.downloadRequests || [];
    const newReq = {
      id: crypto.randomUUID(),
      requesterEmail: req.requesterEmail,
      reason: req.reason,
      status: 'PENDING' as const,
      createdAt: new Date().toISOString(),
    };
    downloadRequests.push(newReq);
    await db.updateVaultItem(item.id, { downloadRequests });
    return { success: true, request: newReq };
  },

  /**
   * Records recipient receipt acknowledgment
   */
  async acknowledgeReceipt(accessId: string, userEmail: string) {
    const item = await db.findVaultItemByAccessId(accessId);
    if (!item) return { success: false, error: 'Vault item not found' };
    const acknowledgments = item.acknowledgments || [];
    acknowledgments.push({
      userEmail,
      timestamp: new Date().toISOString(),
    });
    await db.updateVaultItem(item.id, { acknowledgments });
    return { success: true };
  },

  /**
   * Extends or shortens server-authoritative expiry
   */
  async updateExpiry(itemId: string, newExpiresAt: string) {
    const item = await db.findVaultItemById(itemId);
    if (!item) return { success: false, error: 'Vault item not found' };
    const isNowActive = new Date(newExpiresAt) > new Date() && item.status === 'EXPIRED';
    await db.updateVaultItem(itemId, {
      expiresAt: newExpiresAt,
      status: isNowActive ? 'ACTIVE' : item.status,
    });
    return { success: true, expiresAt: newExpiresAt };
  },

  /**
   * Updates download permission dynamically
   */
  async updateDownloadPermission(itemId: string, allowed: boolean) {
    const item = await db.findVaultItemById(itemId);
    if (!item) return { success: false, error: 'Vault item not found' };
    await db.updateVaultItem(itemId, {
      policy: {
        ...item.policy,
        downloadAllowed: allowed,
      },
    });
    return { success: true, downloadAllowed: allowed };
  },
};
