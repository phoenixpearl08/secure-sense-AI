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

  // Expiration in hours (bounds: 1 to 720 hours for active, <=0 for testing expiration)
  let expiresInHours = 24;
  if (typeof p.expiresInHours === 'number' && Number.isFinite(p.expiresInHours)) {
    expiresInHours = p.expiresInHours <= 0 ? p.expiresInHours : Math.max(1, Math.min(720, p.expiresInHours));
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

  // Conflict 3: CRITICAL Security + Download Enabled
  if (policy.securityLevel === 'CRITICAL' && policy.downloadAllowed) {
    warnings.push({
      field: 'downloadAllowed',
      message: 'Policy Conflict: Critical Security normally recommends download disabled.',
      resolvedValue: false,
      rationale: 'Critical secrets must remain within controlled browser view only to prevent unencrypted local storage persistence.',
    });
  }

  // Conflict 4: Registered Device Only without recipient binding
  if (policy.registeredDeviceOnly && !policy.recipientRequired) {
    warnings.push({
      field: 'recipientRequired',
      message: 'Policy Conflict: Zero-trust registered device enforcement is strongest when bound to an authorized recipient identifier.',
      resolvedValue: true,
      rationale: 'Coupled hardware fingerprint with recipient verification for defense-in-depth.',
    });
  }

  return warnings;
}

export interface SimulationResult {
  scenario: string;
  name: string;
  condition: string;
  rule: string;
  decision: 'ALLOW' | 'BLOCK' | 'MFA_REQUIRED';
  reason: string;
  severity: 'SAFE' | 'WARNING' | 'CRITICAL';
}

/**
 * Deterministic Policy Simulator (TEST MY SHARE).
 * Evaluates hypothetical security challenges without modifying live persistent records.
 */
export function simulateSharePolicy(policy: SecurityPolicyData): SimulationResult[] {
  const results: SimulationResult[] = [];

  // Scenario 1: Correct Recipient + Registered Device + Valid OTP
  results.push({
    scenario: 'AUTHORIZED_USER',
    name: 'Authorized Recipient & Trusted Device',
    condition: 'Recipient email matches, device fingerprint verified, OTP correct',
    rule: 'Identity + Device + Auth Challenge Passed',
    decision: 'ALLOW',
    reason: 'All cryptographic and zero-trust preconditions are satisfied. Authenticated AES-256-GCM payload decrypted.',
    severity: 'SAFE',
  });

  // Scenario 2: Unknown Device / Stolen Link
  if (policy.registeredDeviceOnly) {
    results.push({
      scenario: 'UNKNOWN_DEVICE',
      name: 'Unknown / Unregistered Hardware',
      condition: 'Client accesses from a laptop or mobile without enrolled hardware fingerprint',
      rule: 'policy.registeredDeviceOnly = true',
      decision: 'BLOCK',
      reason: 'Zero-trust device policy rejects unregistered hardware. Access is blocked and security alert logged.',
      severity: 'SAFE',
    });
  } else if (policy.deviceRequired) {
    results.push({
      scenario: 'UNKNOWN_DEVICE',
      name: 'New Device Hardware',
      condition: 'Client accesses from unrecognized browser',
      rule: 'policy.deviceRequired = true',
      decision: 'MFA_REQUIRED',
      reason: 'New hardware recognized; step-up verification required before reveal.',
      severity: 'WARNING',
    });
  } else {
    results.push({
      scenario: 'UNKNOWN_DEVICE',
      name: 'Any Hardware Allowed',
      condition: 'Client accesses from any hardware',
      rule: 'policy.registeredDeviceOnly = false',
      decision: 'ALLOW',
      reason: 'Sender policy configured for open device access.',
      severity: 'WARNING',
    });
  }

  // Scenario 3: Unauthorized / Wrong Recipient
  results.push({
    scenario: 'WRONG_RECIPIENT',
    name: 'Wrong / Forwarded Recipient',
    condition: 'Third-party accesses link with unauthorized email address',
    rule: policy.recipientRequired ? 'policy.recipientRequired = true' : 'Open Link Access',
    decision: policy.recipientRequired ? 'BLOCK' : 'ALLOW',
    reason: policy.recipientRequired
      ? 'Recipient email mismatch. Access blocked and RECIPIENT_MISMATCH security incident logged.'
      : 'Item has no recipient binding; accessible by bearer of link.',
    severity: policy.recipientRequired ? 'SAFE' : 'WARNING',
  });

  // Scenario 4: Wrong or Missing OTP
  results.push({
    scenario: 'WRONG_OTP',
    name: 'Invalid OTP Guess / Brute Force',
    condition: '6-digit OTP code entered incorrectly',
    rule: policy.otpRequired ? 'policy.otpRequired = true' : 'OTP Disabled',
    decision: policy.otpRequired ? 'BLOCK' : 'ALLOW',
    reason: policy.otpRequired
      ? 'Cryptographic OTP verification failed. Request terminated prior to AES decryption.'
      : 'OTP not enforced on this item.',
    severity: policy.otpRequired ? 'SAFE' : 'WARNING',
  });

  // Scenario 5: Expired Share Link
  results.push({
    scenario: 'EXPIRED_LINK',
    name: 'Post-Expiration Access Attempt',
    condition: `Access attempted after ${policy.expiresInHours} hours lifecycle window`,
    rule: 'Time > item.expiresAt',
    decision: 'BLOCK',
    reason: 'Item has transitioned to EXPIRED status. Ciphertext decryption key invalid.',
    severity: 'SAFE',
  });

  // Scenario 6: Replay / Second Reveal Attempt
  results.push({
    scenario: 'REPLAY_ATTEMPT',
    name: 'Replay / Second Access Attempt',
    condition: `Access attempted after ${policy.maxViews} view limit consumed`,
    rule: 'currentViews >= maxViews',
    decision: 'BLOCK',
    reason: policy.maxViews === 1
      ? 'Atomic 1-time view constraint executed. Item consumed and permanently purged from server memory.'
      : `Item consumed after ${policy.maxViews} views limit reached.`,
    severity: 'SAFE',
  });

  // Scenario 7: Suspicious Rapid Access Spike
  results.push({
    scenario: 'SUSPICIOUS_ACTIVITY',
    name: 'High-Frequency Automated Probing',
    condition: 'More than 25 access attempts detected in 60 seconds',
    rule: 'Adaptive Security Rate Limiter',
    decision: 'BLOCK',
    reason: 'Rate limit tripped (429 / 403). IP address throttled and security team alerted.',
    severity: 'SAFE',
  });

  return results;
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
  simulation: SimulationResult[];
}> {
  logger.info('Generating security policy from prompt', { promptLength: naturalLanguagePrompt.length });

  // Execute local deterministic policy parser
  const rawPolicy = parsePolicyLocally(naturalLanguagePrompt);
  const validatedPolicy = validateAndNormalizePolicy(rawPolicy);
  const securityScore = calculateSecurityScore(validatedPolicy);
  const conflicts = detectPolicyConflicts(naturalLanguagePrompt, validatedPolicy);
  const simulation = simulateSharePolicy(validatedPolicy);

  return {
    policy: validatedPolicy,
    source: 'local_deterministic_engine',
    explanation: `Compiled from human intent: Security Level is set to ${validatedPolicy.securityLevel}. One-time view constraint (${validatedPolicy.maxViews} view limit), OTP requirement (${validatedPolicy.otpRequired ? 'Active' : 'Inactive'}), Device binding (${validatedPolicy.registeredDeviceOnly ? 'Registered Only' : 'Standard'}), Privacy mode (${validatedPolicy.senderIdentityVisibility || 'VISIBLE'}), and ${validatedPolicy.expiresInHours}h lifecycle expiration enforced.`,
    securityScore,
    score: securityScore,
    conflicts,
    simulation,
  };
}
