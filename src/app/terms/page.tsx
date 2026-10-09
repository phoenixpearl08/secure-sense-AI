'use client';

import React from 'react';
import Link from 'next/link';
import { Shield, FileCheck, ArrowLeft, Lock, AlertTriangle, Cpu, Terminal } from 'lucide-react';

export default function TermsOfServicePage() {
  return (
    <div className="max-w-4xl mx-auto py-12 space-y-10">
      {/* Header */}
      <div className="border-b border-slate-800 pb-6 space-y-3">
        <Link href="/" className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-cyan-400 transition font-mono">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Platform Overview
        </Link>
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
            <FileCheck className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Terms of Service & Cryptographic Protocols</h1>
            <p className="text-xs text-slate-400 font-mono">
              Version 2.4 &bull; Effective October 2026 &bull; SECURE SENSE AI Systems Enclave
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-8 text-sm text-slate-300 leading-relaxed">
        {/* Section 1 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>1. Core Cryptographic Law & Operating Philosophy</span>
          </h2>
          <p>
            SECURE SENSE AI operates under an immutable architecture law:{' '}
            <strong className="text-cyan-300">AI Recommends. Backend Authorizes. Cryptography Enforces. Audit Records Metadata. Lifecycle Destroys.</strong>
          </p>
          <p className="text-xs text-slate-400">
            All secret vault payloads and secure files are encrypted with industry-standard AES-256-GCM authenticated encryption utilizing cryptographically secure unique Initialization Vectors (IVs) and authentication tags. Payloads are never decrypted or inspected in transit without authorized cryptographic challenge fulfillment.
          </p>
        </section>

        {/* Section 2 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>2. Security Assurance & Realistic Risk Disclosure</span>
          </h2>
          <p>
            While SECURE SENSE AI enforces zero-trust access controls, hardware fingerprint binding, time-bounded expiration, and atomic one-time destruction, we adhere to the cybersecurity principle of honest disclosure:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-400">
            <li>
              <strong>No Absolute Immunity:</strong> No computer system can guarantee 100% defense against compromised host hardware, local kernel keyloggers, physical camera recordings of client displays, or operator social engineering.
            </li>
            <li>
              <strong>Browser Controlled Viewer Boundaries:</strong> Controlled viewing mode restricts DOM copying, downloading, and printing within browser capabilities, but cannot physically prevent external analog photographic capture of display screens.
            </li>
            <li>
              <strong>Audit Metadata Persistence:</strong> System logs record only sanitised operational metadata (IP hashes, device identifiers, timestamps, verification outcomes). Master passphrases, plaintext secrets, and decryption keys are strictly excluded from logging facilities.
            </li>
          </ul>
        </section>

        {/* Section 3 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Cpu className="w-4 h-4 text-purple-400" />
            <span>3. DocSenseAI Intelligence Boundary</span>
          </h2>
          <p>
            DocSenseAI provides automated document chunking, optical character recognition (OCR), contractual obligation matrix generation, financial breakdown, and grounded Q&A extraction.
          </p>
          <p className="text-xs text-slate-400">
            AI-generated summaries, inconsistency alerts, and policy recommendations are strictly advisory tools intended to accelerate security operator workflow. DocSenseAI does not render formal legal or financial advice. The human sender retains full responsibility for approving, editing, or enforcing security policies before payload transmission.
          </p>
        </section>

        {/* Section 4 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <span>4. Acceptable Use & Tenant Isolation</span>
          </h2>
          <p>
            Users covenant to utilize SECURE SENSE AI solely for authorized, lawful communication and compliance documentation. The following behaviors constitute material breach resulting in immediate operator revocation:
          </p>
          <ul className="list-disc pl-5 space-y-1 text-xs text-slate-400">
            <li>Attempting prompt-injection attacks to manipulate backend authorization constraints.</li>
            <li>Transmitting unauthorized malware, unlicensed spyware, or malicious exploit payloads.</li>
            <li>Cross-tenant brute-force attacks or replay attacks against one-time vault tokens.</li>
            <li>Reverse engineering cryptographic ephemeral relay buffers.</li>
          </ul>
        </section>

        {/* Section 5 */}
        <section className="glass-panel p-6 border-slate-800 space-y-3">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="w-4 h-4 text-cyan-400" />
            <span>5. Lifecycle & Cryptographic Destruction</span>
          </h2>
          <p className="text-xs text-slate-400">
            When a single-use vault item is consumed or an ephemeral transfer finishes, our zero-persistence daemon overwrites payload ciphertext and purges associated ephemeral session tokens. Cryptographically destroyed items cannot be reconstructed, even by platform administrators.
          </p>
        </section>
      </div>

      <div className="pt-6 border-t border-slate-800 flex flex-wrap items-center justify-between gap-4 text-xs text-slate-400">
        <div>&copy; 2026 SECURE SENSE AI Systems Enclave. All rights reserved.</div>
        <div className="flex gap-4">
          <Link href="/privacy" className="hover:text-cyan-400 transition font-mono">
            Privacy Policy
          </Link>
          <Link href="/dashboard" className="hover:text-cyan-400 transition font-mono">
            Command Center
          </Link>
        </div>
      </div>
    </div>
  );
}
