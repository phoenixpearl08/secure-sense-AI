// RealityVault AI - Receiver Verification & Device Authorization Flow Test
// Tests the 6 mandatory authorization test cases:
// A. Correct registered device + correct OTP → REVEAL
// B. Unregistered device + correct OTP → DENY
// C. Registered device + wrong OTP → DENY
// D. Correct first reveal → SUCCESS
// E. Second reveal → DENY
// F. Expired secret → DENY

import fs from 'fs';
import path from 'path';

const BASE_URL = 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

async function runReceiverVerificationTests() {
  console.log('\n============================================================');
  console.log('REALITYVAULT AI: RECEIVER VERIFICATION FLOW VERIFICATION');
  console.log('============================================================\n');

  // 1. Setup authenticated session and register a trusted device
  const officerEmail = `officer_${Date.now()}@realityvault.ai`;
  await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: officerEmail,
      name: 'Security Architect',
      password: 'VaultSecure_2026!Password',
      role: 'SECURITY_ADMIN',
    }),
  });

  const registeredDeviceId = `dev-registered-trusted-${Date.now()}`;
  const unregisteredDeviceId = `dev-unregistered-unknown-${Date.now()}`;

  const loginRes = await fetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: officerEmail,
      password: 'VaultSecure_2026!Password',
      deviceId: registeredDeviceId,
      deviceName: 'Enrolled Corporate Laptop',
    }),
  });
  const sessionCookie = (loginRes.headers.get('set-cookie') || '').split(';')[0];

  // Helper to create vault item
  async function createTestItem(overrides = {}) {
    const res = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Cookie: sessionCookie,
      },
      body: JSON.stringify({
        title: 'Confidential Payload',
        plaintextSecret: 'SECRET_PAYLOAD_DATA_2026_ALPHA',
        recipientEmail: 'receiver@realityvault.ai',
        policy: {
          securityLevel: 'HIGH_SECURITY',
          recipientRequired: true,
          recipientEmail: 'receiver@realityvault.ai',
          otpRequired: true,
          deviceRequired: true,
          registeredDeviceOnly: true,
          maxViews: 1,
          expiresInHours: overrides.expiresInHours || 24,
          senderIdentityVisibility: 'HIDDEN',
          zeroPersistence: true,
          downloadAllowed: false,
          ...overrides.policy,
        },
      }),
    });
    return res.json();
  }

  // --- CASE A & D: Correct registered device + correct OTP → REVEAL (SUCCESS) ---
  console.log('\n--- CASE A & D: Correct registered device + correct OTP → REVEAL (SUCCESS) ---');
  const itemA = await createTestItem();
  assert(itemA.success, 'Item A created');
  const accessIdA = itemA.data.accessId;
  const otpA = itemA.data.rawOtp;

  // Metadata check with registered device
  const metaA_reg = await fetch(`${BASE_URL}/api/vault/access?id=${accessIdA}&deviceId=${registeredDeviceId}`).then(r => r.json());
  assert(metaA_reg.success, 'Metadata retrieved');
  assert(metaA_reg.data.deviceVerified === true, 'Registered device returns deviceVerified === true');
  assert(metaA_reg.data.deviceStatus === 'VERIFIED', 'Registered device status is VERIFIED');

  // Reveal with registered device + correct OTP
  const revealA = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessIdA,
      recipientEmail: 'receiver@realityvault.ai',
      otp: otpA,
      deviceId: registeredDeviceId,
    }),
  }).then(r => r.json());

  assert(revealA.success === true, 'CASE A & D: Correct registered device + correct OTP successfully reveals payload');
  assert(revealA.data.secret === 'SECRET_PAYLOAD_DATA_2026_ALPHA', 'Decrypted payload matches');

  // --- CASE E: Second reveal → DENY (ATOMIC CONSUMPTION) ---
  console.log('\n--- CASE E: Second reveal → DENY (Item already consumed) ---');
  const revealE = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessIdA,
      recipientEmail: 'receiver@realityvault.ai',
      otp: otpA,
      deviceId: registeredDeviceId,
    }),
  }).then(r => r.json());

  assert(revealE.success === false, 'CASE E: Second reveal rejected');
  assert(
    revealE.error?.includes('DESTROYED') ||
    revealE.error?.includes('CONSUMED') ||
    revealE.error?.includes('already been consumed') ||
    revealE.status === 'CONSUMED',
    'Proper consumption or zero-persistence destruction error returned'
  );

  // --- CASE B: Unregistered device + correct OTP → DENY ---
  console.log('\n--- CASE B: Unregistered device + correct OTP → DENY ---');
  const itemB = await createTestItem();
  const accessIdB = itemB.data.accessId;
  const otpB = itemB.data.rawOtp;

  // Metadata check with unregistered device
  const metaB_unreg = await fetch(`${BASE_URL}/api/vault/access?id=${accessIdB}&deviceId=${unregisteredDeviceId}`).then(r => r.json());
  assert(metaB_unreg.success, 'Metadata retrieved for unregistered device check');
  assert(metaB_unreg.data.deviceVerified === false, 'Unregistered device returns deviceVerified === false');
  assert(metaB_unreg.data.deviceStatus === 'NOT_REGISTERED', 'Unregistered device status is NOT_REGISTERED');
  assert(metaB_unreg.data.deviceMessage.includes('Access denied'), 'Explains device is not registered/untrusted');

  // Reveal attempt with unregistered device
  const revealB = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessIdB,
      recipientEmail: 'receiver@realityvault.ai',
      otp: otpB,
      deviceId: unregisteredDeviceId,
    }),
  }).then(r => r.json());

  assert(revealB.success === false, 'CASE B: Unregistered device is DENIED access even with correct OTP');
  assert(revealB.error.includes('Device is not registered or untrusted'), 'Server strictly returns Device is not registered or untrusted');

  // Test device enrollment / registration capability
  console.log('\n--- VERIFY ENROLLMENT: Authorizing previously unregistered device ---');
  const enrollRes = await fetch(`${BASE_URL}/api/devices/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      deviceId: unregisteredDeviceId,
      deviceName: 'Newly Enrolled Receiver Device',
    }),
  }).then(r => r.json());
  assert(enrollRes.success === true, 'Device successfully enrolled via /api/devices/register');

  // Re-check metadata after enrollment
  const metaB_after = await fetch(`${BASE_URL}/api/vault/access?id=${accessIdB}&deviceId=${unregisteredDeviceId}`).then(r => r.json());
  assert(metaB_after.data.deviceVerified === true, 'Enrolled device now returns deviceVerified === true');
  assert(metaB_after.data.deviceStatus === 'VERIFIED', 'Enrolled device status is now VERIFIED');

  // Now reveal succeeds
  const revealB_enrolled = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessIdB,
      recipientEmail: 'receiver@realityvault.ai',
      otp: otpB,
      deviceId: unregisteredDeviceId,
    }),
  }).then(r => r.json());
  assert(revealB_enrolled.success === true, 'Enrolled device with correct OTP now successfully reveals secret');

  // --- CASE C: Registered device + wrong OTP → DENY ---
  console.log('\n--- CASE C: Registered device + wrong OTP → DENY ---');
  const itemC = await createTestItem();
  const accessIdC = itemC.data.accessId;

  const revealC = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessIdC,
      recipientEmail: 'receiver@realityvault.ai',
      otp: '999999', // Wrong OTP
      deviceId: registeredDeviceId,
    }),
  }).then(r => r.json());

  assert(revealC.success === false, 'CASE C: Registered device + wrong OTP is DENIED access');
  assert(revealC.error.includes('Invalid or missing One-Time Password'), 'Server strictly returns Invalid OTP error');

  // --- CASE F: Expired secret → DENY ---
  console.log('\n--- CASE F: Expired secret → DENY ---');
  const itemF = await createTestItem({ expiresInHours: -1 });
  const accessIdF = itemF.data.accessId;
  const otpF = itemF.data.rawOtp;

  const revealF = await fetch(`${BASE_URL}/api/vault/reveal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      accessId: accessIdF,
      recipientEmail: 'receiver@realityvault.ai',
      otp: otpF,
      deviceId: registeredDeviceId,
    }),
  }).then(r => r.json());

  assert(revealF.success === false, 'CASE F: Expired secret is strictly DENIED');
  assert(revealF.error?.toLowerCase().includes('expired') || revealF.status === 'EXPIRED', 'Server indicates item is expired');

  console.log('\n============================================================');
  console.log('🎉 ALL 6 RECEIVER VERIFICATION TEST CASES (A–F) PASSED!');
  console.log('============================================================\n');
}

runReceiverVerificationTests().catch(err => {
  console.error('Fatal error in receiver verification tests:', err);
  process.exit(1);
});
