// VaultX / SecureSense AI - Comprehensive Encrypted File Transfer Integrity Test Suite
// Verifies all 4 modules: Send Wizard, Secure Vault, Combined, Transfer
// Verifies all file types: TXT, PDF, PNG, DOCX, XLSX, ZIP, Large binary file
// Verifies cryptographic SHA-256 byte parity, security edge cases, corrupted data,
// OTP verification, recipient authorization, revocation, and atomic view limits.

import crypto from 'crypto';

const BASE_URL = 'http://localhost:3000';

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

function computeSha256(buffer) {
  return crypto.createHash('sha256').update(buffer).digest('hex');
}

function extractBinaryBufferFromPayload(payload) {
  if (!payload) return Buffer.alloc(0);
  if (typeof payload === 'string') {
    if (payload.startsWith('data:')) {
      const base64Clean = payload.replace(/^data:[^;]+;base64,/, '');
      return Buffer.from(base64Clean, 'base64');
    }
    // Check if valid base64
    if (/^[A-Za-z0-9+/=]+$/.test(payload.trim()) && payload.length % 4 === 0) {
      return Buffer.from(payload.trim(), 'base64');
    }
    return Buffer.from(payload, 'utf8');
  }
  return Buffer.from(payload);
}

// Generate test payloads
function createTestFiles() {
  // 1. Plain text
  const txtContent = 'CONFIDENTIAL MEMO: Q4 Strategic Acquisitions & Valuation Metrics.\nDate: 2026-10-09\nAuthorized personnel only.';
  const txtBuffer = Buffer.from(txtContent, 'utf8');

  // 2. Realistic PDF (%PDF-1.4 header and trailer)
  const pdfString = `%PDF-1.4
1 0 obj
<< /Title (VaultX Security Audit Report) /Author (SecureSense) >>
endobj
2 0 obj
<< /Type /Catalog /Pages 3 0 R >>
endobj
3 0 obj
<< /Type /Pages /Kids [4 0 R] /Count 1 >>
endobj
4 0 obj
<< /Type /Page /Parent 3 0 R /MediaBox [0 0 612 792] /Contents 5 0 R >>
endobj
5 0 obj
<< /Length 55 >>
stream
BT
/F1 24 Tf
100 700 Td
(Encrypted Binary PDF Verification Payload) Tj
ET
endstream
endobj
xref
0 6
0000000000 65535 f 
0000000009 00000 n 
0000000085 00000 n 
0000000132 00000 n 
0000000189 00000 n 
0000000276 00000 n 
trailer
<< /Size 6 /Root 2 0 R >>
startxref
382
%%EOF`;
  const pdfBuffer = Buffer.from(pdfString, 'binary');

  // 3. PNG Image (Valid 8-byte PNG signature + minimal chunk)
  const pngHeader = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const pngIhdr = Buffer.from([
    0x00, 0x00, 0x00, 0x0d, // Chunk length 13
    0x49, 0x48, 0x44, 0x52, // IHDR
    0x00, 0x00, 0x00, 0x02, // width 2
    0x00, 0x00, 0x00, 0x02, // height 2
    0x08, 0x02, 0x00, 0x00, 0x00, // bit depth, color type, etc.
    0x85, 0x8d, 0x9b, 0xa3  // CRC
  ]);
  const pngIend = Buffer.from([0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4e, 0x44, 0xae, 0x42, 0x60, 0x82]);
  const pngBuffer = Buffer.concat([pngHeader, pngIhdr, pngIend]);

  // 4. DOCX (Valid PK\x03\x04 zip header with Word XML markers)
  const docxBuffer = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00]),
    Buffer.from('word/document.xml'),
    Buffer.from('<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>VaultX Verified Legal Document</w:t></w:r></w:p></w:body></w:document>')
  ]);

  // 5. XLSX (Valid PK\x03\x04 zip header with Excel XML markers)
  const xlsxBuffer = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x14, 0x00, 0x00, 0x00, 0x08, 0x00]),
    Buffer.from('xl/workbook.xml'),
    Buffer.from('<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheets><sheet name="Ledger" sheetId="1"/></sheets></workbook>')
  ]);

  // 6. ZIP Archive (Valid PK\x03\x04 zip header)
  const zipBuffer = Buffer.concat([
    Buffer.from([0x50, 0x4b, 0x03, 0x04, 0x0a, 0x00, 0x00, 0x00, 0x00, 0x00]),
    Buffer.from('secrets.txt'),
    Buffer.from('VaultX Compressed Secrets Payload 2026')
  ]);

  // 7. Large binary file (512 KB of pseudorandom deterministic data)
  const largeBuffer = Buffer.alloc(512 * 1024);
  for (let i = 0; i < largeBuffer.length; i++) {
    largeBuffer[i] = (i * 37 + 19) % 256;
  }

  // 8. Executable file (Forbidden MZ binary header)
  const exeBuffer = Buffer.concat([
    Buffer.from([0x4d, 0x5a, 0x90, 0x00]), // MZ
    Buffer.from('This program cannot be run in DOS mode.')
  ]);

  return {
    txt: { name: 'confidential_memo.txt', mime: 'text/plain', buffer: txtBuffer, hash: computeSha256(txtBuffer) },
    pdf: { name: 'audit_dossier.pdf', mime: 'application/pdf', buffer: pdfBuffer, hash: computeSha256(pdfBuffer) },
    png: { name: 'architecture_diagram.png', mime: 'image/png', buffer: pngBuffer, hash: computeSha256(pngBuffer) },
    docx: { name: 'legal_agreement.docx', mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', buffer: docxBuffer, hash: computeSha256(docxBuffer) },
    xlsx: { name: 'financial_projections.xlsx', mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', buffer: xlsxBuffer, hash: computeSha256(xlsxBuffer) },
    zip: { name: 'secure_bundle.zip', mime: 'application/zip', buffer: zipBuffer, hash: computeSha256(zipBuffer) },
    large: { name: 'large_dataset.bin', mime: 'application/octet-stream', buffer: largeBuffer, hash: computeSha256(largeBuffer) },
    exe: { name: 'malware.exe', mime: 'application/x-msdownload', buffer: exeBuffer, hash: computeSha256(exeBuffer) }
  };
}

async function runTestSuite() {
  console.log('\n========================================================================');
  console.log('VAULTX — COMPREHENSIVE ENCRYPTED FILE TRANSFER INTEGRITY & SECURITY SUITE');
  console.log('========================================================================\n');

  const files = createTestFiles();

  // ====================================================================
  // MODULE 1: SEND WIZARD PIPELINE AUDIT
  // ====================================================================
  console.log('------------------------------------------------------------------------');
  console.log('PHASE 4.A — MODULE 1: SEND WIZARD PIPELINE');
  console.log('------------------------------------------------------------------------');

  // Test 1: Send Wizard with Single PDF (Preserving Binary Data URL & Hash)
  {
    console.log('• Testing Send Wizard with PDF document...');
    const pdfDataUrl = `data:${files.pdf.mime};base64,${files.pdf.buffer.toString('base64')}`;

    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Executive Financial Audit Report',
        plaintextSecret: 'Executive note attached to PDF',
        recipientEmail: 'receiver@sentinel.org',
        policy: {
          securityLevel: 'HIGH_SECURITY',
          otpRequired: true,
          recipientRequired: true,
          maxViews: 2,
          expiresInHours: 24,
          downloadAllowed: true,
        },
        fileName: files.pdf.name,
        fileSize: files.pdf.buffer.length,
        mimeType: files.pdf.mime,
        fileHash: files.pdf.hash,
        fileData: pdfDataUrl,
        files: [{
          name: files.pdf.name,
          mimeType: files.pdf.mime,
          size: files.pdf.buffer.length,
          hash: files.pdf.hash,
          data: pdfDataUrl,
        }],
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, 'Send Wizard vault item created successfully');
    assert(Boolean(createData.data.accessId), 'Valid accessId generated');
    assert(Boolean(createData.data.rawOtp), 'Cryptographic OTP generated for out-of-band delivery');

    // Receiver opens access link and reveals
    const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
        recipientEmail: 'receiver@sentinel.org',
        otp: createData.data.rawOtp,
      }),
    });

    const revealData = await revealRes.json();
    assert(revealData.success, 'Receiver revealed Send Wizard item successfully');
    assert(revealData.data.status === 'GRANTED', 'Status is GRANTED');
    assert(Boolean(revealData.data.file || revealData.data.files), 'Decrypted binary file package present in response');

    const receivedFileData = revealData.data.file?.data || revealData.data.files?.[0]?.data;
    assert(Boolean(receivedFileData), 'Decrypted file data URL received');

    const decryptedBuffer = extractBinaryBufferFromPayload(receivedFileData);
    const decryptedHash = computeSha256(decryptedBuffer);

    assert(decryptedHash === files.pdf.hash, `Send Wizard PDF SHA-256 byte parity verified! (${decryptedHash})`);
    assert(decryptedBuffer.length === files.pdf.buffer.length, `Byte length matches exactly (${decryptedBuffer.length} bytes)`);
  }

  // Test 2: Send Wizard with Multiple Files (Package of DOCX + PNG)
  {
    console.log('\n• Testing Send Wizard Multi-File Package (DOCX + PNG)...');
    const docxDataUrl = `data:${files.docx.mime};base64,${files.docx.buffer.toString('base64')}`;
    const pngDataUrl = `data:${files.png.mime};base64,${files.png.buffer.toString('base64')}`;

    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Multi-Asset Legal Package',
        plaintextSecret: 'Package containing legal docx and verified png diagram',
        recipientEmail: 'partner@lawfirm.com',
        policy: {
          securityLevel: 'HIGH_SECURITY',
          otpRequired: false,
          recipientRequired: true,
          maxViews: 2,
          expiresInHours: 12,
        },
        fileName: 'legal_package.zip',
        fileSize: files.docx.buffer.length + files.png.buffer.length,
        mimeType: 'application/zip',
        files: [
          {
            name: files.docx.name,
            mimeType: files.docx.mime,
            size: files.docx.buffer.length,
            hash: files.docx.hash,
            data: docxDataUrl,
          },
          {
            name: files.png.name,
            mimeType: files.png.mime,
            size: files.png.buffer.length,
            hash: files.png.hash,
            data: pngDataUrl,
          }
        ],
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, 'Multi-file vault item created successfully');

    const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
        recipientEmail: 'partner@lawfirm.com',
      }),
    });

    const revealData = await revealRes.json();
    assert(revealData.success, 'Multi-file item revealed successfully');
    assert(Array.isArray(revealData.data.files) && revealData.data.files.length === 2, 'Received both decrypted files');

    const decryptedDocx = extractBinaryBufferFromPayload(revealData.data.files[0].data);
    const decryptedPng = extractBinaryBufferFromPayload(revealData.data.files[1].data);

    assert(computeSha256(decryptedDocx) === files.docx.hash, 'Multi-file DOCX SHA-256 byte parity verified!');
    assert(computeSha256(decryptedPng) === files.png.hash, 'Multi-file PNG SHA-256 byte parity verified!');
  }

  // ====================================================================
  // MODULE 2: SECURE VAULT PIPELINE AUDIT
  // ====================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('PHASE 4.B — MODULE 2: SECURE VAULT PIPELINE');
  console.log('------------------------------------------------------------------------');

  // Test 3: Secure Vault with XLSX Spreadsheet
  {
    console.log('• Testing Secure Vault with XLSX spreadsheet...');
    const xlsxDataUrl = `data:${files.xlsx.mime};base64,${files.xlsx.buffer.toString('base64')}`;

    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Q4 Financial Projections',
        plaintextSecret: 'Attached financial model spreadsheet',
        recipientEmail: 'cfo@company.com',
        policy: {
          securityLevel: 'MAXIMUM_SECURITY',
          otpRequired: true,
          recipientRequired: true,
          maxViews: 1,
          expiresInHours: 48,
        },
        fileName: files.xlsx.name,
        fileSize: files.xlsx.buffer.length,
        mimeType: files.xlsx.mime,
        fileHash: files.xlsx.hash,
        fileData: xlsxDataUrl,
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, 'Secure Vault item created with XLSX attachment');

    const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
        recipientEmail: 'cfo@company.com',
        otp: createData.data.rawOtp,
      }),
    });

    const revealData = await revealRes.json();
    assert(revealData.success, 'Secure Vault XLSX item decrypted successfully');

    const decryptedBuffer = extractBinaryBufferFromPayload(revealData.data.file?.data);
    assert(computeSha256(decryptedBuffer) === files.xlsx.hash, 'Secure Vault XLSX SHA-256 byte parity verified!');
  }

  // Test 4: Secure Vault with ZIP Archive
  {
    console.log('\n• Testing Secure Vault with ZIP Archive...');
    const zipDataUrl = `data:${files.zip.mime};base64,${files.zip.buffer.toString('base64')}`;

    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Encrypted Recovery Archive',
        plaintextSecret: 'Critical recovery keys inside ZIP',
        policy: {
          securityLevel: 'STANDARD',
          maxViews: 1,
          expiresInHours: 1,
        },
        fileName: files.zip.name,
        fileSize: files.zip.buffer.length,
        mimeType: files.zip.mime,
        fileHash: files.zip.hash,
        fileData: zipDataUrl,
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, 'Vault item created with ZIP archive');

    const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
      }),
    });

    const revealData = await revealRes.json();
    assert(revealData.success, 'Vault ZIP archive revealed');

    const decryptedBuffer = extractBinaryBufferFromPayload(revealData.data.file?.data);
    assert(computeSha256(decryptedBuffer) === files.zip.hash, 'Secure Vault ZIP SHA-256 byte parity verified!');
  }

  // ====================================================================
  // MODULE 3: COMBINED MODE PIPELINE AUDIT
  // ====================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('PHASE 4.C — MODULE 3: COMBINED MODE PIPELINE');
  console.log('------------------------------------------------------------------------');

  // Test 5: Combined Mode (Upload with binary base64 -> DocSense Ingestion -> Vault Create -> Reveal)
  {
    console.log('• Testing Combined Mode full pipeline (Upload -> Policy -> Vault -> Reveal)...');
    const uploadRes = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Acquisition Term Sheet Alpha',
        fileName: files.pdf.name,
        mimeType: files.pdf.mime,
        fileBufferBase64: `data:${files.pdf.mime};base64,${files.pdf.buffer.toString('base64')}`,
      }),
    });

    const uploadData = await uploadRes.json();
    assert(uploadData.success, 'Combined Mode document upload & DocSense analysis succeeded');
    assert(Boolean(uploadData.data.fileBufferBase64), 'Document object preserved binary fileBufferBase64');

    // Generate Adaptive AI Policy
    const policyRes = await fetch(`${BASE_URL}/api/security/policy`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt: 'Highly confidential acquisition agreement. Restrict to legal.counsel@sentinel-corp.com with OTP and one-time view.',
      }),
    });

    const policyData = await policyRes.json();
    assert(policyData.success && policyData.data.policy, 'Combined Mode AI Policy generated');

    // Encrypt and Share in Combined Mode
    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: uploadData.data.title,
        plaintextSecret: uploadData.data.extractedText,
        recipientEmail: policyData.data.policy.recipientEmail || 'legal.counsel@sentinel-corp.com',
        policy: policyData.data.policy,
        documentId: uploadData.data.id,
        fileName: uploadData.data.fileName,
        fileSize: uploadData.data.fileSize,
        mimeType: uploadData.data.mimeType,
        fileData: uploadData.data.fileBufferBase64,
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, 'Combined Mode vault package encrypted and created');

    // Receiver reveals
    const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
        recipientEmail: policyData.data.policy.recipientEmail || 'legal.counsel@sentinel-corp.com',
        otp: createData.data.rawOtp,
      }),
    });

    const revealData = await revealRes.json();
    assert(revealData.success, 'Combined Mode receiver reveal succeeded');

    const decryptedBuffer = extractBinaryBufferFromPayload(revealData.data.file?.data);
    assert(computeSha256(decryptedBuffer) === files.pdf.hash, 'Combined Mode original PDF SHA-256 byte parity verified!');
  }

  // ====================================================================
  // MODULE 4: EPHEMERAL REAL-TIME TRANSFER PIPELINE AUDIT
  // ====================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('PHASE 4.D — MODULE 4: EPHEMERAL TRANSFER PIPELINE');
  console.log('------------------------------------------------------------------------');

  // Test 6: Ephemeral Transfer with Binary Image (PNG)
  {
    console.log('• Testing Ephemeral Transfer with PNG image...');
    const createRes = await fetch(`${BASE_URL}/api/transfers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: files.png.name,
        payloadBufferBase64: `data:${files.png.mime};base64,${files.png.buffer.toString('base64')}`,
        mimeType: files.png.mime,
        zeroPersistence: true,
        expiresInMinutes: 10,
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, 'Ephemeral transfer session created with PNG');
    assert(createData.data.fileHash === files.png.hash, 'Calculated transfer session fileHash matches exact PNG hash');

    // Consume transfer
    const consumeRes = await fetch(`${BASE_URL}/api/transfers/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: createData.data.sessionToken,
        otp: createData.data.rawOtp,
      }),
    });

    const consumeData = await consumeRes.json();
    assert(consumeData.success, 'Ephemeral transfer consumed successfully');
    assert(consumeData.data.status === 'COMPLETED_AND_PURGED', 'Status is COMPLETED_AND_PURGED');

    const decryptedBuffer = extractBinaryBufferFromPayload(consumeData.data.payload);
    assert(computeSha256(decryptedBuffer) === files.png.hash, 'Ephemeral Transfer PNG SHA-256 byte parity verified!');

    // Verify zero persistence (immediate memory wipe)
    const secondConsume = await fetch(`${BASE_URL}/api/transfers/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: createData.data.sessionToken,
        otp: createData.data.rawOtp,
      }),
    });
    const secondData = await secondConsume.json();
    assert(!secondData.success, 'Second consumption rejected: zero-persistence purged from transient memory');
  }

  // Test 7: Ephemeral Transfer with 512KB Large Binary File
  {
    console.log('\n• Testing Ephemeral Transfer with 512KB large binary payload...');
    const createRes = await fetch(`${BASE_URL}/api/transfers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: files.large.name,
        payloadBufferBase64: `data:${files.large.mime};base64,${files.large.buffer.toString('base64')}`,
        mimeType: files.large.mime,
        zeroPersistence: true,
        expiresInMinutes: 15,
      }),
    });

    const createData = await createRes.json();
    assert(createData.success, '512KB binary transfer session created');

    const consumeRes = await fetch(`${BASE_URL}/api/transfers/consume`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionToken: createData.data.sessionToken,
        otp: createData.data.rawOtp,
      }),
    });

    const consumeData = await consumeRes.json();
    assert(consumeData.success, '512KB binary transfer consumed');

    const decryptedBuffer = extractBinaryBufferFromPayload(consumeData.data.payload);
    assert(computeSha256(decryptedBuffer) === files.large.hash, 'Large binary file SHA-256 byte parity verified!');
    assert(decryptedBuffer.length === 512 * 1024, 'Full 512KB binary payload recovered without truncation');
  }

  // ====================================================================
  // SECURITY AUDIT & DEFENSIVE VERIFICATION
  // ====================================================================
  console.log('\n------------------------------------------------------------------------');
  console.log('PHASE 5 — SECURITY AUDIT & EDGE CASE VERIFICATION');
  console.log('------------------------------------------------------------------------');

  // Test 8: Empty File Validation
  {
    console.log('• Testing empty file validation...');
    const res = await fetch(`${BASE_URL}/api/transfers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: 'empty.bin',
        payloadBufferBase64: '',
      }),
    });
    const data = await res.json();
    assert(!data.success, 'Empty file rejected with 400 error as expected');
  }

  // Test 9: Forbidden Executable Rejection
  {
    console.log('\n• Testing forbidden executable payload rejection (Magic Byte Check)...');
    const res = await fetch(`${BASE_URL}/api/transfers/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: files.exe.name,
        payloadBufferBase64: `data:${files.exe.mime};base64,${files.exe.buffer.toString('base64')}`,
        mimeType: files.exe.mime,
      }),
    });
    const data = await res.json();
    assert(!data.success && data.error.includes('Executable'), 'Executable binary payload correctly rejected by security inspection');
  }

  // Test 10: Unauthorized Recipient Check
  {
    console.log('\n• Testing unauthorized recipient access rejection...');
    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Restricted Payload',
        plaintextSecret: 'Strict secret',
        recipientEmail: 'intended@secure.org',
        policy: {
          recipientRequired: true,
          securityLevel: 'HIGH_SECURITY',
        },
      }),
    });
    const createData = await createRes.json();

    const badReveal = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
        recipientEmail: 'impostor@attacker.org',
      }),
    });
    const badData = await badReveal.json();
    assert(!badData.success && badData.error.includes('Recipient'), 'Unauthorized recipient correctly BLOCKED');
  }

  // Test 11: Incorrect OTP Passcode
  {
    console.log('\n• Testing incorrect OTP passcode rejection...');
    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'OTP Protected Secret',
        plaintextSecret: 'Confidential message',
        policy: {
          otpRequired: true,
          securityLevel: 'HIGH_SECURITY',
        },
      }),
    });
    const createData = await createRes.json();

    const badOtp = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
        otp: '000000', // Wrong OTP
      }),
    });
    const badData = await badOtp.json();
    assert(!badData.success && badData.error.includes('OTP'), 'Invalid OTP correctly BLOCKED');
  }

  // Test 12: Revocation Behavior
  {
    console.log('\n• Testing revocation behavior...');
    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Revocable Secret',
        plaintextSecret: 'Revoke this before reveal',
        policy: { securityLevel: 'STANDARD' },
      }),
    });
    const createData = await createRes.json();

    // Revoke
    const revokeRes = await fetch(`${BASE_URL}/api/vault/revoke`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        itemId: createData.data.id,
        actionType: 'REVOKE',
      }),
    });
    const revokeData = await revokeRes.json();
    assert(revokeData.success, 'Creator successfully revoked item');

    // Attempt reveal
    const revealRes = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessId: createData.data.accessId,
      }),
    });
    const revealData = await revealRes.json();
    assert(!revealData.success && revealData.error.includes('REVOKED'), 'Revoked link rejected on reveal attempt');
  }

  // Test 13: Atomic View Consumption (One-Time Access Enforcement)
  {
    console.log('\n• Testing atomic one-time view consumption...');
    const createRes = await fetch(`${BASE_URL}/api/vault/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Burn On Read File',
        plaintextSecret: 'Single use data',
        policy: {
          securityLevel: 'STANDARD',
          maxViews: 1,
          zeroPersistence: true,
        },
        fileName: files.txt.name,
        fileData: `data:${files.txt.mime};base64,${files.txt.buffer.toString('base64')}`,
      }),
    });
    const createData = await createRes.json();

    // First reveal -> should succeed
    const firstReveal = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessId: createData.data.accessId }),
    });
    const firstData = await firstReveal.json();
    assert(firstData.success, 'First view granted successfully');

    // Second reveal -> must be atomically denied
    const secondReveal = await fetch(`${BASE_URL}/api/vault/reveal`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessId: createData.data.accessId }),
    });
    const secondData = await secondReveal.json();
    assert(
      !secondData.success &&
      (secondData.error.includes('consumed') || secondData.error.includes('exhausted') || secondData.error.includes('DESTROYED') || secondData.error.includes('not active')),
      'Subsequent access rejected: Atomic view limit enforced'
    );
  }

  console.log('\n========================================================================');
  console.log('🎉 ALL FILE TRANSFER INTEGRITY & SECURITY TESTS PASSED (13/13)');
  console.log('Every module decrypted original files with 100% cryptographic SHA-256 byte parity!');
  console.log('========================================================================\n');
}

runTestSuite().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
