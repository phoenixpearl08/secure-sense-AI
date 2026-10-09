# SECURE SENSE

**Intelligent Security & Document Intelligence**

SECURE SENSE is a zero-trust, privacy-first cybersecurity platform combining authenticated cryptography (AES-256-GCM), ephemeral encrypted document transmission, AI-driven document intelligence (DocSenseAI), and granular privacy compliance controls.

---

## Key Capabilities

1. **DocSenseAI (Document Intelligence & Grounded Q&A):**
   - Heuristic and OCR text extraction across PDF, DOCX, XLSX, TXT, and scanned image formats.
   - Contextual obligation, deadline, and financial breakdown extraction with zero-hallucination domain boundary guards.
   - Grounded Q&A engine with source citation and prompt-injection defense.

2. **Secure Vault & Send Wizard:**
   - Client and server-side authenticated encryption using **AES-256-GCM** with unique 96-bit IVs and 128-bit authentication tags.
   - Granular recipient verification, out-of-band One-Time Password (OTP) dispatch, and zero-trust device hardware authorization.
   - Atomic one-time view enforcement protecting against concurrent race conditions.

3. **Ephemeral Real-Time File Transfers:**
   - In-memory zero-persistence transfer relay.
   - Single-use consumption guarantees with automatic buffer shredding upon read or expiry.

4. **Security Command Center:**
   - Real-time telemetry monitoring active transfers, failed access attempts, and permission mutations.
   - Immutable audit trail redacting credentials and PII.

5. **Privacy Control Center & Compliance:**
   - GDPR/CCPA data portability export (`/api/privacy/export`).
   - Verified Right to Erasure workflow (`/api/privacy/delete`).
   - Active session tracking and remote device session revocation.

6. **File Threat Scanner & Privacy Guard:**
   - Heuristic binary malware analysis and executable rejection (MZ/ELF/Java bytecode).
   - Embedded polyglot script smuggling detection in document payloads.
   - Pre-send Privacy Guard identifying payment cards (Luhn validated), SSNs, RSA private keys, and cloud secrets with required user confirmation.

---

## Tech Stack

- **Framework:** Next.js 16 (App Router, Turbopack)
- **UI:** React 19, TailwindCSS, Lucide Icons
- **Cryptography:** Node.js native `crypto` (AES-256-GCM, Scrypt key derivation)
- **Database & Storage:** PostgreSQL with Prisma Client OR zero-configuration atomic local persistence fallback
- **Language:** TypeScript 5

---

## Getting Started

### 1. Prerequisites
- Node.js 20+ / npm 10+

### 2. Environment Configuration
Copy the template to `.env.local`:
```bash
cp .env.example .env.local
```
Provide your 32-character master secrets:
- `VAULT_MASTER_KEY`
- `SESSION_SECRET`

### 3. Install Dependencies & Build
```bash
npm install
npm run build
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the application.

---

## Verification & Test Suites

SECURE SENSE includes comprehensive automated end-to-end verification suites:

```bash
# 1. Comprehensive Security Hardening & Privacy Expansion Test Suite
node tests/security-privacy-expansion-test.mjs

# 2. DocSenseAI Intelligence & Domain Guard Verification Suite
node tests/docsense-intelligence-test.mjs

# 3. Encrypted File Transfer Integrity & Cryptographic Parity Suite
node tests/file-transfer-integrity-test.mjs

# 4. Production End-to-End & Concurrency Stress Test Suite
node tests/verify-e2e.mjs
```

---

## Security Policy

- **Zero Secret Exposure:** Keys, credentials, OTP passcodes, and decrypted plaintexts are strictly excluded from client telemetry and server logs.
- **Server-Side Enforcement:** All access controls, expiration policies, and download restrictions are strictly validated on the server.
- **Tamper Protection:** Payloads are protected by AES-256-GCM 128-bit authentication tags, immediately invalidating tampered data.
