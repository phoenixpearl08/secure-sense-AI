'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, EyeOff, ArrowLeft, Lock, Database, Trash2, Key, CheckCircle2 } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Overview
        </Link>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <EyeOff className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Zero-Knowledge & Privacy Policy</h1>
            <p className="text-xs text-slate-400 font-mono">
              Version 2.4 &bull; Last Revised October 2026 &bull; SECURE SENSE AI Cryptographic Framework
            </p>
          </div>
        </div>
      </div>

      {/* Main Sections */}
      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>1. Zero Plaintext Secret Architecture</span>
          </h2>
          <p>
            Our core mission is preventing unauthorized exposure of confidential communications and intellectual property.
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
            <li>
              <strong>Authenticated Encryption:</strong> All sensitive text, credentials, documents, and payloads stored in Secure Sense AI are encrypted with AES-256-GCM.
            </li>
            <li>
              <strong>No Plaintext Key Storage:</strong> Encryption keys are segregated from application database storage and are never logged.
            </li>
            <li>
              <strong>Sender Privacy Option:</strong> Senders can designate shares with <code className="text-cyan-300">Maximum Privacy Mode</code> to hide sender identity metadata from recipients.
            </li>
          </ul>
        </section>

        {/* Section 2 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Database className="w-4 h-4 text-purple-400" />
            <span>2. Metadata-Only Audit Logging</span>
          </h2>
          <p>
            Compliance audits and threat intelligence require tracking who accessed an asset and when. However, SECURE SENSE AI strictly enforces metadata sanitization:
          </p>
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-semibold font-mono text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" /> What We Log:
            </div>
            <p className="text-slate-400">
              Timestamp, Access ID, Action Type (e.g. <code className="text-slate-200">VERIFY_CHALLENGE</code>, <code className="text-slate-200">ITEM_REVEALED</code>), Outcome status, Masked IP subnet, and Device Fingerprint Hash.
            </p>
            <div className="flex items-center gap-2 text-rose-400 font-semibold font-mono text-[11px] pt-1">
              <EyeOff className="w-3.5 h-3.5" /> What We NEVER Log:
            </div>
            <p className="text-slate-400">
              Plaintext secret contents, master passwords, raw 6-digit OTP codes, decryption keys, or document file bodies.
            </p>
          </div>
        </section>

        {/* Section 3 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Trash2 className="w-4 h-4 text-rose-400" />
            <span>3. Cryptographic Destruction & Ephemeral Buffering</span>
          </h2>
          <p className="text-xs text-slate-400">
            For items marked with <code className="text-cyan-300">zeroPersistence: true</code> or single-use consumption rules, the backend immediately executes an atomic purge upon reveal. Ciphertext is overwritten with cryptographically random garbage and purged from database records. Temporary memory buffers used during device-to-device transfers are scrubbed immediately upon session closure.
          </p>
        </section>

        {/* Section 4 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="w-4 h-4 text-emerald-400" />
            <span>4. DocSenseAI Model & Data Boundaries</span>
          </h2>
          <p className="text-xs text-slate-400">
            Documents uploaded to DocSenseAI for OCR, obligation matrix extraction, and grounded Q&A are processed within secure memory context. Customer documents are <strong>never</strong> used to train public machine learning foundation models or retained across unrelated customer tenants.
          </p>
        </section>

        {/* SECTION 5: INTERACTIVE PRIVACY CONTROL CENTER */}
        <section className="glass-panel p-6 border-cyan-900/60 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/40 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>Interactive Privacy & Data Sovereignty Console</span>
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Manage active browser sessions, download full data portability archive, or trigger permanent cryptographic deletion.
              </p>
            </div>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
              GDPR & CCPA Compliant
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Tool 1: Session Invalidation */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> Session Revocation
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Invalidate all other authenticated sessions across browsers and devices immediately.
                </p>
              </div>
              <button
                onClick={async () => {
                  if (confirm('Revoke all other active sessions for your account?')) {
                    const res = await fetch('/api/privacy/sessions', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'REVOKE_ALL_SESSIONS' }),
                    }).then((r) => r.json());
                    alert(res.message || (res.success ? 'All sessions revoked.' : res.error));
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-300 font-semibold text-xs transition font-mono"
              >
                Revoke All Sessions
              </button>
            </div>

            {/* Tool 2: Data Portability Export */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <Database className="w-3.5 h-3.5 text-cyan-400" /> Data Portability Export
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Export your full profile, vault item metadata, document indices, and audit trail in JSON format.
                </p>
              </div>
              <button
                onClick={async () => {
                  try {
                    const res = await fetch('/api/privacy/export');
                    const json = await res.json();
                    if (!json.success) {
                      alert(json.error || 'Export failed. Please ensure you are logged in.');
                      return;
                    }
                    const blob = new Blob([JSON.stringify(json.data, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `securesense_privacy_export_${Date.now()}.json`;
                    a.click();
                  } catch {
                    alert('Export failed.');
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 font-semibold text-xs transition font-mono"
              >
                Export My Data (.json)
              </button>
            </div>

            {/* Tool 3: Cryptographic Data Erasure */}
            <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-1.5">
                <div className="text-xs font-bold text-white flex items-center gap-1.5 font-mono">
                  <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Right to Erasure
                </div>
                <p className="text-[11px] text-slate-400 leading-normal">
                  Permanently purge all vault items, documents, and credentials from the system.
                </p>
              </div>
              <button
                onClick={async () => {
                  const input = prompt('Type "DELETE_ALL_MY_DATA" to permanently erase all personal records and shares:');
                  if (input === 'DELETE_ALL_MY_DATA') {
                    const res = await fetch('/api/privacy/delete', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ confirmation: input }),
                    }).then((r) => r.json());
                    if (res.success) {
                      alert('Data permanently purged. Redirecting to home.');
                      window.location.href = '/';
                    } else {
                      alert(res.error || 'Deletion failed');
                    }
                  }
                }}
                className="w-full py-2 px-3 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-300 font-semibold text-xs transition font-mono"
              >
                Erase All Data
              </button>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div>&copy; 2026 SECURE SENSE AI Systems Enclave. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/terms" className="hover:text-cyan-400 transition font-mono">
            Terms of Service
          </Link>
          <Link href="/dashboard" className="hover:text-cyan-400 transition font-mono">
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
