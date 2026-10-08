// RealityVault AI + DocSenseAI Type Definitions

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SECURITY_ADMIN' | 'USER';

export type SecurityLevel = 'STANDARD' | 'CONFIDENTIAL' | 'HIGH_SECURITY' | 'CRITICAL' | 'CUSTOM_AI';

export type VaultItemStatus = 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REVOKED' | 'DESTROYED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AccessStatus = 'GRANTED' | 'DENIED' | 'CHALLENGED' | 'CONSUMED';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  organizationId?: string;
  createdAt: string;
}

export interface Device {
  id: string;
  userId: string;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  trusted: boolean;
  lastSeen: string;
}

// ==========================================
// REALITYVAULT
// ==========================================

export interface SecurityPolicyData {
  securityLevel: SecurityLevel;
  recipientRequired: boolean;
  recipientEmail?: string;
  otpRequired: boolean;
  otpCode?: string; // Stored securely/hashed on server
  deviceRequired: boolean;
  registeredDeviceOnly: boolean;
  senderApproval: boolean;
  riskDetection: boolean;
  maxViews: number;
  expiresInHours: number;
  promptText?: string;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
}

export interface VaultItem {
  id: string;
  accessId: string;
  title: string;
  recipientEmail?: string;
  creatorId: string;
  creatorName?: string;
  encryptedPayload: EncryptedPayload;
  securityLevel: SecurityLevel;
  status: VaultItemStatus;
  maxViews: number;
  currentViews: number;
  expiresAt?: string;
  consumedAt?: string;
  revokedAt?: string;
  destroyedAt?: string;
  policy: SecurityPolicyData;
  documentId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessAttempt {
  id: string;
  vaultItemId: string;
  deviceId?: string;
  ipAddress?: string;
  userAgent?: string;
  status: AccessStatus;
  reason?: string;
  riskLevel: RiskLevel;
  attemptedAt: string;
}

export interface SecurityEvent {
  id: string;
  vaultItemId?: string;
  eventType: string;
  riskLevel: RiskLevel;
  details: string;
  resolved: boolean;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string;
  userEmail?: string;
  action: string;
  entityType: string;
  entityId?: string;
  ipAddress?: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

// ==========================================
// DOCSENSEAI
// ==========================================

export interface DocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  pageNumber: number;
  content: string;
}

export interface DocumentInsight {
  id: string;
  documentId: string;
  category: 'SUMMARY' | 'DEADLINE' | 'OBLIGATION' | 'FINANCIAL' | 'ENTITY' | 'ANOMALY' | 'RISK';
  title: string;
  description: string;
  pageNumber?: number;
  sectionRef?: string;
  confidence: number;
}

export interface DocumentData {
  id: string;
  title: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  extractedText: string;
  pageCount: number;
  userId: string;
  chunks: DocumentChunk[];
  insights: DocumentInsight[];
  createdAt: string;
}

export interface AskAnswer {
  question: string;
  answer: string;
  grounded: boolean;
  pageNumber?: number;
  sectionRef?: string;
  confidence: number;
  relevantExcerpt?: string;
}

// ==========================================
// SECURE MEETINGS
// ==========================================

export interface MeetingParticipant {
  id: string;
  meetingId: string;
  email: string;
  name: string;
  role: string;
  verified: boolean;
  joinedAt?: string;
}

export interface Meeting {
  id: string;
  title: string;
  scheduledFor: string;
  hostId: string;
  hostName: string;
  securityLock: boolean;
  status: 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED';
  participants: MeetingParticipant[];
  enforceDevice: boolean;
  enforceOtp: boolean;
  allowRecording: boolean;
  attachedDocumentIds?: string[];
  createdAt: string;
}

// ==========================================
// API GENERIC
// ==========================================

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  code?: string;
  meta?: Record<string, unknown>;
}
