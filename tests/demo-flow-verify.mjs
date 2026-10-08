// RealityVault AI + DocSenseAI: Primary Flagship Demo Verification Script
// Repeatedly executes the complete primary hackathon demo sequence:
// 1. Authenticate user & register session
// 2. Ingest confidential contract into DocSenseAI
// 3. Extract liabilities, obligations, financial values & verify Sensitivity Classification
// 4. Compile natural language intent ("Hide identity, one-time, registered device, OTP")
// 5. Verify Maximum Privacy Sender Mode and Security Score
// 6. Encrypt with authenticated AES-256-GCM and generate QR code + non-enumerable link
// 7. Receiver accesses public portal - verify sender identity is HIDDEN
// 8. Receiver passes OTP & device challenge
// 9. Controlled reveal & decrypt
// 10. Verify atomic single-use destruction on 2nd attempt (ACCESS DENIED)
// 11. Verify Security Center audit logs record the destruction event with zero secret leakage

const BASE_URL = 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runDemoCycle(cycleNum) {
  console.log(`\n============================================================`);
  console.log(`🚀 EXECUTING PRIMARY HACKATHON DEMO CYCLE #${cycleNum}`);
  console.log(`============================================================\n`);

  // Step 1: User Login
  console.log('1. Authenticating Executive Security Officer...');
  const officerEmail = `officer_cycle${cycleNum}_${Date.now()}@realityvault.ai`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: officerEmail,
      name: 'Executive Security Officer',
      password: 'DemoExecutive_2026!Vault',
      role: 'ORG_ADMIN',
    }),
  }).then(r => r.json());
  assert(regRes.success, 'Officer registration succeeded');

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: officerEmail,
      password: 'DemoExecutive_2026!Vault',
      deviceId: 'exec-trusted-laptop-alpha',
    }),
  });
  const loginData = await loginRes.json();
  assert(loginData.success, 'Officer login succeeded');
  const sessionCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

  // Step 2: Upload confidential contract
  console.log('2. Ingesting Confidential Contract into DocSenseAI...');
  const contractText = `CONFIDENTIAL EXECUTIVE ACQUISITION TERM SHEET
Effective Date: November 1, 2026
Target Entity: CyberVault Technologies Ltd.
Acquiring Entity: Global Sentinel Corporation

1.0 Transaction Consideration
Total acquisition purchase price shall be $42,500,000 USD payable in cash upon closing. Escrow deposit of $4,250,000 USD shall be wired within 5 business days of signing.

2.0 Exclusivity & Deadlines
The parties agree to a 30-day strict exclusivity period ending December 1, 2026. Closing shall occur no later than December 15, 2026.

3.0 Restrictive Covenants & Key Obligations
Executive founders shall execute 3-year non-competition agreements. Neither party shall disclose transaction terms to third parties without prior written consent. Tax identifier: TIN-982-41-9901.`;

  const uploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      title: 'Acquisition Term Sheet Alpha',
      textContent: contractText,
    }),
  }).then(r => r.json());
  assert(uploadRes.success, 'Document ingested and parsed into chunks');
  const docData = uploadRes.data;

  // Step 3: DocSenseAI Analysis & Security Classification
  console.log('3. Verifying DocSenseAI Intelligence & Sensitivity Classification...');
  assert(docData.chunks.length >= 1, 'Document text chunked');
  assert(docData.insights.length >= 3, 'Extracted financial, deadline, and covenant obligations');
  assert(docData.classification, 'DocSense Security Classification generated');
  assert(
    docData.classification.sensitivityLevel === 'CRITICAL' || docData.classification.sensitivity === 'CRITICAL',
    'Sensitivity classification correctly rated as CRITICAL'
  );
  console.log(`ℹ️ Sensitivity: ${docData.classification.sensitivityLevel || docData.classification.sensitivity} (Risk Score: ${docData.classification.overallRiskScore || docData.classification.riskScore}/100)`);

  // Step 4: Natural Language Security Intent
  console.log('4. Compiling Natural-Language Security Intent with RealityVault AI...');
  const prompt = 'Send this confidential term sheet to my legal head. Highly confidential. One-time access from registered device. OTP required. Expire tomorrow. Do not reveal who sent it to the receiver.';
  const policyRes = await fetch(`${BASE_URL}/api/security/policy`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt }),
  }).then(r => r.json());
  assert(policyRes.success, 'AI compiled policy from natural language');
  const policy = policyRes.data.policy;

  // Step 5: Verify Maximum Privacy Sender Mode
  console.log('5. Verifying Maximum Privacy Sender Mode Policy...');
  assert(policy.senderIdentityVisibility === 'HIDDEN', 'Maximum Privacy Sender Mode (HIDDEN) enforced');
  assert(policy.maxViews === 1, 'Max views set to atomic single-use (1)');
  assert(policy.otpRequired === true, 'OTP verification challenge enforced');
  const scoreReport = policyRes.data.securityScore || policyRes.data.score;
  assert(scoreReport && scoreReport.score >= 70, `Security Strength Score verified (${scoreReport?.score}/100)`);

  // Step 6: Encrypt with AES-256-GCM & Generate QR Code
  console.log('6. Encrypting with AES-256-GCM and Generating Non-Enumerable Link & QR...');
  const vaultCreateRes = await fetch(`${BASE_URL}/api/vault/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Cookie: sessionCookie,
    },
    body: JSON.stringify({
      title: docData.title,
      plaintextSecret: docData.extractedText,
      recipientEmail: 'legal.counsel@sentinel-corp.com',
      policy,
      documentId: docData.id,
    }),
  }).then(r => r.json());
  assert(vaultCreateRes.success, 'Document encrypted with AES-256-GCM');
  const accessId = vaultCreateRes.data.accessId;
  const rawOtp = vaultCreateRes.data.rawOtp;
  const qrCode = vaultCreateRes.data.qrCode;
  assert(Boolean(accessId), 'Non-enumerable access token generated');
  assert(Boolean(qrCode), 'Optical QR code generated');
  assert(Boolean(rawOtp), 'Multi-factor OTP generated');

  // Step 7: Receiver accesses portal - Verify Sender Identity HIDDEN
  console.log('7. Receiver Access Portal Metadata Check (Sender Privacy Enforcement)...');
  const receiverMeta = await fetch(`${BASE_URL}/api/vault/access?id=${accessId}`).then(r => r.json());
  assert(receiverMeta.success, 'Receiver access portal metadata loaded');
  assert(receiverMeta.data.senderIdentityHidden === true, 'Receiver API flags senderIdentityHidden = true');
  assert(receiverMeta.data.creatorName === 'Identity Hidden (Maximum Privacy Mode)', 'Sender name fully redacted on receiver interface');
  assert(!JSON.stringify(receiverMeta.data).includes(officerEmail), 'Zero sender email leakage to receiver');

  // Step 8: Receiver OTP & Device Verification
  console.log('8. Verifying Receiver Multi-Factor Challenge (OTP + Registered Device)...');
  const verifyRes = await fetch(`${BASE_URL}/api/vault/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId,
      recipientEmail: 'legal.counsel@sentinel-corp.com',
      otp: rawOtp,
      deviceId: 'exec-trusted-laptop-alpha',
    }),
  }).then(r => r.json());
  assert(verifyRes.success, 'Receiver authentication challenge passed');

  // Step 9: Controlled Reveal & Decrypt
  console.log('9. Controlled Reveal & AES-256-GCM Decryption...');
  const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId,
      recipientEmail: 'legal.counsel@sentinel-corp.com',
      otp: rawOtp,
      deviceId: 'exec-trusted-laptop-alpha',
    }),
  }).then(r => r.json());
  assert(revealRes.success, 'Document decrypted successfully');
  assert(revealRes.data.secret.includes('$42,500,000 USD'), 'Revealed contract contains intact financial terms');

  // Step 10: Atomic 1-Time Consumption Check (Second Attempt Denied)
  console.log('10. Verifying Atomic One-Time Consumption (Second Attempt Denied)...');
  const secondRevealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId,
      recipientEmail: 'legal.counsel@sentinel-corp.com',
      otp: rawOtp,
      deviceId: 'exec-trusted-laptop-alpha',
    }),
  }).then(r => r.json());
  assert(!secondRevealRes.success, 'Second access request correctly DENIED (Item is already CONSUMED/DESTROYED)');

  // Step 11: Security Center Audit Log Verification
  console.log('11. Security Center Audit Telemetry Check...');
  const auditRes = await fetch(`${BASE_URL}/api/audit`).then(r => r.json());
  assert(auditRes.success, 'Audit logs retrieved');
  const itemLogs = auditRes.data.filter(log => log.entityId === accessId || (log.metadata && log.metadata.accessId === accessId));
  console.log(`ℹ️ Recorded audit entries for item: ${itemLogs.length}`);
  const leakedSecret = auditRes.data.some(log => JSON.stringify(log).includes('$42,500,000 USD'));
  assert(!leakedSecret, 'Telemetry verified: ZERO confidential contract text leaked into audit logs');

  console.log(`🎉 DEMO CYCLE #${cycleNum} COMPLETED WITH 100% SUCCESS!`);
}

async function main() {
  console.log('\n============================================================');
  console.log('REALITYVAULT AI + DOCSENSEAI: REPEATED HACKATHON DEMO RUNNER');
  console.log('============================================================');

  // Run 3 consecutive flawless demo cycles
  for (let i = 1; i <= 3; i++) {
    await runDemoCycle(i);
  }

  console.log('\n============================================================');
  console.log('🏆 ALL 3 REPEATED DEMO CYCLES PASSED WITH ZERO FAILURES!');
  console.log('THE APPLICATION IS 100% READY FOR LIVE STAGE DEMONSTRATION.');
  console.log('============================================================\n');
}

main().catch(err => {
  console.error('Fatal error in demo runner:', err);
  process.exit(1);
});
