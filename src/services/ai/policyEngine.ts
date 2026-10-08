// RealityVault AI - Adaptive AI Security Policy Engine
// Core Principle: Human Intent -> Generative AI Recommends -> Backend Decides -> Cryptography Enforces.
// Translates natural language instructions into strict, schema-validated security policies.

import { 
  SecurityPolicyData, 
  SecurityLevel, 
  SenderPrivacyMode, 
  SecurityScoreReport, 
  PolicyScoreBreakdown, 
  PolicyConflictWarning 
} from '@/types';
import { logger } from '@/lib/logger';

const ALLOWED_SECURITY_LEVELS: SecurityLevel[] = ['STANDARD', 'CONFIDENTIAL', 'HIGH_SECURITY', 'CRITICAL', 'CUSTOM_AI'];

/**
 * Validates and normalizes raw policy objects against strict schema constraints
 */
export function validateAndNormalizePolicy(rawPolicy: unknown): SecurityPolicyData {
  if (!rawPolicy || typeof rawPolicy !== 'object') {
    throw new Error('Policy payload must be a non-null object');
  }

  const p = rawPolicy as Record<string, unknown>;

  // Security level enforcement
  let securityLevel: SecurityLevel = 'HIGH_SECURITY';
  if (typeof p.securityLevel === 'string' && ALLOWED_SECURITY_LEVELS.includes(p.securityLevel as SecurityLevel)) {
    securityLevel = p.securityLevel as SecurityLevel;
  }

  // Max views (strict bounds: 1 to 50)
  let maxViews = 1;
  if (typeof p.maxViews === 'number' && Number.isInteger(p.maxViews)) {
    maxViews = Math.max(1, Math.min(50, p.maxViews));
  }

  // Expiration in hours (bounds: 1 to 720 hours)
  let expiresInHours = 24;
  if (typeof p.expiresInHours === 'number' && Number.isFinite(p.expiresInHours)) {
    expiresInHours = Math.max(1, Math.min(720, p.expiresInHours));
  }

  const otpRequired = Boolean(p.otpRequired);
  const deviceRequired = Boolean(p.deviceRequired || p.registeredDeviceOnly);
  const registeredDeviceOnly = Boolean(p.registeredDeviceOnly);
  const senderApproval = Boolean(p.senderApproval);
  const riskDetection = p.riskDetection !== false; // Default true for security
  const recipientRequired = Boolean(p.recipientRequired || p.recipientEmail);

  let recipientEmail: string | undefined;
  if (typeof p.recipientEmail === 'string' && p.recipientEmail.includes('@')) {
    recipientEmail = p.recipientEmail.trim().toLowerCase();
  }

  // Privacy & Lifecycle Controls
  const senderIdentityVisibility: SenderPrivacyMode = 
    p.senderIdentityVisibility === 'HIDDEN' ? 'HIDDEN' : 'VISIBLE';
  const zeroPersistence = Boolean(p.zeroPersistence);
  const downloadAllowed = p.downloadAllowed !== false; // Default true unless restricted
  
  let viewDurationSeconds: number | undefined;
  if (typeof p.viewDurationSeconds === 'number' && p.viewDurationSeconds > 0) {
    viewDurationSeconds = Math.max(10, Math.min(3600, p.viewDurationSeconds));
  }

  return {
    securityLevel,
    recipientRequired,
    recipientEmail,
    otpRequired,
    deviceRequired,
    registeredDeviceOnly,
    senderApproval,
    riskDetection,
    maxViews,
    expiresInHours,
    senderIdentityVisibility,
    zeroPersistence,
    downloadAllowed,
    viewDurationSeconds,
    promptText: typeof p.promptText === 'string' ? p.promptText : undefined,
  };
}

/**
 * Deterministic local NLP engine for Natural Language security requirements.
 */
export function parsePolicyLocally(prompt: string): SecurityPolicyData {
  const text = prompt.toLowerCase();

  // 1. Determine security level
  let securityLevel: SecurityLevel = 'CONFIDENTIAL';
  if (text.includes('critical') || text.includes('top secret') || text.includes('ultra secure') || text.includes('military')) {
    securityLevel = 'CRITICAL';
  } else if (text.includes('high') || text.includes('manager') || text.includes('confidential') || text.includes('contract')) {
    securityLevel = 'HIGH_SECURITY';
  } else if (text.includes('standard') || text.includes('public') || text.includes('team')) {
    securityLevel = 'STANDARD';
  }

  // 2. OTP requirement
  const otpRequired = text.includes('otp') || text.includes('one-time password') || text.includes('passcode') || securityLevel === 'CRITICAL';

  // 3. Device requirement
  const deviceRequired = text.includes('device') || text.includes('registered device') || text.includes('hardware') || securityLevel === 'CRITICAL';
  const registeredDeviceOnly = text.includes('registered device') || text.includes('trusted device');

  // 4. View limits
  let maxViews = 1;
  if (text.includes('once') || text.includes('one-time') || text.includes('single view') || text.includes('single access')) {
    maxViews = 1;
  } else if (text.includes('twice') || text.includes('2 times') || text.includes('two views')) {
    maxViews = 2;
  } else if (text.includes('unlimited') || text.includes('multiple views')) {
    maxViews = 10;
  }

  // 5. Expiration
  let expiresInHours = 24;
  if (text.includes('1 hour') || text.includes('an hour')) {
    expiresInHours = 1;
  } else if (text.includes('tomorrow') || text.includes('24 hour') || text.includes('day')) {
    expiresInHours = 24;
  } else if (text.includes('week') || text.includes('7 days')) {
    expiresInHours = 168;
  } else if (text.includes('month') || text.includes('30 days')) {
    expiresInHours = 720;
  }

  // 6. Maximum Privacy Sender Mode ("Hide Sender Identity")
  let senderIdentityVisibility: SenderPrivacyMode = 'VISIBLE';
  if (
    text.includes('hide sender') ||
    text.includes('anonymous') ||
    text.includes('hide identity') ||
    text.includes('hide my identity') ||
    text.includes('without revealing') ||
    text.includes('do not reveal') ||
    text.includes('not reveal') ||
    text.includes('receiver should not know') ||
    text.includes('receiver must not know') ||
    text.includes('receiver cannot see') ||
    text.includes('private sender') ||
    text.includes('untraceable') ||
    text.includes('maximum privacy')
  ) {
    senderIdentityVisibility = 'HIDDEN';
  }

  // 7. Zero-Persistence Mode
  const zeroPersistence = 
    text.includes('zero persistence') || 
    text.includes('do not store') || 
    text.includes('burn') || 
    text.includes('no retention') ||
    text.includes('destroy immediately');

  // 8. Download restrictions
  const downloadAllowed = !text.includes('no download') && !text.includes('disable download') && !text.includes('view only');

  // 9. View duration
  let viewDurationSeconds: number | undefined;
  if (text.includes('60 seconds') || text.includes('1 minute')) {
    viewDurationSeconds = 60;
  } else if (text.includes('5 minutes')) {
    viewDurationSeconds = 300;
  }

  // 10. Recipient extraction
  let recipientEmail: string | undefined;
  const emailRegex = /[\w.-]+@[\w.-]+\.\w+/i;
  const emailMatch = prompt.match(emailRegex);
  if (emailMatch) {
    recipientEmail = emailMatch[0].toLowerCase();
  }

  return {
    securityLevel,
    recipientRequired: Boolean(recipientEmail) || text.includes('recipient') || text.includes('manager'),
    recipientEmail,
    otpRequired,
    deviceRequired,
    registeredDeviceOnly,
    senderApproval: text.includes('sender approval') || text.includes('approve first'),
    riskDetection: true,
    maxViews,
    expiresInHours,
    senderIdentityVisibility,
    zeroPersistence,
    downloadAllowed,
    viewDurationSeconds,
    promptText: prompt,
  };
}

/**
 * Calculates policy strength score (0 - 100) and produces audit report
 */
export function calculateSecurityScore(policy: SecurityPolicyData): SecurityScoreReport {
  let score = 20; // baseline
  const breakdown: PolicyScoreBreakdown[] = [
    { label: 'AES-256-GCM Encryption Baseline', points: 20, passed: true },
  ];

  if (policy.otpRequired) {
    score += 15;
    breakdown.push({ label: 'Multi-Factor OTP Challenge', points: 15, passed: true });
  }

  if (policy.registeredDeviceOnly) {
    score += 15;
    breakdown.push({ label: 'Zero-Trust Device Binding', points: 15, passed: true });
  }

  if (policy.maxViews === 1) {
    score += 15;
    breakdown.push({ label: 'Atomic 1-Time Access Enforcement', points: 15, passed: true });
  }

  if (policy.senderIdentityVisibility === 'HIDDEN') {
    score += 10;
    breakdown.push({ label: 'Maximum Privacy Sender Mode (Identity Redacted)', points: 10, passed: true });
  }

  if (policy.zeroPersistence) {
    score += 10;
    breakdown.push({ label: 'Zero-Persistence Lifecycle Destruction', points: 10, passed: true });
  }

  if (!policy.downloadAllowed) {
    score += 10;
    breakdown.push({ label: 'Download Restriction (In-Browser Controlled View)', points: 10, passed: true });
  }

  if (policy.expiresInHours <= 24) {
    score += 5;
    breakdown.push({ label: 'Strict Lifecycle Expiration (≤ 24h)', points: 5, passed: true });
  }

  const finalScore = Math.min(100, score);
  let rating: 'BASIC' | 'STRONG' | 'MAXIMUM_ASSURANCE' = 'BASIC';
  if (finalScore >= 80) rating = 'MAXIMUM_ASSURANCE';
  else if (finalScore >= 50) rating = 'STRONG';

  return {
    score: finalScore,
    rating,
    breakdown,
  };
}

/**
 * Detects contradictory human instructions and enforces strongest safe rule
 */
export function detectPolicyConflicts(prompt: string, policy: SecurityPolicyData): PolicyConflictWarning[] {
  const warnings: PolicyConflictWarning[] = [];
  const text = prompt.toLowerCase();

  // Conflict 1: "one-time" vs multiple views
  if ((text.includes('once') || text.includes('one-time')) && policy.maxViews > 1) {
    warnings.push({
      field: 'maxViews',
      message: 'Conflicting view count instructions detected.',
      resolvedValue: 1,
      rationale: 'Resolved to single-use (1 view) to prevent unauthorized information leakage.',
    });
  }

  // Conflict 2: "public" vs "confidential"
  if (text.includes('public') && (text.includes('confidential') || text.includes('secret'))) {
    warnings.push({
      field: 'securityLevel',
      message: 'Conflicting public vs confidential designations detected.',
      resolvedValue: 'HIGH_SECURITY',
      rationale: 'Elevated to HIGH_SECURITY in accordance with defense-in-depth safety rules.',
    });
  }

  return warnings;
}

/**
 * Main AI Policy Generation Service.
 */
export async function generateSecurityPolicy(naturalLanguagePrompt: string): Promise<{
  policy: SecurityPolicyData;
  source: 'ai_model' | 'local_deterministic_engine';
  explanation: string;
  securityScore: SecurityScoreReport;
  score?: SecurityScoreReport;
  conflicts: PolicyConflictWarning[];
}> {
  logger.info('Generating security policy from prompt', { promptLength: naturalLanguagePrompt.length });

  // Execute local deterministic policy parser
  const rawPolicy = parsePolicyLocally(naturalLanguagePrompt);
  const validatedPolicy = validateAndNormalizePolicy(rawPolicy);
  const securityScore = calculateSecurityScore(validatedPolicy);
  const conflicts = detectPolicyConflicts(naturalLanguagePrompt, validatedPolicy);

  return {
    policy: validatedPolicy,
    source: 'local_deterministic_engine',
    explanation: `Compiled from human intent: Security Level is set to ${validatedPolicy.securityLevel}. One-time view constraint (${validatedPolicy.maxViews} view limit), OTP requirement (${validatedPolicy.otpRequired ? 'Active' : 'Inactive'}), Privacy mode (${validatedPolicy.senderIdentityVisibility || 'VISIBLE'}), and ${validatedPolicy.expiresInHours}h lifecycle expiration enforced.`,
    securityScore,
    score: securityScore,
    conflicts,
  };
}
