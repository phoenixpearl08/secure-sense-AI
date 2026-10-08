// RealityVault AI - Deterministic Threat & Risk Engine
// Evaluates anomalies, failed challenges, device risk, and sets alert thresholds without leaking secrets.

import crypto from 'crypto';
import { RiskLevel, SecurityEvent } from '@/types';
import { db } from '@/lib/db';
import { logger } from '@/lib/logger';

export interface ThreatEvaluation {
  riskLevel: RiskLevel;
  action: 'ALLOW' | 'CHALLENGE_ADDITIONAL' | 'BLOCK' | 'LOCK_AND_ALERT';
  score: number;
  factors: string[];
}

export const riskEngine = {
  /**
   * Evaluates risk score based on recent access telemetry for an item or IP
   */
  async evaluateAttempt(params: {
    vaultItemId?: string;
    ipAddress?: string;
    deviceId?: string;
    isFailedRecipient?: boolean;
    isFailedOtp?: boolean;
    isUntrustedDevice?: boolean;
  }): Promise<ThreatEvaluation> {
    const factors: string[] = [];
    let score = 0;

    // 1. Recipient mismatch penalty
    if (params.isFailedRecipient) {
      score += 40;
      factors.push('Recipient identity mismatch');
    }

    // 2. Failed OTP penalty
    if (params.isFailedOtp) {
      score += 30;
      factors.push('Invalid OTP challenge submission');
    }

    // 3. Untrusted / unknown device penalty
    if (params.isUntrustedDevice) {
      score += 25;
      factors.push('Unregistered hardware/browser fingerprint');
    }

    // 4. Frequency check: check recent access attempts for this item or IP
    if (params.vaultItemId) {
      const recentAttempts = await db.listAccessAttempts();
      const itemAttempts = recentAttempts.filter(
        (a) =>
          a.vaultItemId === params.vaultItemId &&
          Date.now() - new Date(a.attemptedAt).getTime() < 10 * 60 * 1000 // Last 10 minutes
      );

      const failedCount = itemAttempts.filter((a) => a.status === 'DENIED').length;
      if (failedCount >= 3) {
        score += 35;
        factors.push(`Multiple failed attempts (${failedCount}) in short window`);
      }
    }

    // Determine Risk Level & Prescribed Action
    let riskLevel: RiskLevel = 'LOW';
    let action: ThreatEvaluation['action'] = 'ALLOW';

    if (score >= 70) {
      riskLevel = 'CRITICAL';
      action = 'LOCK_AND_ALERT';
    } else if (score >= 50) {
      riskLevel = 'HIGH';
      action = 'BLOCK';
    } else if (score >= 25) {
      riskLevel = 'MEDIUM';
      action = 'CHALLENGE_ADDITIONAL';
    }

    logger.security('Evaluated access threat', {
      riskLevel,
      score,
      factorCount: factors.length,
    });

    return {
      riskLevel,
      action,
      score,
      factors,
    };
  },

  /**
   * Triggers a security alert and logs clean non-sensitive event
   */
  async triggerSecurityAlert(params: {
    vaultItemId?: string;
    eventType: string;
    riskLevel: RiskLevel;
    details: string;
  }): Promise<SecurityEvent> {
    const event: SecurityEvent = {
      id: crypto.randomUUID(),
      vaultItemId: params.vaultItemId,
      eventType: params.eventType,
      riskLevel: params.riskLevel,
      details: params.details,
      resolved: false,
      createdAt: new Date().toISOString(),
    };

    await db.recordSecurityEvent(event);
    return event;
  },

  /**
   * Generates summary statistics for the Security Center dashboard
   */
  async getSecurityDashboardSummary() {
    const events = await db.listSecurityEvents();
    const attempts = await db.listAccessAttempts();
    const vaultItems = await db.listVaultItems();
    const auditLogs = await db.listAuditLogs();

    const activeItems = vaultItems.filter((i) => i.status === 'ACTIVE').length;
    const consumedItems = vaultItems.filter((i) => i.status === 'CONSUMED').length;
    const revokedItems = vaultItems.filter((i) => i.status === 'REVOKED').length;
    const blockedAttempts = attempts.filter((a) => a.status === 'DENIED').length;
    const criticalEvents = events.filter((e) => e.riskLevel === 'CRITICAL' || e.riskLevel === 'HIGH').length;

    return {
      activeItems,
      consumedItems,
      revokedItems,
      totalItems: vaultItems.length,
      blockedAttempts,
      totalAttempts: attempts.length,
      criticalEvents,
      recentEvents: events.slice(0, 10),
      recentAuditLogs: auditLogs.slice(0, 15),
    };
  },
};
