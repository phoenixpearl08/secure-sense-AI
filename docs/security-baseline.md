# RealityVault AI + DocSenseAI Security Baseline

## 1. Security Baseline Statement

> **Important**: This project is an advanced cybersecurity-focused hackathon prototype demonstrating AI-guided policy generation and cryptographic access control. It does NOT claim to be "unhackable", "military-grade", or "independently certified".

---

## 2. Implemented Security Controls

### 2.1 Cryptographic Controls
- **Authenticated Encryption**: `AES-256-GCM` standard implementation from Node.js `crypto`.
- **Initialization Vectors**: Unique cryptographically secure 96-bit (12-byte) IV generated per encryption via `crypto.randomBytes(12)`. IVs are never reused.
- **Integrity & Authenticity**: 128-bit authentication tag verified prior to any decryption. Tampered ciphertexts trigger deterministic rejection.
- **Key Separation**: Encryption keys and derivation salts are strictly decoupled from persistent database storage and ciphertext payloads.
- **No Plaintext Persistence**: Sensitive vault contents and confidential documents are never written to disk or database unencrypted.

### 2.2 Access Control & Atomicity
- **Non-Enumerable Access IDs**: Random 256-bit entropy tokens prevent sequential URL enumeration.
- **Controlled Reveal**: Fetching an item page metadata does NOT reveal ciphertext or decrypted content until step-by-step verification passes.
- **Atomic Single-Use (One-Time Access)**: Concurrency-safe atomic state transitions prevent race conditions and double-reveal exploitation.
- **Deterministic Revocation & Expiration**: Items check time validity and active status before evaluating cryptographic decryption.

### 2.3 AI Policy Safety
- **Schema Validation**: Output from AI / LLM is treated as untrusted user input and strictly validated against a typed JSON schema.
- **No Autonomous Privilege Escalation**: AI can only recommend security constraints (e.g. require OTP, reduce max views, set shorter expiration). AI cannot bypass backend authorization rules.

### 2.4 Threat & Risk Monitoring
- **Risk Evaluation**: Evaluates failed attempts, unknown device fingerprints, abnormal frequency, and expired tokens.
- **Zero-Secret Audit Logging**: Structured logging strips passwords, OTP codes, private document plaintext, encryption keys, and session tokens.

### 2.5 Transport & Header Hygiene
- **Security Headers**: HSTS-ready, `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Referrer-Policy: strict-origin-when-cross-origin`, and `Content-Security-Policy`.
- **Request Body Limits**: Enforced size limits prevent denial-of-service through memory exhaustion.

---

## 3. What is NOT Implemented Yet (Future Roadmap)

| Feature | Current Phase Status | Future Phase Implementation |
|---|---|---|
| Hardware Security Module (HSM) | Software derivation (`scrypt`/`pbkdf2`) | AWS KMS / HashiCorp Vault / Azure Key Vault |
| Biometric WebAuthn | Simulated device fingerprint | FIDO2 / WebAuthn biometric challenges |
| WebRTC End-to-End Encryption | Secure Meeting Lobby & Policy check | WebRTC Insertable Streams SFrame E2EE |
| Distributed Rate Limiting | In-memory token bucket / sliding window | Redis cluster rate limiter |
| Production Key Rotation | Single master key derivation base | Automated 90-day envelope key rotation |

---

## 4. Sensitive Data Handling Rules

1. **Rule 1**: Never log passwords, tokens, raw keys, or plaintext secrets.
2. **Rule 2**: Never store encryption keys in git or client-side storage.
3. **Rule 3**: Never return decrypted content without explicit recipient verification.
4. **Rule 4**: Sanitize all error responses: return generic codes to users, detailed sanitized traces only to secure internal telemetry.
