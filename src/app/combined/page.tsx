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
  Smartphone,
  EyeOff,
  Timer,
  AlertTriangle,
  QrCode
} from 'lucide-react';
import { DocumentData, SecurityPolicyData, SecurityScoreReport, PolicyConflictWarning } from '@/types';
import FileUploadZone, { UploadedFileItem } from '@/components/upload/FileUploadZone';

const SAMPLE_TERM_SHEET = `CONFIDENTIAL EXECUTIVE ACQUISITION TERM SHEET
Effective Date: November 1, 2026
Target Entity: CyberVault Technologies Ltd.
Acquiring Entity: Global Sentinel Corporation

1.0 Transaction Consideration
Total acquisition purchase price shall be $42,500,000 USD payable in cash upon closing. Escrow deposit of $4,250,000 USD shall be wired within 5 business days of signing.

2.0 Exclusivity & Deadlines
The parties agree to a 30-day strict exclusivity period ending December 1, 2026. Closing shall occur no later than December 15, 2026.

3.0 Restrictive Covenants & Key Obligations
Executive founders shall execute 3-year non-competition agreements. Neither party shall disclose transaction terms to third parties without prior written consent. Personal tax identifiers: TIN-982-41-9901.`;

const SAMPLE_MEDICAL_IP = `RESTRICTED MEDICAL RESEARCH DOSSIER - BIO-SYNTHESIS AGENT #409
Protocol Date: October 2026
Confidentiality Status: RESTRICTED TRADE SECRET

1.0 Synthesis Formula & Yield Metrics
Batch purity achieved 99.8% with molecular weight 452.1 g/mol. Formula variants A & B are protected under patent pending PCT/US26/9021.

2.0 Compliance & Destruction Mandate
All lab notes and chemical telemetry must be securely purged within 72 hours of trial completion. Immediate revocation required upon unauthorized personnel access.`;

export default function CombinedModePage() {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Step 1: Document Data
  const [docTitle, setDocTitle] = useState('Acquisition Term Sheet Alpha');
  const [docContent, setDocContent] = useState(SAMPLE_TERM_SHEET);
  const [uploadedFileItem, setUploadedFileItem] = useState<UploadedFileItem | null>(null);
  const [analyzingDoc, setAnalyzingDoc] = useState(false);
  const [document, setDocument] = useState<DocumentData | null>(null);

  // Step 2: AI Security Intent
  const [aiIntent, setAiIntent] = useState(
    'Send this confidential contract to my legal counsel. Highly confidential. One-time access only. Must be opened from his registered device with OTP verification. Hide my identity so receiver cannot see who sent it. Destroy immediately upon first view.'
  );
  const [generatingPolicy, setGeneratingPolicy] = useState(false);
  const [policy, setPolicy] = useState<SecurityPolicyData | null>(null);
  const [policyScore, setPolicyScore] = useState<SecurityScoreReport | null>(null);
  const [policyConflicts, setPolicyConflicts] = useState<PolicyConflictWarning[]>([]);
  const [recipientEmail, setRecipientEmail] = useState('legal.counsel@sentinel-corp.com');

  // Step 3: Encryption & Link Generation
  const [encrypting, setEncrypting] = useState(false);
  const [vaultResult, setVaultResult] = useState<{
    accessId: string;
    accessUrl: string;
    qrCode?: string;
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
          title: docTitle || uploadedFileItem?.displayName || 'Confidential Document',
          fileName: uploadedFileItem?.originalName || `${(docTitle || 'Document').replace(/\s+/g, '_')}.pdf`,
          mimeType: uploadedFileItem?.mimeType || 'application/pdf',
          fileBufferBase64: uploadedFileItem?.base64Data,
          textContent: docContent || undefined,
        }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setDocument(data.data);
        if (data.data.extractedText) {
          setDocContent(data.data.extractedText);
        }
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
        setPolicyScore(data.data.score || null);
        setPolicyConflicts(data.data.conflicts || []);
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
      const resolvedBinary = document.fileBufferBase64 || uploadedFileItem?.base64Data;
      const res = await fetch('/api/vault/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: document.title,
          plaintextSecret: document.extractedText,
          recipientEmail,
          policy,
          documentId: document.id,
          fileName: uploadedFileItem?.originalName || document.fileName,
          fileSize: uploadedFileItem?.size || document.fileSize,
          mimeType: uploadedFileItem?.mimeType || document.mimeType,
          fileData: resolvedBinary || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setVaultResult({
          accessId: data.data.accessId,
          accessUrl: `${window.location.origin}${data.data.accessUrl}`,
          qrCode: data.data.qrCode,
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Top Header */}
      <div className="border-b border-slate-800 pb-5">
        <div className="flex items-center space-x-2">
          <Sparkles className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            Combined Mode &bull; Flagship Hackathon Flow
          </h1>
        </div>
        <p className="text-sm text-slate-400 mt-1">
          Document Intelligence + Adaptive AI Policy + AES-256-GCM + Maximum Privacy Sender Mode + Atomic Destruction.
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
            <span className="truncate">Secure Link &amp; QR</span>
          </div>
        </div>
      </div>

      {/* STEP 1: INGESTION */}
      {step === 1 && (
        <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-400" />
                <span>Step 1: Upload or Review Confidential Document</span>
              </h2>
              <p className="text-xs text-slate-400">
                DocSenseAI will parse financial amounts, critical deadlines, contractual liabilities, and sensitivity classification.
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setDocTitle('Acquisition Term Sheet Alpha');
                  setDocContent(SAMPLE_TERM_SHEET);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Sample Contract
              </button>
              <button
                type="button"
                onClick={() => {
                  setUploadedFileItem(null);
                  setDocTitle('Restricted Medical IP Synthesis');
                  setDocContent(SAMPLE_MEDICAL_IP);
                }}
                className="px-2.5 py-1.5 text-xs rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              >
                Sample Secret IP
              </button>
            </div>
          </div>

          {/* Reusable File & Folder Upload Component */}
          <FileUploadZone
            singleFile={true}
            onSingleFileParsed={(item) => {
              setUploadedFileItem(item);
              setDocTitle(item.displayName);
              if (item.textSnippet) {
                setDocContent(item.textSnippet);
              }
            }}
            onFilesChange={(items) => {
              if (items.length > 0) {
                setUploadedFileItem(items[0]);
                setDocTitle(items[0].displayName);
                if (items[0].textSnippet) {
                  setDocContent(items[0].textSnippet);
                }
              } else {
                setUploadedFileItem(null);
              }
            }}
            title="Upload Confidential File or Folder Package"
            description="Drop any PDF, DOCX, Spreadsheet, Image, or Folder to initiate the Zero-Trust Combined Pipeline."
          />

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Document Title</label>
              <input
                type="text"
                value={docTitle}
                onChange={(e) => setDocTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Document Content Preview / Payload</label>
              <textarea
                rows={7}
                value={docContent}
                onChange={(e) => setDocContent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              onClick={handleAnalyze}
              disabled={analyzingDoc}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzingDoc ? 'Analyzing Document Intelligence & Risk...' : 'Analyze Document & Detect Liabilities \u2192'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: SENSITIVITY REVIEW */}
      {step === 2 && document && (
        <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-800 pb-4">
            <div className="space-y-1">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-amber-400" />
                <span>Step 2: DocSenseAI Security Classification &amp; Insights</span>
              </h2>
              <p className="text-xs text-slate-400">
                Automated risk scoring identified high-stakes liabilities mandating Secure Sense AI protection.
              </p>
            </div>
            {document.classification && (
              <div className="flex items-center gap-2">
                <span className={`text-xs font-mono font-bold px-3 py-1 rounded-full border ${
                  document.classification.sensitivityLevel === 'CRITICAL' ? 'bg-rose-950/80 text-rose-300 border-rose-700' :
                  document.classification.sensitivityLevel === 'HIGH' ? 'bg-amber-950/80 text-amber-300 border-amber-700' :
                  'bg-cyan-950/80 text-cyan-300 border-cyan-700'
                }`}>
                  Sensitivity: {document.classification.sensitivityLevel}
                </span>
                <span className="text-xs font-mono px-3 py-1 rounded-full bg-slate-900 text-slate-300 border border-slate-700">
                  Risk Score: {document.classification.overallRiskScore}/100
                </span>
              </div>
            )}
          </div>

          {/* Classification Summary Card */}
          {document.classification && (
            <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold">Recommended Vault Security Level:</span>
                <span className="font-mono font-bold text-cyan-400 bg-cyan-950/80 px-2.5 py-0.5 rounded border border-cyan-800">
                  {document.classification.recommendedVaultPolicy}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {document.classification.justification}
              </p>
              {(document.classification.detectedIndicators?.length ?? 0) > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {document.classification.detectedIndicators?.map((ind: string, i: number) => (
                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      {ind}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Extracted Insights Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {document.insights.map((insight) => (
              <div key={insight.id} className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs">
                <div className="font-bold text-slate-200 flex items-center gap-1.5">
                  {insight.category === 'FINANCIAL' && <DollarSign className="w-4 h-4 text-emerald-400" />}
                  {insight.category === 'DEADLINE' && <Clock className="w-4 h-4 text-amber-400" />}
                  {insight.category === 'OBLIGATION' && <BookOpen className="w-4 h-4 text-indigo-400" />}
                  {insight.category === 'RISK' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                  <span>{insight.title}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">{insight.description}</p>
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
              onClick={() => {
                setStep(3);
                // Pre-trigger policy compile
                handleGeneratePolicy();
              }}
              className="px-6 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg transition flex items-center gap-2"
            >
              <span>Accept &amp; Proceed to AI Policy Intent \u2192</span>
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
              <span>Step 3: Dictate Security Intent to Secure Sense AI</span>
            </h2>
            <p className="text-xs text-slate-400">
              Natural language intent is compiled into a deterministic, schema-validated security policy.
            </p>
          </div>

          {/* Quick Intent Chips */}
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setAiIntent('Send this anonymously. Highly confidential. One-time access from registered device. OTP required. Expire tomorrow. Receiver must not know who sent it.');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-cyan-500/50 text-slate-300 text-[11px] transition flex items-center gap-1"
            >
              <EyeOff className="w-3 h-3 text-cyan-400" />
              <span>Maximum Privacy + One-Time</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiIntent('Highly confidential. Zero-persistence. 60 seconds view window. One-time access. OTP required. No downloads allowed.');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-amber-500/50 text-slate-300 text-[11px] transition flex items-center gap-1"
            >
              <Timer className="w-3 h-3 text-amber-400" />
              <span>Zero-Persistence + 60s Timed View</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setAiIntent('High security board transfer. Recipient required. Registered device only. Multi-factor OTP. Expire in 24 hours.');
              }}
              className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 hover:border-indigo-500/50 text-slate-300 text-[11px] transition flex items-center gap-1"
            >
              <Shield className="w-3 h-3 text-indigo-400" />
              <span>Zero-Trust Enterprise</span>
            </button>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-cyan-300">Natural Language Security Instruction</label>
              <textarea
                rows={3}
                value={aiIntent}
                onChange={(e) => setAiIntent(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-cyan-950/20 border border-cyan-800/50 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleGeneratePolicy}
                disabled={generatingPolicy}
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-indigo-600/20"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{generatingPolicy ? 'AI Compiling Policy...' : 'Compile Security Policy with AI'}</span>
              </button>

              {policyScore && (
                <div className="flex items-center gap-2 text-xs font-mono">
                  <span className="text-slate-400">Security Score:</span>
                  <span className={`px-2 py-0.5 rounded font-bold ${
                    policyScore.score >= 80 ? 'bg-emerald-950 text-emerald-300 border border-emerald-800' :
                    policyScore.score >= 50 ? 'bg-amber-950 text-amber-300 border border-amber-800' :
                    'bg-slate-900 text-slate-300 border border-slate-800'
                  }`}>
                    {policyScore.score}/100 &bull; {policyScore.rating}
                  </span>
                </div>
              )}
            </div>

            {/* Policy Conflicts Warning Banner */}
            {policyConflicts.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 space-y-1">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Instruction Conflicts Detected &amp; Safely Resolved:</span>
                </div>
                {policyConflicts.map((c, i) => (
                  <p key={i} className="text-[11px] text-amber-200/80 pl-6">
                    &bull; {c.message} (Resolved to safest setting: <code className="font-mono text-white">{String(c.resolvedValue)}</code>)
                  </p>
                ))}
              </div>
            )}

            {/* Structured Policy Display */}
            {policy && (
              <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/50 space-y-3 text-xs animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-cyan-400" />
                    <span>Backend-Validated Security Policy</span>
                  </span>
                  <span className="font-mono text-cyan-400 px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800">
                    {policy.securityLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Atomic Views:</span>
                    <span className="text-rose-400 font-bold">{policy.maxViews} View</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Lifecycle Expiry:</span>
                    <span className="text-amber-400 font-bold">{policy.expiresInHours} Hours</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">OTP Challenge:</span>
                    <span className="text-emerald-400 font-bold">{policy.otpRequired ? 'ENFORCED' : 'OFF'}</span>
                  </div>
                  <div className="p-2 rounded bg-slate-950 border border-slate-800">
                    <span className="text-slate-400 block">Device Trust:</span>
                    <span className="text-indigo-400 font-bold">{policy.registeredDeviceOnly ? 'REGISTERED ONLY' : policy.deviceRequired ? 'CHALLENGE' : 'OFF'}</span>
                  </div>
                </div>

                {/* Privacy & Destruction Feature Flags */}
                <div className="flex flex-wrap gap-2 pt-1">
                  <div className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 ${
                    policy.senderIdentityVisibility === 'HIDDEN' ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700' : 'bg-slate-950 text-slate-500'
                  }`}>
                    <EyeOff className="w-3.5 h-3.5" />
                    <span>Sender Privacy: {policy.senderIdentityVisibility === 'HIDDEN' ? 'MAXIMUM PRIVACY (HIDDEN)' : 'VISIBLE'}</span>
                  </div>

                  <div className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 ${
                    policy.zeroPersistence ? 'bg-purple-950/80 text-purple-300 border border-purple-700' : 'bg-slate-950 text-slate-500'
                  }`}>
                    <Flame className="w-3.5 h-3.5" />
                    <span>Zero-Persistence: {policy.zeroPersistence ? 'ACTIVE (SHRED ON VIEW)' : 'OFF'}</span>
                  </div>

                  <div className={`px-2.5 py-1 rounded text-[11px] font-mono flex items-center gap-1.5 ${
                    policy.viewDurationSeconds ? 'bg-amber-950/80 text-amber-300 border border-amber-700' : 'bg-slate-950 text-slate-500'
                  }`}>
                    <Timer className="w-3.5 h-3.5" />
                    <span>View Duration: {policy.viewDurationSeconds ? `${policy.viewDurationSeconds}s Countdown` : 'UNRESTRICTED'}</span>
                  </div>
                </div>

                <div className="space-y-1.5 pt-2">
                  <label className="text-xs font-semibold text-slate-300">Authorized Recipient Email</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-100 text-xs font-mono"
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
                <span>{encrypting ? 'Encrypting with AES-256-GCM...' : 'Encrypt & Generate 1-Time Access Link \u2192'}</span>
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
            <h2 className="text-2xl font-bold text-white">Document Encrypted &amp; Transmission Live</h2>
            <p className="text-xs text-slate-400 max-w-md mx-auto">
              Protected with AES-256-GCM authenticated encryption. Non-enumerable access link and optical QR code generated below.
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

            {/* QR Code and Badges */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center p-4 rounded-xl bg-slate-900 border border-slate-800">
              {vaultResult.qrCode ? (
                <div className="flex flex-col items-center justify-center space-y-1.5 p-2 bg-slate-950 rounded-lg border border-slate-800">
                  <img
                    src={vaultResult.qrCode}
                    alt="Secure Access QR Code"
                    className="w-32 h-32 rounded bg-white p-1"
                  />
                  <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                    <QrCode className="w-3 h-3 text-cyan-400" />
                    Optical Scan Access
                  </span>
                </div>
              ) : (
                <div className="text-center p-4 text-xs text-slate-500">QR Code ready</div>
              )}

              <div className="space-y-2 text-xs">
                {policy?.senderIdentityVisibility === 'HIDDEN' && (
                  <div className="p-2.5 rounded-lg bg-cyan-950/60 border border-cyan-800/80">
                    <span className="font-bold text-cyan-300 block flex items-center gap-1">
                      <EyeOff className="w-3.5 h-3.5" />
                      Sender Identity Hidden
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Receiver portal will NOT display your name, email, or avatar.
                    </span>
                  </div>
                )}

                {policy?.zeroPersistence && (
                  <div className="p-2.5 rounded-lg bg-purple-950/60 border border-purple-800/80">
                    <span className="font-bold text-purple-300 block flex items-center gap-1">
                      <Flame className="w-3.5 h-3.5" />
                      Zero-Persistence Active
                    </span>
                    <span className="text-[11px] text-slate-400">
                      Ciphertext destroyed immediately from disk upon first access.
                    </span>
                  </div>
                )}
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
                  RECEIVER MFA
                </span>
              </div>
            )}

            {/* Demo instructions */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs text-slate-300 space-y-2">
              <div className="font-bold text-cyan-400">Judges Demo Instructions:</div>
              <ol className="list-decimal list-inside space-y-1 text-slate-400">
                <li>Click &ldquo;Launch Receiver Verification Portal&rdquo; below.</li>
                <li>Notice sender identity shows &ldquo;Identity Hidden (Maximum Privacy Mode)&rdquo;.</li>
                <li>Enter recipient email: <code className="text-cyan-300">{recipientEmail}</code></li>
                <li>Enter OTP: <code className="text-indigo-300">{vaultResult.rawOtp}</code></li>
                <li>Reveal and read the decrypted document.</li>
                <li>Reload the URL to observe atomic 1-time lockout (&ldquo;ACCESS DENIED / CONSUMED&rdquo;).</li>
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
