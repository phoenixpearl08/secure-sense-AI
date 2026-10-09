// RealityVault AI + DocSenseAI Complete Enterprise Type Definitions

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'SECURITY_ADMIN' | 'USER';

export type SecurityLevel = 'STANDARD' | 'CONFIDENTIAL' | 'HIGH_SECURITY' | 'CRITICAL' | 'CUSTOM_AI';

export type VaultItemStatus = 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REVOKED' | 'DESTROYED' | 'LOCKED';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type AccessStatus = 'GRANTED' | 'DENIED' | 'CHALLENGED' | 'CONSUMED' | 'LOCKED';

export type DeliveryMethod = 'SECURE_LINK' | 'QR_CODE' | 'DIRECT_TRANSFER' | 'MEETING_SHARE' | 'EMAIL' | 'MESSAGING';

export type SenderPrivacyMode = 'VISIBLE' | 'HIDDEN';

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
// REALITYVAULT CORE & POLICIES
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
  
  // Advanced Privacy & Controls
  senderIdentityVisibility?: SenderPrivacyMode; // 'VISIBLE' | 'HIDDEN' (Maximum Privacy Sender Mode)
  zeroPersistence?: boolean; // No persistent storage after lifecycle
  downloadAllowed?: boolean; // If false, in-browser controlled view only
  viewDurationSeconds?: number; // Timed access window (e.g. 60s)
  deliveryMethod?: DeliveryMethod;
  // Sender Customization & Advanced Recipient Permissions
  allowComments?: boolean;
  allowAnnotations?: boolean;
  allowAiAnalysis?: boolean;
  allowAiExport?: boolean;
  allowPrint?: boolean;
  allowCopyText?: boolean;
  customBranding?: {
    logoUrl?: string;
    accentColor?: string;
    companyName?: string;
    welcomeMessage?: string;
    completionMessage?: string;
    theme?: 'dark' | 'light' | 'cyber';
    layout?: 'compact' | 'detailed';
  };
  shareTemplate?: string;
  scheduledStartTime?: string;
  notifyOnView?: boolean;
  notifyOnDownload?: boolean;
  notifyOnExpiry?: boolean;
}

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
  algorithm: string;
  fileHash?: string; // SHA-256 integrity hash for files/payloads
  fileName?: string;
  mimeType?: string;
  fileSize?: number;
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
  isEphemeral?: boolean;
  createdAt: string;
  updatedAt: string;
  comments?: Array<{ id: string; authorEmail: string; text: string; createdAt: string; pageNumber?: number }>;
  extensionRequests?: Array<{ id: string; requesterEmail: string; reason: string; requestedHours: number; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string }>;
  downloadRequests?: Array<{ id: string; requesterEmail: string; reason: string; status: 'PENDING' | 'APPROVED' | 'REJECTED'; createdAt: string }>;
  acknowledgments?: Array<{ userEmail: string; timestamp: string }>;
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
// REAL OTP DELIVERY PROVIDERS
// ==========================================

export type OtpProviderType = 'DEV' | 'SMTP' | 'TWILIO_SMS';

export interface OtpDeliveryRequest {
  target: string; // Email or phone number
  code: string;
  itemTitle: string;
  expiresInMinutes: number;
}

export interface OtpDeliveryResult {
  success: boolean;
  provider: OtpProviderType;
  maskedTarget: string;
  messageId?: string;
  error?: string;
  devCode?: string; // Present ONLY in non-production/DEV mode
}

// ==========================================
// EPHEMERAL REAL-TIME TRANSFERS
// ==========================================

export type TransferState = 
  | 'INITIALIZING' 
  | 'WAITING_RECEIVER' 
  | 'TRANSFERRING' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'EXPIRED' 
  | 'CLEANED_UP';

export interface TransferSession {
  id: string;
  sessionToken: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  fileHash: string;
  senderId: string;
  senderName: string;
  receiverEmail?: string;
  state: TransferState;
  otpCodeHash?: string;
  totalChunks: number;
  transferredChunks: number;
  zeroPersistence: boolean;
  expiresAt: string;
  createdAt: string;
  completedAt?: string;
  payloadBuffer?: string; // Ephemeral in-memory buffer, destroyed upon completion
}

// ==========================================
// DOCSENSEAI & OCR
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

export interface DocumentSecurityClassification {
  sensitivity: RiskLevel; // 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  recommendedSecurityLevel: SecurityLevel;
  riskScore: number;
  riskFactors: string[];
  recommendationExplanation: string;
  // Aliases for unified UI/API binding
  sensitivityLevel?: RiskLevel;
  recommendedVaultPolicy?: SecurityLevel;
  overallRiskScore?: number;
  detectedIndicators?: string[];
  justification?: string;
}

export interface DocumentDeadline {
  id: string;
  title: string;
  dueDate: string;
  category: 'PAYMENT' | 'EXPIRATION' | 'DEPLOYMENT' | 'REVIEW' | 'NOTICE';
  status: 'PENDING' | 'OVERDUE' | 'UPCOMING';
  pageNumber: number;
  sectionRef: string;
  sourceSnippet: string;
}

export interface DocumentObligation {
  id: string;
  responsibleParty: string;
  beneficiary: string;
  action: string;
  deadline?: string;
  penalties?: string;
  pageNumber: number;
  sectionRef: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'AUDITED';
  assignedOwner?: string;
  confidence: number;
}

export interface DocumentFinancialItem {
  id: string;
  item: string;
  amount: string;
  currency: string;
  terms: string;
  isStated: boolean;
  pageNumber: number;
  sectionRef: string;
  snippet: string;
}

export interface DocumentInconsistency {
  id: string;
  category: 'DATE_CONFLICT' | 'AMOUNT_MISMATCH' | 'CONTRADICTORY_CLAUSE' | 'TERMINOLOGY';
  explanation: string;
  citationA: string;
  citationB: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
}

export interface DocumentMissingInfo {
  id: string;
  missingField: string;
  expectedSection: string;
  criticality: 'RECOMMENDED' | 'CRITICAL';
  remedyAction: string;
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
  classification?: DocumentSecurityClassification;
  deadlines?: DocumentDeadline[];
  obligations?: DocumentObligation[];
  financialBreakdown?: DocumentFinancialItem[];
  inconsistencies?: DocumentInconsistency[];
  missingInformation?: DocumentMissingInfo[];
  zeroPersistence?: boolean;
  createdAt: string;
  fileBufferBase64?: string;
  documentType?: 'TEXTBOOK_EDUCATIONAL' | 'LEGAL_CONTRACT' | 'FINANCIAL_INVOICE' | 'POLICY_PROCEDURAL' | 'TECHNICAL_REPORT' | 'GENERAL';
  extractionWarnings?: string[];
  extractionQualityScore?: number;
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
  role: 'HOST' | 'ATTENDEE' | 'GUEST';
  verified: boolean;
  inWaitingRoom?: boolean;
  deviceId?: string;
  joinedAt?: string;
}

export interface MeetingDocumentShare {
  documentId: string;
  title: string;
  sharedBy: string;
  sharedAt: string;
  expiresInMinutes: number;
  downloadAllowed: boolean;
  accessCount: number;
}

export interface Meeting {
  id: string;
  title: string;
  scheduledFor: string;
  hostId: string;
  hostName: string;
  securityLock: boolean;
  status: 'SCHEDULED' | 'ACTIVE' | 'CONCLUDED' | 'LOCKED';
  participants: MeetingParticipant[];
  waitingRoom: MeetingParticipant[];
  enforceDevice: boolean;
  enforceOtp: boolean;
  allowRecording: boolean;
  sharedDocuments: MeetingDocumentShare[];
  attachedDocumentIds?: string[];
  createdAt: string;
}

// ==========================================
// SECURITY SCORING & POLICY CONFLICTS
// ==========================================

export interface PolicyScoreBreakdown {
  label: string;
  points: number;
  passed: boolean;
}

export interface SecurityScoreReport {
  score: number; // 0 - 100
  rating: 'BASIC' | 'STRONG' | 'MAXIMUM_ASSURANCE';
  breakdown: PolicyScoreBreakdown[];
}

export interface PolicyConflictWarning {
  field: string;
  message: string;
  resolvedValue: unknown;
  rationale: string;
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
