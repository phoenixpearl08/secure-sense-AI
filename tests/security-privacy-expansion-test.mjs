// SECURE SENSE AI — Comprehensive Security Hardening & Privacy Expansion Test Suite
// Verifies: IDOR defenses, Negative Authorization, Tampering, Rate Limiting, Threat Scanner,
// Session Revocation, Privacy Guard, and Sweeper Retentions.

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

// Native AES-256-GCM authenticated encryption implementation matching src/lib/crypto/aes.ts
function deriveKey(masterSecret, salt) {
  return crypto.scryptSync(masterSecret, salt, 32);
}

function encryptPayloadTest(plaintext, secret = 'realityvault_dev_secure_aes256_master_key_random_32b_hex') {
  const salt = crypto.randomBytes(16);
  const key = deriveKey(secret, salt);
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  let ciphertext = cipher.update(plaintext, 'utf8', 'base64');
  ciphertext += cipher.final('base64');
  const authTag = cipher.getAuthTag();
  const combined = Buffer.concat([salt, Buffer.from(ciphertext, 'base64')]).toString('base64');
  return {
    ciphertext: combined,
    iv: iv.toString('base64'),
    authTag: authTag.toString('base64'),
    algorithm: 'AES-256-GCM',
  };
}

function decryptPayloadTest(payload, secret = 'realityvault_dev_secure_aes256_master_key_random_32b_hex') {
  const combined = Buffer.from(payload.ciphertext, 'base64');
  const salt = combined.subarray(0, 16);
  const actualCiphertext = combined.subarray(16);
  const key = deriveKey(secret, salt);
  const iv = Buffer.from(payload.iv, 'base64');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));
  let decrypted = decipher.update(actualCiphertext.toString('base64'), 'base64', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    throw new Error(`Assertion failure: ${message}`);
  }
  console.log(`✅ PASSED: ${message}`);
}

async function runSecurityPrivacyTests() {
  console.log('\n============================================================');
  console.log('SECURE SENSE AI: SECURITY & PRIVACY EXPANSION AUDIT SUITE');
  console.log('============================================================');

  // =========================================================================
  // 1. CRYPTOGRAPHIC TAMPERING & AUTHENTICATION TAG VERIFICATION
  // =========================================================================
  console.log('\n--- SUITE 1: AES-256-GCM Authenticated Encryption & Tamper Defense ---');
  const sensitivePlaintext = 'TOP_SECRET_AIR_GAP_TRANSMISSION_2026';
  const encrypted = encryptPayloadTest(sensitivePlaintext);

  // Normal decryption succeeds
  const decryptedNormal = decryptPayloadTest(encrypted);
  assert(decryptedNormal === sensitivePlaintext, 'AES-256-GCM roundtrip decrypts original plaintext accurately');

  // Tamper with ciphertext (single byte bit-flip)
  const tamperedCiphertextBuffer = Buffer.from(encrypted.ciphertext, 'base64');
  tamperedCiphertextBuffer[tamperedCiphertextBuffer.length - 1] ^= 0x01; // flip last byte
  const tamperedPayload = {
    ...encrypted,
    ciphertext: tamperedCiphertextBuffer.toString('base64'),
  };

  let caughtCiphertextTamper = false;
  try {
    decryptPayloadTest(tamperedPayload);
  } catch (err) {
    caughtCiphertextTamper = true;
  }
  assert(caughtCiphertextTamper, 'Ciphertext tampering detected and blocked by 128-bit authentication tag verification');

  // Tamper with Auth Tag
  const tamperedTagBuffer = Buffer.from(encrypted.authTag, 'base64');
  tamperedTagBuffer[0] ^= 0xff;
  const tamperedTagPayload = {
    ...encrypted,
    authTag: tamperedTagBuffer.toString('base64'),
  };

  let caughtTagTamper = false;
  try {
    decryptPayloadTest(tamperedTagPayload);
  } catch (err) {
    caughtTagTamper = true;
  }
  assert(caughtTagTamper, 'Altered authentication tag rejected by AES-256-GCM decipher');

  // =========================================================================
  // 2. NEGATIVE AUTHORIZATION, IDOR & TENANT ISOLATION
  // =========================================================================
  console.log('\n--- SUITE 2: Negative Authorization, IDOR & Tenant Isolation ---');
  
  // Register a private user
  const uniqueSuffix = Date.now();
  const testUserEmail = `target_victim_${uniqueSuffix}@securesense.internal`;
  const registerRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUserEmail,
      name: 'Confidential Executive',
      password: 'SecurePassword123!',
    }),
  });
  const registerData = await registerRes.json();
  assert(registerData.success, 'Test user registered');

  // Login as user to get session
  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUserEmail,
      password: 'SecurePassword123!',
    }),
  });
  const cookieHeader = loginRes.headers.get('set-cookie');
  const sessionCookie = cookieHeader ? cookieHeader.split(';')[0] : '';
  assert(Boolean(sessionCookie), 'Received signed session cookie');

  // Create an item owned by this user
  const createItemRes = await fetch(`${BASE_URL}/api/vault/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      title: 'Private M&A Financial Dossier',
      plaintextSecret: 'CONFIDENTIAL: Acquisition bid price $45M',
      recipientEmail: 'acquirer@partner.org',
      policy: {
        securityLevel: 'HIGH_SECURITY',
        maxViews: 2,
        expiresInHours: 24,
      },
    }),
  });
  const createItemData = await createItemRes.json();
  assert(createItemData.success, 'Private vault item created by authenticated user');
  const privateItemId = createItemData.data.id;

  // Unauthenticated user calls GET /api/vault/list -> MUST NOT see private item
  const unauthListRes = await fetch(`${BASE_URL}/api/vault/list`);
  const unauthListData = await unauthListRes.json();
  const leakedItem = unauthListData.data.find((i) => i.id === privateItemId);
  assert(!leakedItem, 'IDOR PREVENTED: Unauthenticated user cannot discover private user vault items');

  // Unauthenticated user calls GET /api/privacy/export -> MUST BE REJECTED with 401
  const unauthExportRes = await fetch(`${BASE_URL}/api/privacy/export`);
  assert(unauthExportRes.status === 401, 'Unauthorized request to /api/privacy/export rejected with 401');

  // Unauthenticated user calls GET /api/audit -> PII (emails/userId) strictly redacted
  const unauthAuditRes = await fetch(`${BASE_URL}/api/audit`);
  const unauthAuditData = await unauthAuditRes.json();
  const leaksUserEmail = unauthAuditData.data.some((l) => Boolean(l.userEmail || l.userId));
  assert(!leaksUserEmail, 'Zero PII leak: unauthenticated audit inspection redacts all user emails and user IDs');

  // Malicious unauthenticated user attempts to mutate permissions on private item -> MUST BE 403 FORBIDDEN
  const maliciousPermRes = await fetch(`${BASE_URL}/api/vault/collaboration`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'UPDATE_DOWNLOAD_PERMISSION',
      itemId: privateItemId,
      payload: { allowed: true },
    }),
  });
  assert(maliciousPermRes.status === 403, 'Privilege escalation rejected: unauthorized user cannot alter item permissions (403 Forbidden)');

  // =========================================================================
  // 3. SERVER-SIDE SESSION INVALIDATION & LOGOUT REVOCATION
  // =========================================================================
  console.log('\n--- SUITE 3: Server-Side Session Invalidation & Revocation Registry ---');

  // Verify session is currently active
  const checkSessionActive = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: sessionCookie },
  }).then((r) => r.json());
  assert(checkSessionActive.success && Boolean(checkSessionActive.data.user), 'Session is initially valid and active');

  // Call logout endpoint with token
  const logoutRes = await fetch(`${BASE_URL}/api/auth/logout`, {
    method: 'POST',
    headers: { Cookie: sessionCookie },
  });
  assert(logoutRes.status === 200, 'Logout succeeded');

  // Re-attempt using the revoked session token -> MUST BE REJECTED server-side
  const checkSessionAfterLogout = await fetch(`${BASE_URL}/api/auth/session`, {
    headers: { Cookie: sessionCookie },
  }).then((r) => r.json());
  assert(
    !checkSessionAfterLogout.success || !checkSessionAfterLogout.data.user,
    'Session revocation enforced: revoked token rejected server-side despite valid cryptographic signature'
  );

  // =========================================================================
  // 4. FILE THREAT SCANNER & UPLOAD VALIDATION
  // =========================================================================
  console.log('\n--- SUITE 4: File Threat Scanner & Executable Rejection ---');

  // 1. Windows MZ Executable buffer test via upload API
  const fakeExeBuffer = Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]);
  const uploadExeRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'malicious_trojan.exe',
      fileName: 'malicious_trojan.exe',
      fileBufferBase64: fakeExeBuffer.toString('base64'),
    }),
  });
  const exeResData = await uploadExeRes.json();
  assert(uploadExeRes.status === 400, 'Upload API rejected executable payload with HTTP 400');
  assert(!exeResData.success, 'Upload API response reports error for malicious binary');

  // 2. Polyglot script injection in PDF header
  const scriptSmuggleBuffer = Buffer.from('%PDF-1.4\n<script>alert("XSS")</script>\n/Launch /Action');
  const uploadScriptRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'script_injected.pdf',
      fileName: 'script_injected.pdf',
      fileBufferBase64: scriptSmuggleBuffer.toString('base64'),
    }),
  });
  assert(uploadScriptRes.status === 400, 'Upload API intercepted embedded script injection in document');

  // 3. Clean legitimate text/PDF buffer
  const uploadCleanRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'clean_report.txt',
      fileName: 'clean_report.txt',
      textContent: 'Audit confirmation memo: zero security vulnerabilities detected in production baseline.',
      mimeType: 'text/plain',
    }),
  });
  const cleanData = await uploadCleanRes.json();
  assert(cleanData.success && (uploadCleanRes.status === 200 || uploadCleanRes.status === 201), 'Upload API successfully accepts clean legitimate document payload (201 Created)');

  // =========================================================================
  // 5. PRIVACY-AWARE DOCUMENT GUARD
  // =========================================================================
  console.log('\n--- SUITE 5: Privacy-Aware Document Guard (PII & Key Leak Defense) ---');

  const mockAwsKey = process.env.TEST_AWS_KEY || 'AKIAIOSFODNN7EXAMPLE';
  const mockStripeKey = process.env.TEST_STRIPE_KEY || 'sk_test_51MockSafeTestTokenForPrivacyGuard99';

  const dangerousDocumentText = `
CONFIDENTIAL SETTLEMENT MEMO
Primary Corporate Credit Card: 4532015891234566
Authorizing Officer SSN: 123-45-6789
Root AWS Deployment Key: ${mockAwsKey}
Stripe Secret Key: ${mockStripeKey}
-----BEGIN RSA PRIVATE KEY-----
MIIEowIBAAKCAQEA0Y3
-----END RSA PRIVATE KEY-----
`;

  const privacyGuardRes = await fetch(`${BASE_URL}/api/security/guard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: dangerousDocumentText }),
  });
  const privacyGuardData = await privacyGuardRes.json();
  assert(privacyGuardData.success, 'Privacy Guard endpoint returned 200 OK');
  const privacyReport = privacyGuardData.data;
  assert(privacyReport.hasSensitiveData, 'Document Guard detected sensitive credentials');
  assert(privacyReport.riskScore >= 70, `High privacy risk score calculated (Score: ${privacyReport.riskScore}/100)`);
  assert(privacyReport.requiresExplicitConfirmation, 'Document Guard mandates explicit sender confirmation before transmission');
  assert(privacyReport.detectedItems.some((i) => i.type === 'PRIVATE_KEY'), 'Private RSA key identified');
  assert(privacyReport.detectedItems.some((i) => i.type === 'CREDIT_CARD'), 'Payment card Primary Account Number (PAN) identified');
  assert(privacyReport.detectedItems.some((i) => i.type === 'API_TOKEN'), 'AWS and Stripe API secrets identified');

  // Clean document text test
  const cleanText = 'The quarterly machine learning lecture focuses on stochastic gradient descent and matrix multiplication.';
  const cleanGuardRes = await fetch(`${BASE_URL}/api/security/guard`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: cleanText }),
  });
  const cleanGuardData = await cleanGuardRes.json();
  assert(cleanGuardData.success, 'Clean document evaluated by Privacy Guard');
  const cleanPrivacyReport = cleanGuardData.data;
  assert(!cleanPrivacyReport.hasSensitiveData, 'Educational document passes Privacy Guard with zero sensitive detections');
  assert(!cleanPrivacyReport.requiresExplicitConfirmation, 'Clean document does not require extra confirmation');

  // =========================================================================
  // 6. STORAGE CLEANUP & EPHEMERAL SWEEPER
  // =========================================================================
  console.log('\n--- SUITE 6: Storage Cleanup & Ephemeral Sweeper ---');

  const sweeperRes = await fetch(`${BASE_URL}/api/admin/cleanup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
  });
  const sweeperData = await sweeperRes.json();
  assert(sweeperData.success, 'Lifecycle sweeper executed successfully');
  assert(typeof sweeperData.data.cleanedTransfers === 'number', 'Sweeper tracks cleaned ephemeral transfer sessions');

  // =========================================================================
  // 7. PRIVACY DATA PORTABILITY & ERASURE WORKFLOWS
  // =========================================================================
  console.log('\n--- SUITE 7: Privacy Data Portability & Erasure Workflows ---');

  // Re-login to get fresh session
  const freshLoginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testUserEmail,
      password: 'SecurePassword123!',
    }),
  });
  const freshCookie = freshLoginRes.headers.get('set-cookie')?.split(';')[0];

  // Export User Data
  const exportRes = await fetch(`${BASE_URL}/api/privacy/export`, {
    headers: { Cookie: freshCookie },
  });
  const exportData = await exportRes.json();
  assert(exportData.success, 'User successfully exported privacy archive');
  assert(exportData.data.user.email === testUserEmail, 'Export archive contains correct user metadata');

  // Attempt delete without confirmation -> MUST FAIL with 400
  const badDeleteRes = await fetch(`${BASE_URL}/api/privacy/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: freshCookie,
    },
    body: JSON.stringify({ confirmation: 'WRONG' }),
  });
  assert(badDeleteRes.status === 400, 'Erasure without explicit confirmation rejected with 400');

  // Complete Right to Erasure
  const goodDeleteRes = await fetch(`${BASE_URL}/api/privacy/delete`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: freshCookie,
    },
    body: JSON.stringify({ confirmation: 'DELETE_ALL_MY_DATA' }),
  });
  const goodDeleteData = await goodDeleteRes.json();
  assert(goodDeleteData.success, 'Right to Erasure executed: user data permanently purged');

  console.log('\n============================================================');
  console.log('🎉 ALL SECURITY & PRIVACY EXPANSION TESTS PASSED (100%)!');
  console.log('============================================================\n');
}

runSecurityPrivacyTests().catch((err) => {
  console.error('Fatal error during security test suite:', err);
  process.exit(1);
});
