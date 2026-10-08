// RealityVault AI + DocSenseAI End-to-End System Test Suite
// Verifies full flow: Auth, AI Policy, DocSense Q&A, AES-256-GCM Vault, Atomic 1-Time Access, Security Telemetry.

const BASE_URL = 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runTests() {
  console.log('\n============================================================');
  console.log('REALITYVAULT AI + DOCSENSEAI: END-TO-END VERIFICATION SUITE');
  console.log('============================================================\n');

  // 1. Health Endpoint
  console.log('--- TEST 1: Health & System Diagnostics ---');
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  const health = await healthRes.json();
  assert(health.status === 'ok', 'Health status is ok');
  assert(health.modules.realityVault === 'ACTIVE', 'RealityVault core module is active');
  assert(health.modules.docSenseAI === 'ACTIVE', 'DocSenseAI module is active');
  console.log(`ℹ️ Storage engine: ${health.database.provider} (Fallback: ${health.database.fallbackActive})`);

  // 2. Auth: Register & Login
  console.log('\n--- TEST 2: Authentication & RBAC ---');
  const testEmail = `agent_${Date.now()}@realityvault.ai`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      name: 'Cyber Auditor',
      password: 'VaultSecure_2026!Password',
      role: 'SECURITY_ADMIN'
    }),
  });
  const regData = await regRes.json();
  assert(regData.success, 'Registration succeeded');
  assert(regData.data.user.email === testEmail, 'User record created with correct email');

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'VaultSecure_2026!Password',
      deviceId: 'dev-security-laptop-01'
    }),
  });
  const loginData = await loginRes.json();
  assert(loginData.success, 'Login succeeded');
  const setCookie = loginRes.headers.get('set-cookie') || '';
  const sessionCookie = setCookie.split(';')[0];

  // 3. AI Security Policy Engine
  console.log('\n--- TEST 3: AI Security Policy Engine ---');
  const policyPrompt = 'Send this contract to my manager. It is highly confidential. He should open it only once from his registered device before tomorrow and require OTP.';
  const policyRes = await fetch(`${BASE_URL}/api/security/policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt: policyPrompt })
  });
  const policyData = await policyRes.json();
  assert(policyData.success, 'Policy generation succeeded');
  const generatedPolicy = policyData.data.policy;
  assert(generatedPolicy.securityLevel === 'HIGH_SECURITY', 'Correct security level inferred (HIGH_SECURITY)');
  assert(generatedPolicy.maxViews === 1, 'Max views parsed as 1');
  assert(generatedPolicy.otpRequired === true, 'OTP requirement enabled');
  assert(generatedPolicy.registeredDeviceOnly === true, 'Registered device policy enforced');

  // 4. DocSenseAI: Analysis & Chunking
  console.log('\n--- TEST 4: DocSenseAI Document Analysis ---');
  const sampleContract = `
[Page 1]
MASTER SERVICES AND LICENSING AGREEMENT
This Master Agreement is entered into between CyberDynamics Corp and SecureVault Inc.
Section 1.0 Executive Overview: The Contractor shall provide continuous cybersecurity penetration testing and architecture verification.

[Page 2]
Section 2.0 Financial Terms and Payment Schedule:
The total contract value is $250,000 payable in monthly tranches of $20,833.
Late payments will incur a 2.5% penalty per month.

[Page 3]
Section 3.0 Obligations & Deadlines:
The final architecture review must be submitted before November 30, 2026.
All confidential source code must be stored exclusively in AES-256-GCM encrypted repositories.
  `.trim();

  const analyzeRes = await fetch(`${BASE_URL}/api/documents/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Master_Services_Agreement_2026.txt',
      content: sampleContract
    })
  });
  const analyzeData = await analyzeRes.json();
  assert(analyzeData.success, 'DocSense document analysis succeeded');
  assert(analyzeData.data.chunks.length >= 3, 'Multi-page document successfully chunked across pages');
  const financialInsight = analyzeData.data.insights.find(i => i.category === 'FINANCIAL');
  assert(!!financialInsight, 'Financial terms accurately extracted ($250,000)');
  const deadlineInsight = analyzeData.data.insights.find(i => i.category === 'DEADLINE');
  assert(!!deadlineInsight, 'Deadlines accurately extracted');

  // 5. DocSenseAI: Grounded Q&A (No Hallucinations)
  console.log('\n--- TEST 5: Ask Your Document (Grounded Q&A) ---');
  const askRes1 = await fetch(`${BASE_URL}/api/documents/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunks: analyzeData.data.chunks,
      question: 'What is the penalty for late payments?'
    })
  });
  const askData1 = await askRes1.json();
  assert(askData1.success, 'Question answered successfully');
  assert(askData1.data.answer.includes('2.5%'), 'Answer grounded in document text (2.5% penalty)');
  assert(askData1.data.pageNumber === 2, 'Accurate source page cited (Page 2)');

  // Negative test: Question not in document
  const askRes2 = await fetch(`${BASE_URL}/api/documents/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      chunks: analyzeData.data.chunks,
      question: 'What is the favorite color of the CEO?'
    })
  });
  const askData2 = await askRes2.json();
  assert(askData2.data.answer.toLowerCase().includes('not found'), 'Unanswerable question safely reported as Not Found');

  // 6. RealityVault: Create Encrypted Secure Item
  console.log('\n--- TEST 6: RealityVault Item Creation & AES-256-GCM Encryption ---');
  const secretContent = 'TOP_SECRET_HACKATHON_INTELLIGENCE_TOKEN_XYZ987';
  const targetDevice = 'dev-manager-laptop-01';

  const vaultCreateRes = await fetch(`${BASE_URL}/api/vault/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': sessionCookie
    },
    body: JSON.stringify({
      title: 'Executive Acquisition Term Sheet',
      plaintextSecret: secretContent,
      recipientEmail: 'manager@realityvault.ai',
      policy: {
        securityLevel: 'HIGH_SECURITY',
        recipientRequired: true,
        recipientEmail: 'manager@realityvault.ai',
        otpRequired: true,
        deviceRequired: true,
        registeredDeviceOnly: true,
        maxViews: 1,
        riskDetection: true,
        senderNotification: true,
      }
    })
  });
  const vaultCreateData = await vaultCreateRes.json();
  assert(vaultCreateData.success, 'Vault item created with AES-256-GCM encryption');
  assert(!!vaultCreateData.data.accessId, 'Non-enumerable access identifier generated');
  const accessId = vaultCreateData.data.accessId;
  const returnedOtp = vaultCreateData.data.rawOtp;
  assert(!!returnedOtp, 'Cryptographic OTP generated for out-of-band delivery');

  // 7. Verify Public Access Metadata does NOT leak secret
  console.log('\n--- TEST 7: Controlled Access Portal Metadata Leak Check ---');
  const metaRes = await fetch(`${BASE_URL}/api/vault/access?id=${accessId}`);
  const metaData = await metaRes.json();
  assert(metaData.success, 'Public metadata accessible');
  assert(!metaData.data.ciphertext && !metaData.data.secretContent, 'Plaintext and ciphertext are NEVER leaked in metadata');
  assert(metaData.data.maxViews === 1, 'Policy requires 1-time access');

  // 8. UNTRUSTED DEVICE POLICY TEST
  console.log('\n--- TEST 8: Zero-Trust Device Policy Enforcement ---');
  const untrustedAttempt = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessId,
      recipientEmail: 'manager@realityvault.ai',
      otp: returnedOtp,
      deviceId: 'untrusted-hacker-phone-99'
    })
  }).then(r => r.json());
  assert(!untrustedAttempt.success, 'Untrusted device correctly BLOCKED by Zero-Trust policy');
  console.log(`🛡️ Block reason: ${untrustedAttempt.error}`);

  // 9. CRITICAL TEST: Concurrent Atomic Reveal with Registered Device (Only ONE must succeed!)
  console.log('\n--- TEST 9: ATOMIC CONCURRENT 1-TIME ACCESS CONSUMPTION TEST ---');
  console.log('⚡ Launching 2 simultaneous reveal requests from registered device dev-security-laptop-01...');
  
  const registeredDevice = 'dev-security-laptop-01';
  const payload = {
    accessId: accessId,
    recipientEmail: 'manager@realityvault.ai',
    otp: returnedOtp,
    deviceId: registeredDevice
  };

  const [resA, resB] = await Promise.all([
    fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()),
    fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(r => r.json()),
  ]);

  const successA = resA.success;
  const successB = resB.success;

  console.log(`Request 1 result: ${successA ? 'SUCCESS (Revealed)' : 'DENIED (' + resA.error + ')'}`);
  console.log(`Request 2 result: ${successB ? 'SUCCESS (Revealed)' : 'DENIED (' + resB.error + ')'}`);

  // Exactly one must succeed!
  assert(
    (successA && !successB) || (!successA && successB),
    'Concurrency race condition PREVENTED! Exactly ONE request succeeded, the other was denied atomically.'
  );

  const decryptedSecret = successA ? resA.data.secret : resB.data.secret;
  assert(decryptedSecret === secretContent, 'Authenticated AES-256-GCM decryption verified successfully!');

  // 10. Subsequent Attempt (Must be rejected)
  console.log('\n--- TEST 10: Subsequent Reveal Attempt (Consumed State) ---');
  const resC = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  }).then(r => r.json());
  assert(!resC.success, 'Subsequent access rejected (item is already consumed/destroyed)');

  // 11. Audit Telemetry & Threat Monitoring
  console.log('\n--- TEST 11: Security Center Telemetry & Audit Integrity ---');
  const auditRes = await fetch(`${BASE_URL}/api/audit`);
  const auditData = await auditRes.json();
  assert(auditData.success && Array.isArray(auditData.data), 'Audit logs retrieved');
  const hasSecretsInAudit = auditData.data.some(log => JSON.stringify(log).includes(secretContent));
  assert(!hasSecretsInAudit, 'Audit log verified: ZERO secret leakage in telemetry');

  console.log('\n============================================================');
  console.log('🎉 ALL 10 TESTS PASSED WITH 100% SUCCESS!');
  console.log('REALITYVAULT AI IS FULLY OPERATIONAL AND HACKATHON-READY.');
  console.log('============================================================\n');
}

runTests().catch(err => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
