// RealityVault AI - Zero-Persistence & Data Retention Lifecycle Sweeper
// Automatically purges expired items, ephemeral buffers, and enforces zero-retention policies.

import { db } from '@/lib/db';
import { logger } from '@/lib/logger';
import crypto from 'crypto';

export interface SweeperReport {
  timestamp: string;
  expiredVaultItems: number;
  zeroPersistencePurged: number;
  cleanedTransfers: number;
  details: string[];
}

export async function runLifecycleSweeper(): Promise<SweeperReport> {
  const now = new Date();
  const nowIso = now.toISOString();
  let expiredVaultItems = 0;
  let zeroPersistencePurged = 0;
  const details: string[] = [];

  logger.info('Executing Data Retention & Zero-Persistence Lifecycle Sweeper');

  // 1. Process Vault Items
  const items = await db.listVaultItems();

  for (const item of items) {
    // A. Check for expired active items
    if (item.status === 'ACTIVE' && item.expiresAt && new Date(item.expiresAt) <= now) {
      await db.updateVaultItem(item.id, {
        status: 'EXPIRED',
        consumedAt: nowIso,
      });

      await db.recordSecurityEvent({
        id: crypto.randomUUID(),
        vaultItemId: item.id,
        eventType: 'ITEM_EXPIRED',
        riskLevel: 'LOW',
        details: `Item lifecycle expired automatically per policy (${item.title})`,
        resolved: true,
        createdAt: nowIso,
      });

      expiredVaultItems++;
      details.push(`Expired item ${item.accessId} (${item.title})`);
    }

    // B. Check for Zero-Persistence purge on consumed, revoked, or expired items
    if (
      item.policy.zeroPersistence &&
      (item.status === 'CONSUMED' || item.status === 'REVOKED' || item.status === 'EXPIRED')
    ) {
      // Overwrite and destroy ciphertext payload from storage
      await db.updateVaultItem(item.id, {
        status: 'DESTROYED',
        destroyedAt: nowIso,
        encryptedPayload: {
          ciphertext: '[PURGED_BY_ZERO_PERSISTENCE_POLICY]',
          iv: '',
          authTag: '',
          algorithm: 'AES-256-GCM',
        },
      });

      await db.recordAuditLog({
        id: crypto.randomUUID(),
        action: 'ZERO_PERSISTENCE_PURGED',
        entityType: 'VaultItem',
        entityId: item.id,
        metadata: {
          accessId: item.accessId,
          retentionPolicy: 'ZERO_PERSISTENCE',
          destroyedAt: nowIso,
        },
        timestamp: nowIso,
      });

      zeroPersistencePurged++;
      details.push(`Zero-persistence payload purged for ${item.accessId}`);
    }
  }

  const report: SweeperReport = {
    timestamp: nowIso,
    expiredVaultItems,
    zeroPersistencePurged,
    cleanedTransfers: 0,
    details,
  };

  logger.info('Lifecycle Sweeper completed', {
    expiredVaultItems,
    zeroPersistencePurged,
  });

  return report;
}
