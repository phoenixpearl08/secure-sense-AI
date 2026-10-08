'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  FileText, 
  Lock, 
  Shield, 
  Key, 
  CheckCircle2, 
  ArrowRight, 
  Flame, 
  Copy, 
  Check, 
  ExternalLink,
  DollarSign,
  Clock,
  BookOpen,
  ShieldAlert,
  Smartphone
} from 'lucide-react';
import { DocumentData, SecurityPolicyData } from '@/types';

const CONFIDENTIAL_SAMPLE = `CONFIDENTIAL EXECUTIVE ACQUISITION TERM SHEET
Effective Date: November 1, 2026
Target Entity: CyberVault Technologies Ltd.
Acquiring Entity: Global Sentinel Corporation

1.0 Transaction Consideration
Total acquisition purchase price shall be $42,500,000 USD payable in cash upon closing. Escrow deposit of $4,250,000 USD shall be wired within 5 business days of signing.

2.0 Exclusivity & Deadlines
The parties agree to a 30-day strict exclusivity period ending December 1, 2026. Closing shall occur no later than December 15, 2026.

3.0 Restrictive Covenants & Key Obligations
Executive founders shall execute 3-year non-competition agreements. Neither party shall disclose transaction terms to third parties without prior written consent.`;

export default function CombinedModePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Document Data
  const [docTitle, setDocTitle] = useState('Acquisition Term Sheet Alpha');
  const [docContent, setDocContent] = useState(CONFIDENTIAL_SAMPLE);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [document, setDocument] = useState<DocumentData | null>(null);

  // Step 2: AI Security Intent
  const [aiIntent, setAiIntent] = useState('Send this confidential term sheet to my legal head. Highly confidential. One-time access from registered device. OTP required. Expire tomorrow.');
  const [generatingPolicy, setGeneratingPolicy] = useState(false);
  const [policy, setPolicy] = useState<SecurityPolicyData | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('legal.head@sentinel-corp.com');

  // Step 3: Encryption & Link Generation
  const [encrypting, setEncrypting] = useState(false);
  const [vaultResult, setVaultResult] = useState<{
    accessId: string;
    accessUrl: string;
    rawOtp?: string;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);

  // Handle Step 1 -> Analyze Document
  const handleAnalyze = async () => {
    setAnalyzingDoc(true);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: docTitle,
          textContent: docContent,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDocument(data.data);
        setStep(2);
      } else {
        alert(data.error || 'Document analysis failed');
      }
    } catch {
      alert('Network error during analysis');
    } finally {
      setAnalyzingDoc(false);
    }
  };

  // Handle Step 2 -> AI Policy Generation
  const handleGeneratePolicy = async () => {
    setGeneratingPolicy(true);
    try {
      const res = await fetch('/api/security/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiIntent }),
      });
      const data = await res.json();
      if (data.success && data.data?.policy) {
        setPolicy(data.data.policy);
        if (data.data.policy.recipientEmail) {
          setRecipientEmail(data.data.policy.recipientEmail);
        }
      } else {
        alert(data.error || 'Policy generation failed');
      }
    } catch {
      alert('Network error during policy generation');
    } finally {
      setGeneratingPolicy(false);
    }
  };

  // Handle Step 3 -> Encrypt Document & Create Vault Item
  const handleEncryptAndShare = async () => {
    if (!document || !policy) return;
    setEncrypting(true);

    try {
      const res = await fetch('/api/vault/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.title,
          plaintextSecret: document.extractedText,
          recipientEmail,
          policy,
          documentId: document.id,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setVaultResult({
          accessId: data.data.accessId,
          accessUrl: `${window.location.origin}${data.data.accessUrl}`,
          rawOtp: data.data.rawOtp,
        });
        setStep(4);
      } else {
        alert(data.error || 'Failed to encrypt document');
      }
    } catch {
      alert('Error creating secure transmission link');
    } finally {
      setEncrypting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Combined Mode &bull; Flagship Hackathon Flow
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Document Intelligence + Adaptive AI Security Policy + Authenticated AES-256-GCM Encryption + Atomic 1-Time Destruction.
        </p>

        {/* Multi-Step Progression Bar */}
        <div className="grid grid-cols-4 gap-2 pt-6">
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${step >= 1 ? 'bg-cyan-950/60 border-cyan-500/50 text-cyan-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">1</span>
            <span className="truncate">DocSense Ingestion</span>
          </div>
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${step >= 2 ? 'bg-indigo-950/60 border-indigo-500/50 text-indigo-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-indigo-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">2</span>
            <span className="truncate">Sensitivity Analysis</span>
          </div>
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${step >= 3 ? 'bg-purple-950/60 border-purple-500/50 text-purple-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-purple-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">3</span>
            <span className="truncate">AI Policy Creation</span>
          </div>
          <div className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-2 ${step >= 4 ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-300' : 'bg-slate-900 border-slate-800 text-slate-500'}`}>
            <span className="w-5 h-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold text-[11px]">4</span>
            <span className="truncate">Secure AES Link</span>
          </div>
        </div>
      </div>

      {/* STEP 1: INGESTION */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <FileText className="w-5 h-5 text-indigo-400" />
              <span>Step 1: Upload or Review Confidential Document</span>
            </h2>
            <p className="text-xs text-slate-400">
              DocSenseAI will parse financial amounts, critical deadlines, and contractual liabilities.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Document Payload</label>
              <textarea
                rows={8}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzingDoc}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzingDoc ? 'Analyzing Document Intelligence...' : 'Analyze & Detect Liabilities &rarr;'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SENSITIVITY REVIEW */}
      {step === 2 && document && (
        <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Step 2: DocSenseAI Identified Sensitive Elements</span>
              </h2>
              <p className="text-xs text-slate-400">
                Identified high-stakes financial figures and obligations that mandate RealityVault encryption.
              </p>
            </div>
            <span className="text-xs font-mono px-2.5 py-1 rounded bg-amber-950 text-amber-300 border border-amber-800">
              HIGH CONFIDENTIALITY ASSET
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {document.insights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  {insight.category === 'FINANCIAL' && <DollarSign className="w-4 h-4 text-emerald-400" />}
                  {insight.category === 'DEADLINE' && <Clock className="w-4 h-4 text-amber-400" />}
                  {insight.category === 'OBLIGATION' && <BookOpen className="w-4 h-4 text-indigo-400" />}
                  {insight.category === 'RISK' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  <span>{insight.title}</span>
                </div>
                <p className="text-slate-400">{insight.description}</p>
                <div className="text-[10px] font-mono text-cyan-400 pt-1">
                  Source: {insight.sectionRef || `Page ${insight.pageNumber}`}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-2">
            <button
              onClick={() => setStep(1)}
              className="text-xs text-slate-400 hover:text-white"
            >
              &larr; Back to Ingestion
            </button>
            <button
              onClick={() => setStep(3)}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <span>Proceed to AI Security Intent &rarr;</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: AI SECURITY INTENT & COMPILATION */}
      {step === 3 && (
        <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div className="space-y-1">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <span>Step 3: Dictate Security Intent to RealityVault AI</span>
            </h2>
            <p className="text-xs text-slate-400">
              Natural language intent is compiled into a deterministic, schema-validated security policy.
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-cyan-300">Natural Language Security Instruction</label>
              <textarea
                rows={3}
                value={aiIntent}
                onChange={(e) => setAiIntent(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-cyan-950/20 border border-cyan-800/50 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <button
              type="button"
              onClick={handleGeneratePolicy}
              disabled={generatingPolicy}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{generatingPolicy ? 'AI Compiling Policy...' : 'Compile Security Policy with AI'}</span>
            </button>

            {/* Structured Policy Display */}
            {policy && (
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/50 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Schema-Validated Policy</span>
                  </span>
                  <span className="font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    {policy.securityLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Max Views:</span>
                    <span className="text-rose-400 font-bold">{policy.maxViews} (Atomic)</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Lifecycle:</span>
                    <span className="text-amber-400 font-bold">{policy.expiresInHours} Hours</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">OTP Challenge:</span>
                    <span className="text-emerald-400 font-bold">{policy.otpRequired ? 'ACTIVE' : 'OFF'}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Device Verification:</span>
                    <span className="text-indigo-400 font-bold">{policy.deviceRequired ? 'ENFORCED' : 'OFF'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300">Authorized Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs"
                  />
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                onClick={() => setStep(2)}
                className="text-xs text-slate-400 hover:text-white"
              >
                &larr; Back to Sensitivity
              </button>
              <button
                onClick={handleEncryptAndShare}
                disabled={!policy || encrypting}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-xs shadow-lg transition disabled:opacity-50 flex items-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{encrypting ? 'Encrypting with AES-256-GCM...' : 'Encrypt & Generate 1-Time Access Link &rarr;'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: RESULT & RECEIVER TEST */}
      {step === 4 && vaultResult && (
        <div className="glass-panel p-6 sm:p-8 border-emerald-500/40 space-y-6 shadow-2xl animate-fade-in">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-bold text-white">Document Encrypted & Transmission Live</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              The contract is secured using AES-256-GCM authenticated encryption. Test the one-time reveal flow below!
            </p>
          </div>

          <div className="space-y-4 max-w-lg mx-auto">
            {/* Access URL */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Non-Enumerable Secure Access Link:</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={vaultResult.accessUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(vaultResult.accessUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2000);
                  }}
                  className="px-3 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition flex items-center gap-1"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* OTP Box */}
            {vaultResult.rawOtp && (
              <div className="p-3.5 rounded-xl bg-indigo-950/60 border border-indigo-700/60 flex items-center justify-between">
                <div>
                  <span className="text-xs text-indigo-300 block font-semibold">One-Time Password (OTP):</span>
                  <span className="font-mono text-2xl font-black tracking-widest text-white">
                    {vaultResult.rawOtp}
                  </span>
                </div>
                <span className="text-[10px] text-amber-400 font-mono bg-indigo-900 px-2 py-1 rounded">
                  FOR RECEIVER VERIFICATION
                </span>
              </div>
            )}

            {/* Demo instructions */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-cyan-400">Judges Demo Instructions:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Click &ldquo;Launch Receiver Verification Portal&rdquo; below to open the receiver flow.</li>
                <li>Enter recipient email: <code className="text-cyan-300">{recipientEmail}</code></li>
                <li>Enter OTP: <code className="text-indigo-300">{vaultResult.rawOtp}</code></li>
                <li>Verify and reveal the decrypted document.</li>
                <li>Reload or re-access the link to verify atomic destruction (&ldquo;ALREADY CONSUMED&rdquo;).</li>
              </ol>
            </div>

            <Link
              href={vaultResult.accessUrl}
              target="_blank"
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-sm shadow-xl flex items-center justify-center gap-2 transition"
            >
              <span>Launch Receiver Verification Portal</span>
              <ExternalLink className="w-4 h-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
