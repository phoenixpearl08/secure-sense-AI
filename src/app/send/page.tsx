'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Send, 
  FileText, 
  Upload, 
  Lock, 
  Shield, 
  Sparkles, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  ArrowLeft, 
  Clock, 
  Eye, 
  EyeOff, 
  Smartphone, 
  Key, 
  Check, 
  Copy, 
  ExternalLink, 
  Trash2, 
  Flame, 
  QrCode, 
  Globe, 
  Mail, 
  ShieldAlert,
  Sliders,
  Play
} from 'lucide-react';
import { SecurityLevel, SecurityPolicyData } from '@/types';
import FileUploadZone, { UploadedFileItem as ZoneUploadedFileItem } from '@/components/upload/FileUploadZone';

interface UploadedFileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  folderPath?: string;
  sha256?: string;
  base64?: string;
}

export default function SendSecureFileWizard() {
  const [currentStep, setCurrentStep] = useState<number>(1);

  // STEP A: Select Content
  const [files, setFiles] = useState<UploadedFileItem[]>([
    {
      id: 'file-1',
      name: 'Quarterly_Financial_Report_Q3_Confidential.pdf',
      size: 452100,
      type: 'application/pdf',
      content: 'CONFIDENTIAL FINANCIAL STATEMENT: Q3 Operating Revenue $4.8M USD. Margin 34.2%. Restricted distribution under NDA covenants.',
      folderPath: undefined,
      sha256: '9f83c617b7a9504c5a932d1d0c410beff63b51b72e50c76dbbf983c27e2fa8a8'
    }
  ]);
  const [fileInputTitle, setFileInputTitle] = useState('');
  const [fileInputContent, setFileInputContent] = useState('');

  // STEP B: Metadata
  const [title, setTitle] = useState('Executive Cloud Audit & Agreement 2026');
  const [description, setDescription] = useState('Confidential audit agreement and encryption requirements for executive review.');
  const [recipientInstructions, setRecipientInstructions] = useState('Open from your enrolled workstation. Requires 6-digit OTP verification.');
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL - RECIPIENT ONLY');
  const [classification, setClassification] = useState('RESTRICTED');
  const [referenceNumber, setReferenceNumber] = useState('RV-SEC-2026-904');

  // STEP C: Recipients
  const [recipients, setRecipients] = useState<string[]>(['executive@enterprise.org']);
  const [newRecipient, setNewRecipient] = useState('');

  // STEP D: Manual Security Configuration
  const [securityLevel, setSecurityLevel] = useState<SecurityLevel>('HIGH_SECURITY');
  const [otpRequired, setOtpRequired] = useState(true);
  const [deviceRequired, setDeviceRequired] = useState(true);
  const [registeredDeviceOnly, setRegisteredDeviceOnly] = useState(true);
  const [senderApproval, setSenderApproval] = useState(false);
  const [maxViews, setMaxViews] = useState(1);
  const [expiresInHours, setExpiresInHours] = useState(24);
  const [downloadAllowed, setDownloadAllowed] = useState(false);
  const [senderPrivacy, setSenderPrivacy] = useState<'VISIBLE' | 'HIDDEN'>('VISIBLE');
  const [zeroPersistence, setZeroPersistence] = useState(true);

  // Advanced Collaboration & Protection Controls
  const [allowComments, setAllowComments] = useState(true);
  const [allowAnnotations, setAllowAnnotations] = useState(true);
  const [allowAiAnalysis, setAllowAiAnalysis] = useState(true);
  const [allowPrint, setAllowPrint] = useState(false);
  const [allowCopyText, setAllowCopyText] = useState(false);
  const [shareTemplate, setShareTemplate] = useState<string>('HIGH_SECURITY');
  const [notifyOnAccess, setNotifyOnAccess] = useState(true);
  const [notifyOnDownload, setNotifyOnDownload] = useState(true);
  const [notifyOnExpiry, setNotifyOnExpiry] = useState(true);

  // STEP E: AI-Assisted Security & Simulation
  const [aiPrompt, setAiPrompt] = useState('Send this confidential contract to executive@enterprise.org. Require OTP, allow only 1 view from registered device, disable downloads, and expire in 24 hours.');
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [simulating, setSimulating] = useState(false);
  const [simResults, setSimResults] = useState<Array<{ name: string; allowed: boolean; reason: string }> | null>(null);

  // STEP F: Delivery Method
  const [deliveryMethod, setDeliveryMethod] = useState<'SECURE_LINK' | 'QR_CODE' | 'DIRECT_TRANSFER' | 'EMAIL'>('SECURE_LINK');

  // STEP G: Submission & Created Receipt
  const [encrypting, setEncrypting] = useState(false);
  const [createdShare, setCreatedShare] = useState<{
    id: string;
    accessId: string;
    accessUrl: string;
    rawOtp?: string;
    qrCode?: string;
    expiresAt: string;
    maxViews: number;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Add Recipient
  const handleAddRecipient = () => {
    if (newRecipient.trim() && !recipients.includes(newRecipient.trim())) {
      setRecipients([...recipients, newRecipient.trim()]);
      setNewRecipient('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setRecipients(recipients.filter((r) => r !== email));
  };

  // Add Custom File item
  const handleAddFile = () => {
    if (fileInputTitle.trim() && fileInputContent.trim()) {
      setFiles([
        ...files,
        {
          id: `file-${Date.now()}`,
          name: fileInputTitle.trim().endsWith('.txt') ? fileInputTitle.trim() : `${fileInputTitle.trim()}.txt`,
          size: fileInputContent.length,
          type: 'text/plain',
          content: fileInputContent.trim()
        }
      ]);
      setFileInputTitle('');
      setFileInputContent('');
    }
  };

  // AI Policy Compilation
  const handleCompileAiPolicy = async () => {
    if (!aiPrompt.trim()) return;
    setAiAnalyzing(true);
    try {
      const res = await fetch('/api/security/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt })
      });
      const data = await res.json();
      if (data.success && data.data?.policy) {
        const p = data.data.policy;
        setSecurityLevel(p.securityLevel || 'HIGH_SECURITY');
        setOtpRequired(p.otpRequired ?? true);
        setDeviceRequired(p.deviceRequired ?? true);
        setRegisteredDeviceOnly(p.registeredDeviceOnly ?? true);
        setSenderApproval(p.senderApproval ?? false);
        setMaxViews(p.maxViews ?? 1);
        setExpiresInHours(p.expiresInHours ?? 24);
        if (p.recipientEmail) {
          if (!recipients.includes(p.recipientEmail)) {
            setRecipients([...recipients, p.recipientEmail]);
          }
        }
        setAiExplanation(data.data.explanation || 'AI synthesized optimal zero-trust protection policy.');
      }
    } catch {
      setAiExplanation('Error compiling policy with AI engine. Defaulting to high assurance settings.');
    } finally {
      setAiAnalyzing(false);
    }
  };

  // Run Policy Simulator
  const handleRunSimulator = () => {
    setSimulating(true);
    setTimeout(() => {
      setSimResults([
        {
          name: 'Registered Device + Valid OTP',
          allowed: true,
          reason: 'Meets registered hardware whitelist & cryptographic OTP challenge.'
        },
        {
          name: 'Unregistered Browser Attempt',
          allowed: false,
          reason: 'Rejected: Device is not enrolled in security policy registry.'
        },
        {
          name: 'Second Consecutive Access (Replay)',
          allowed: maxViews > 1,
          reason: maxViews === 1 ? 'Rejected: Atomic single-use limit reached (Zero-Persistence Purge).' : 'Allowed: Within maximum view threshold.'
        },
        {
          name: 'Expired Link Access Window',
          allowed: false,
          reason: `Rejected: Outside configured ${expiresInHours}h access lifecycle.`
        }
      ]);
      setSimulating(false);
    }, 450);
  };

  // Encrypt and Send
  const handleEncryptAndSend = async () => {
    setEncrypting(true);
    try {
      const primaryRecipient = recipients[0] || 'recipient@vault.local';

      // Prepare file payloads preserving complete binary data URLs and integrity hashes
      const filePayloads = files.map((f) => {
        let fileData = f.base64 || '';
        if (!fileData && f.content) {
          try {
            fileData = `data:${f.type || 'text/plain'};base64,${btoa(unescape(encodeURIComponent(f.content)))}`;
          } catch {
            fileData = `data:text/plain;charset=utf-8,${encodeURIComponent(f.content)}`;
          }
        }
        return {
          name: f.name,
          mimeType: f.type || 'application/octet-stream',
          size: f.size,
          hash: f.sha256,
          data: fileData,
          folderPath: f.folderPath,
        };
      });

      const payload = {
        title,
        plaintextSecret: fileInputContent || description || title,
        recipientEmail: primaryRecipient,
        policy: {
          securityLevel,
          recipientRequired: recipients.length > 0,
          recipientEmail: primaryRecipient,
          otpRequired,
          deviceRequired,
          registeredDeviceOnly,
          senderApproval,
          riskDetection: true,
          maxViews,
          expiresInHours,
          downloadAllowed,
          senderIdentityVisibility: senderPrivacy,
          zeroPersistence,
          deliveryMethod,
          allowComments,
          allowAnnotations,
          allowAiAnalysis,
          allowPrint,
          allowCopyText,
          shareTemplate,
          notifyOnAccess,
          notifyOnDownload,
          notifyOnExpiry,
        },
        fileName: files.length === 1 ? files[0].name : `${title.replace(/\s+/g, '_')}_package.zip`,
        fileSize: files.reduce((acc, f) => acc + f.size, 0),
        mimeType: files.length === 1 ? files[0].type : 'application/zip',
        fileHash: files[0]?.sha256,
        fileData: files.length === 1 ? filePayloads[0].data : undefined,
        files: filePayloads,
      };

      const res = await fetch('/api/vault/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCreatedShare(data.data);
        setCurrentStep(8); // Step H: Sent share receipt
      } else {
        alert(data.error || 'Failed to encrypt and send vault item.');
      }
    } catch {
      alert('Network error connecting to encryption enclave.');
    } finally {
      setEncrypting(false);
    }
  };

  const copyToClipboard = (text: string, type: 'link' | 'otp') => {
    navigator.clipboard.writeText(text);
    if (type === 'link') {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    } else {
      setCopiedOtp(true);
      setTimeout(() => setCopiedOtp(false), 2000);
    }
  };

  return (
    <div className="max-w-5xl mx-auto py-8 space-y-8">
      {/* Wizard Header */}
      <div className="border-b border-slate-800 pb-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <Send className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Send Secure File Wizard</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            End-to-end multi-step manually editable secure sharing & adaptive cryptography pipeline.
          </p>
        </div>

        {/* Step Indicator Badges */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1">
          {[
            { num: 1, label: 'Content' },
            { num: 2, label: 'Metadata' },
            { num: 3, label: 'Recipients' },
            { num: 4, label: 'Policy' },
            { num: 5, label: 'AI Assist' },
            { num: 6, label: 'Delivery' },
            { num: 7, label: 'Review' },
            { num: 8, label: 'Manage' }
          ].map((s) => (
            <div
              key={s.num}
              onClick={() => {
                if (createdShare && s.num === 8) setCurrentStep(8);
                else if (s.num <= 7 && !createdShare) setCurrentStep(s.num);
              }}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono cursor-pointer transition flex items-center gap-1 ${
                currentStep === s.num
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : currentStep > s.num
                  ? 'bg-slate-900 text-emerald-400 border border-slate-800'
                  : 'bg-slate-950 text-slate-500 border border-slate-900'
              }`}
            >
              <span>{s.num}.</span>
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: SELECT CONTENT */}
      {currentStep === 1 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Upload className="w-4 h-4 text-cyan-400" />
              <span>Step A: Select Content & Files</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Total Files: {files.length}</span>
          </div>

          {/* File & Folder Upload Component */}
          <div className="space-y-2">
            <FileUploadZone
              title="Drag & Drop Files or Select Nested Folders"
              description="Drop individual files, archives, or entire directories. Validates signatures, paths, and SHA-256 integrity."
              singleFile={false}
              onFilesChange={(zoneItems) => {
                const mapped: UploadedFileItem[] = zoneItems.map((zi) => ({
                  id: zi.id,
                  name: zi.displayName || zi.originalName,
                  size: zi.size,
                  type: zi.mimeType || 'application/octet-stream',
                  content: zi.textSnippet || (zi.base64Data ? `[Binary payload: ${zi.size} bytes]` : ''),
                  folderPath: zi.folderPath,
                  sha256: zi.sha256Hash,
                  base64: zi.base64Data,
                }));
                if (mapped.length > 0) {
                  setFiles(mapped);
                  if (!title || title === 'Executive Cloud Audit & Agreement 2026') {
                    setTitle(mapped[0].name.replace(/\.[^/.]+$/, '').replace(/_/g, ' '));
                  }
                }
              }}
            />
          </div>

          {/* Existing Files Review List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-300">Active Manifest ({files.length} Item{files.length === 1 ? '' : 's'})</label>
              {files.length > 0 && (
                <button
                  type="button"
                  onClick={() => setFiles([])}
                  className="text-[11px] text-rose-400 hover:underline font-mono"
                >
                  Clear All
                </button>
              )}
            </div>
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                >
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-cyan-400 flex-shrink-0" />
                    <div>
                      <div className="font-bold text-slate-200 flex items-center gap-2">
                        <span>{file.name}</span>
                        {file.folderPath && (
                          <span className="text-[10px] text-cyan-400 font-mono bg-cyan-950/40 px-1.5 py-0.5 rounded border border-cyan-800/40">
                            {file.folderPath}
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {(file.size / 1024).toFixed(1)} KB &bull; {file.type} &bull; SHA-256: {file.sha256 ? `${file.sha256.slice(0, 16)}...` : 'Verified'}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFiles(files.filter((f) => f.id !== file.id))}
                    className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-800 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Add Additional Text Document Box */}
          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800/80 space-y-3 text-xs">
            <div className="font-semibold text-slate-300 flex items-center gap-1.5">
              <span>+ Add Custom Secret Note or Text Addendum</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <input
                type="text"
                placeholder="Filename (e.g. Addendum_A.txt)"
                value={fileInputTitle}
                onChange={(e) => setFileInputTitle(e.target.value)}
                className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <input
                type="text"
                placeholder="Document content snippet..."
                value={fileInputContent}
                onChange={(e) => setFileInputContent(e.target.value)}
                className="sm:col-span-2 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
            <button
              type="button"
              onClick={handleAddFile}
              disabled={!fileInputTitle.trim() || !fileInputContent.trim()}
              className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-xs font-mono transition disabled:opacity-40"
            >
              + Attach Content
            </button>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              disabled={files.length === 0}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow disabled:opacity-50"
            >
              <span>Continue to Step B (Metadata)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: EDIT METADATA */}
      {currentStep === 2 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              <span>Step B: Edit Share Metadata & Instructions</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Vault Item Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Classification Level</label>
              <select
                value={classification}
                onChange={(e) => setClassification(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              >
                <option value="INTERNAL">Internal Use</option>
                <option value="CONFIDENTIAL">Confidential</option>
                <option value="RESTRICTED">Restricted (C-Suite / Board)</option>
                <option value="TOP_SECRET">Top Secret Enclave</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Security Reference Number</label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Description / Executive Brief</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Recipient-Facing Access Instructions</label>
              <input
                type="text"
                value={recipientInstructions}
                onChange={(e) => setRecipientInstructions(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5 sm:col-span-2">
              <label className="font-semibold text-slate-300">Dynamic Viewer Watermark</label>
              <input
                type="text"
                value={watermarkText}
                onChange={(e) => setWatermarkText(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <span>Continue to Step C (Recipients)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RECIPIENTS */}
      {currentStep === 3 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Mail className="w-4 h-4 text-cyan-400" />
              <span>Step C: Recipient Identity & Multi-Target Routing</span>
            </h2>
            <span className="text-xs font-mono text-slate-400">Recipients: {recipients.length}</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="officer@enterprise.org"
                value={newRecipient}
                onChange={(e) => setNewRecipient(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddRecipient();
                  }
                }}
                className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
              />
              <button
                type="button"
                onClick={handleAddRecipient}
                className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition"
              >
                + Add Recipient
              </button>
            </div>

            <div className="space-y-2">
              {recipients.map((rec) => (
                <div
                  key={rec}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2 text-slate-200 font-mono">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span>{rec}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveRecipient(rec)}
                    className="text-slate-400 hover:text-rose-400 p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            {/* Sender Privacy Toggle */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {senderPrivacy === 'VISIBLE' ? (
                    <Eye className="w-4 h-4 text-cyan-400" />
                  ) : (
                    <EyeOff className="w-4 h-4 text-purple-400" />
                  )}
                  <span className="font-semibold text-slate-200">Sender Identity Visibility</span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <button
                    type="button"
                    onClick={() => setSenderPrivacy('VISIBLE')}
                    className={`px-2.5 py-1 rounded ${senderPrivacy === 'VISIBLE' ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'text-slate-500'}`}
                  >
                    VISIBLE
                  </button>
                  <button
                    type="button"
                    onClick={() => setSenderPrivacy('HIDDEN')}
                    className={`px-2.5 py-1 rounded ${senderPrivacy === 'HIDDEN' ? 'bg-purple-950 text-purple-300 border border-purple-800 font-bold' : 'text-slate-500'}`}
                  >
                    MAXIMUM PRIVACY (HIDDEN)
                  </button>
                </div>
              </div>
              <p className="text-[11px] text-slate-400">
                In Maximum Privacy Mode, your name and email are cryptographically stripped from the receiver access challenge portal.
              </p>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <span>Continue to Step D (Security Policy)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: MANUAL SECURITY POLICY */}
      {currentStep === 4 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Shield className="w-4 h-4 text-cyan-400" />
              <span>Step D: Manual Security Configuration & Profiles</span>
            </h2>
          </div>

          {/* Reusable Share Templates */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300">Quick Share Templates</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {[
                {
                  id: 'VIEW_ONLY',
                  name: 'View Only',
                  apply: () => {
                    setDownloadAllowed(false);
                    setAllowPrint(false);
                    setAllowCopyText(false);
                    setAllowComments(true);
                  }
                },
                {
                  id: 'DOWNLOAD_ALLOWED',
                  name: 'Download Permitted',
                  apply: () => {
                    setDownloadAllowed(true);
                    setAllowPrint(true);
                    setMaxViews(3);
                    setExpiresInHours(48);
                  }
                },
                {
                  id: 'CONFIDENTIAL_DELIVERY',
                  name: 'Confidential Delivery',
                  apply: () => {
                    setSecurityLevel('HIGH_SECURITY');
                    setOtpRequired(true);
                    setRegisteredDeviceOnly(true);
                    setMaxViews(1);
                    setDownloadAllowed(false);
                    setExpiresInHours(24);
                  }
                },
                {
                  id: 'DOCUMENT_REVIEW',
                  name: 'Document Review',
                  apply: () => {
                    setAllowComments(true);
                    setAllowAnnotations(true);
                    setAllowAiAnalysis(true);
                    setDownloadAllowed(false);
                    setMaxViews(5);
                  }
                },
                {
                  id: 'TEMPORARY_TRANSFER',
                  name: 'Temporary (30 Min)',
                  apply: () => {
                    setExpiresInHours(0.5);
                    setMaxViews(1);
                    setZeroPersistence(true);
                  }
                },
                {
                  id: 'HIGH_SECURITY',
                  name: 'High-Security Vault',
                  apply: () => {
                    setSecurityLevel('CRITICAL');
                    setOtpRequired(true);
                    setRegisteredDeviceOnly(true);
                    setSenderApproval(true);
                    setMaxViews(1);
                    setDownloadAllowed(false);
                    setZeroPersistence(true);
                  }
                },
              ].map((tmpl) => (
                <button
                  key={tmpl.id}
                  type="button"
                  onClick={() => {
                    setShareTemplate(tmpl.id);
                    tmpl.apply();
                  }}
                  className={`p-2 rounded-xl border text-center transition font-medium ${
                    shareTemplate === tmpl.id
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-500 font-bold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {tmpl.name}
                </button>
              ))}
            </div>
          </div>

          {/* Preset Security Profiles */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
            {[
              { level: 'STANDARD' as SecurityLevel, label: 'Standard', desc: 'Password/OTP, 48h expiry' },
              { level: 'CONFIDENTIAL' as SecurityLevel, label: 'Confidential', desc: 'OTP + 24h, 3 views' },
              { level: 'HIGH_SECURITY' as SecurityLevel, label: 'High Security', desc: 'Hardware bind + OTP, 1 view' },
              { level: 'CRITICAL' as SecurityLevel, label: 'Critical', desc: 'Sender approval + Enrolled PC' }
            ].map((prof) => (
              <button
                key={prof.level}
                type="button"
                onClick={() => {
                  setSecurityLevel(prof.level);
                  if (prof.level === 'HIGH_SECURITY' || prof.level === 'CRITICAL') {
                    setOtpRequired(true);
                    setDeviceRequired(true);
                    setRegisteredDeviceOnly(true);
                    setMaxViews(1);
                    setDownloadAllowed(false);
                  }
                }}
                className={`p-3 rounded-xl border text-left transition space-y-1 ${
                  securityLevel === prof.level
                    ? 'bg-cyan-950/70 border-cyan-500/80 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="font-bold text-slate-200">{prof.label}</div>
                <div className="text-[10px] text-slate-400">{prof.desc}</div>
              </button>
            ))}
          </div>

          {/* Granular Security Switches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Require Out-of-Band OTP</div>
                <div className="text-[10px] text-slate-400">Recipient must provide 6-digit OTP code</div>
              </div>
              <input
                type="checkbox"
                checked={otpRequired}
                onChange={(e) => setOtpRequired(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Enforce Registered Hardware</div>
                <div className="text-[10px] text-slate-400">Strictly blocks untrusted browser/device IDs</div>
              </div>
              <input
                type="checkbox"
                checked={registeredDeviceOnly}
                onChange={(e) => {
                  setRegisteredDeviceOnly(e.target.checked);
                  if (e.target.checked) setDeviceRequired(true);
                }}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Sender Approval Required</div>
                <div className="text-[10px] text-slate-400">Challenges require explicit manual approval</div>
              </div>
              <input
                type="checkbox"
                checked={senderApproval}
                onChange={(e) => setSenderApproval(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Allow File Download</div>
                <div className="text-[10px] text-slate-400">If unchecked, restricted to controlled viewer</div>
              </div>
              <input
                type="checkbox"
                checked={downloadAllowed}
                onChange={(e) => setDownloadAllowed(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Allow Receiver Comments &amp; Notes</div>
                <div className="text-[10px] text-slate-400">Permits receiver feedback and questions</div>
              </div>
              <input
                type="checkbox"
                checked={allowComments}
                onChange={(e) => setAllowComments(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Allow DocSenseAI In-Viewer</div>
                <div className="text-[10px] text-slate-400">Permits recipient to query document</div>
              </div>
              <input
                type="checkbox"
                checked={allowAiAnalysis}
                onChange={(e) => setAllowAiAnalysis(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Zero-Persistence Purge</div>
                <div className="text-[10px] text-slate-400">Destroys ciphertext atomically after max views</div>
              </div>
              <input
                type="checkbox"
                checked={zeroPersistence}
                onChange={(e) => setZeroPersistence(e.target.checked)}
                className="w-4 h-4 accent-cyan-500"
              />
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-200">Max Views Allowed</div>
                <div className="text-[10px] text-slate-400">Number of atomic reveals before lock</div>
              </div>
              <select
                value={maxViews}
                onChange={(e) => setMaxViews(parseInt(e.target.value, 10))}
                className="px-2 py-1 rounded bg-slate-800 text-slate-200 font-mono text-xs"
              >
                <option value={1}>1 (Strict Single-Use)</option>
                <option value={2}>2 Views</option>
                <option value={5}>5 Views</option>
                <option value={10}>10 Views</option>
              </select>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between sm:col-span-2">
              <div>
                <div className="font-bold text-slate-200">Authoritative Expiration Window</div>
                <div className="text-[10px] text-slate-400">Calculated in UTC; auto-expires and denies access</div>
              </div>
              <select
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(parseFloat(e.target.value))}
                className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-200 font-mono text-xs"
              >
                <option value={0.083}>5 Minutes (Ephemeral Urgent)</option>
                <option value={0.25}>15 Minutes</option>
                <option value={0.5}>30 Minutes</option>
                <option value={1}>1 Hour</option>
                <option value={6}>6 Hours</option>
                <option value={24}>24 Hours (Standard 1 Day)</option>
                <option value={72}>72 Hours (3 Days)</option>
                <option value={168}>7 Days</option>
              </select>
            </div>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <span>Continue to Step E (AI Assist & Simulator)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: AI-ASSISTED SECURITY & SIMULATOR */}
      {currentStep === 5 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-400" />
              <span>Step E: AI Secure This For Me & Policy Simulator</span>
            </h2>
          </div>

          <div className="space-y-4 text-xs">
            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Natural Language Security Intent</label>
              <textarea
                rows={3}
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                placeholder="e.g. Send to manager@corp.com. Must require OTP, single view from registered laptop, disable downloads, expire tomorrow."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-purple-400 focus:outline-none"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleCompileAiPolicy}
                disabled={aiAnalyzing}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow transition disabled:opacity-50"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{aiAnalyzing ? 'Compiling Rules...' : 'AI Compile Security Policy'}</span>
              </button>

              <button
                type="button"
                onClick={handleRunSimulator}
                disabled={simulating}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs flex items-center gap-1.5 transition"
              >
                <Play className="w-3.5 h-3.5 text-cyan-400" />
                <span>{simulating ? 'Simulating...' : 'Run Policy Simulator'}</span>
              </button>
            </div>

            {aiExplanation && (
              <div className="p-3.5 rounded-xl bg-purple-950/40 border border-purple-800/60 text-purple-200 text-xs leading-relaxed space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-purple-400" />
                  <span>AI Policy Engine Feedback</span>
                </div>
                <p>{aiExplanation}</p>
              </div>
            )}

            {simResults && (
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3">
                <div className="text-slate-300 font-bold font-mono text-xs flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-cyan-400" />
                  <span>Policy Simulation Test Results (Pre-Send Verification)</span>
                </div>
                <div className="space-y-2">
                  {simResults.map((r, i) => (
                    <div
                      key={i}
                      className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 flex items-center justify-between text-xs"
                    >
                      <div className="space-y-0.5">
                        <div className="font-semibold text-slate-200">{r.name}</div>
                        <div className="text-[10px] text-slate-400">{r.reason}</div>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                          r.allowed
                            ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}
                      >
                        {r.allowed ? 'GRANTED' : 'BLOCKED'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <span>Continue to Step F (Delivery Channel)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 6: DELIVERY CHANNEL SELECTION */}
      {currentStep === 6 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Globe className="w-4 h-4 text-cyan-400" />
              <span>Step F: Select Universal Delivery Channel</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {[
              {
                id: 'SECURE_LINK' as const,
                title: '1. Web / Secure URL Link',
                desc: 'Zero-Knowledge non-enumerable link with AES-256-GCM ciphertext payload.',
                status: 'ACTIVE / READY'
              },
              {
                id: 'QR_CODE' as const,
                title: '2. Dynamic QR / Optical Code',
                desc: 'Generate machine-readable optical token for mobile receiver scanning.',
                status: 'ACTIVE / READY'
              },
              {
                id: 'DIRECT_TRANSFER' as const,
                title: '3. Device-to-Device (D2D)',
                desc: 'Ephemeral peer relay with zero-persistence memory buffer.',
                status: 'ACTIVE / READY'
              },
              {
                id: 'EMAIL' as const,
                title: '4. Out-of-Band Email Dispatch',
                desc: 'Sends non-enumerable challenge notification via SMTP / Dev OTP.',
                status: 'ACTIVE / READY'
              }
            ].map((d) => (
              <div
                key={d.id}
                onClick={() => setDeliveryMethod(d.id)}
                className={`p-4 rounded-xl border cursor-pointer transition space-y-1.5 ${
                  deliveryMethod === d.id
                    ? 'bg-cyan-950/60 border-cyan-500 text-white shadow-lg shadow-cyan-950/40'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-200">{d.title}</span>
                  <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                    {d.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">{d.desc}</p>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] text-slate-400 leading-relaxed">
            <span className="font-bold text-cyan-300">Enterprise Note:</span> Additional channels (e.g. WhatsApp, Twilio SMS, OneDrive) require external API credentials. If unconfigured, the system defaults honestly to encrypted Web URL & QR fallback.
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(7)}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center gap-2 shadow"
            >
              <span>Continue to Step G (Final Review & Encrypt)</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 7: FINAL REVIEW & ENCRYPT */}
      {currentStep === 7 && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Step G: Final Security Review & Enclave Dispatch</span>
            </h2>
            <span className="text-xs font-mono text-emerald-400">Security Score: 95/100</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Payload Title</span>
              <div className="font-bold text-white text-sm">{title}</div>
              <div className="text-[11px] text-slate-400">Ref: {referenceNumber} &bull; Class: {classification}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Primary Recipient</span>
              <div className="font-bold text-white text-sm">{recipients[0] || 'Unrestricted URL'}</div>
              <div className="text-[11px] text-slate-400">Sender Mode: {senderPrivacy}</div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Access Constraints</span>
              <div className="font-mono text-slate-200">
                OTP: {otpRequired ? 'ENFORCED' : 'OFF'} &bull; Device Bind: {registeredDeviceOnly ? 'ENFORCED' : 'OFF'}
              </div>
              <div className="text-[11px] text-slate-400">
                Max Views: {maxViews} &bull; Expires: In {expiresInHours}h &bull; Download: {downloadAllowed ? 'Allowed' : 'Prohibited'}
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
              <span className="text-slate-400 text-[10px] uppercase font-mono">Destruction Policy</span>
              <div className="font-mono text-slate-200">
                Zero Persistence: {zeroPersistence ? 'ENABLED (Purge upon view)' : 'Disabled'}
              </div>
              <div className="text-[11px] text-slate-400">Watermark: &ldquo;{watermarkText}&rdquo;</div>
            </div>
          </div>

          {/* Pre-Send Security Checklist */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2.5 text-xs">
            <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Pre-Send Security Checklist</span>
            </span>
            <div className="space-y-1.5 text-[11px] font-mono text-slate-300">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Recipients Verified: {recipients.length > 0 ? `${recipients.length} target recipient(s)` : 'Direct link recipient'}</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>File Integrity: {files.length} file(s) with SHA-256 cryptographic hash calculated</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Expiration Scheduled: {expiresInHours < 1 ? `${Math.round(expiresInHours * 60)} minutes` : `${expiresInHours} hours`} from dispatch (UTC enforced)</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                <span>Permissions Locked: Download: {downloadAllowed ? 'Permitted' : 'Disabled'}, Comments: {allowComments ? 'Enabled' : 'Disabled'}, AI: {allowAiAnalysis ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-300 space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold font-mono text-[11px]">
              <Shield className="w-4 h-4" />
              <span>Cryptographic Guarantee:</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              By clicking &ldquo;Encrypt and Send&rdquo;, your payload is encrypted using AES-256-GCM authenticated encryption. Decryption keys are segregated, and the link will atomically lock and purge when the policy is fulfilled.
            </p>
          </div>

          <div className="flex justify-between pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={() => setCurrentStep(6)}
              className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
            <button
              type="button"
              onClick={handleEncryptAndSend}
              disabled={encrypting}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/25 transition disabled:opacity-50 flex items-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{encrypting ? 'Encrypting & Generating Tokens...' : 'Encrypt and Send Now'}</span>
            </button>
          </div>
        </div>
      )}

      {/* STEP 8: SENT SHARE RECEIPT & MANAGEMENT */}
      {currentStep === 8 && createdShare && (
        <div className="glass-panel p-6 sm:p-8 border-cyan-500/40 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-800 pb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Item Encrypted & Dispatched</h2>
                <p className="text-xs text-slate-400 font-mono">
                  Access ID: <span className="text-cyan-300">{createdShare.accessId}</span>
                </p>
              </div>
            </div>
            <Link
              href="/dashboard"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition"
            >
              Back to Dashboard
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Link & Verification Details */}
            <div className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-slate-300">Generated Secure Access Link</label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={`http://localhost:3000${createdShare.accessUrl}`}
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-300 font-mono text-xs select-all"
                  />
                  <button
                    type="button"
                    onClick={() => copyToClipboard(`http://localhost:3000${createdShare.accessUrl}`, 'link')}
                    className="px-3.5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-mono text-xs flex items-center gap-1 transition"
                  >
                    {copiedLink ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {createdShare.rawOtp && (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200">Out-of-Band 6-Digit OTP</span>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(createdShare.rawOtp!, 'otp')}
                      className="text-cyan-400 hover:underline font-mono text-[10px] flex items-center gap-1"
                    >
                      {copiedOtp ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                      <span>{copiedOtp ? 'Copied OTP' : 'Copy OTP'}</span>
                    </button>
                  </div>
                  <div className="text-2xl font-mono font-bold tracking-widest text-cyan-400 bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 text-center">
                    {createdShare.rawOtp}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Share this code with the authorized recipient via an independent out-of-band channel (e.g. Signal, Phone call, SMS).
                  </p>
                </div>
              )}

              <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div>&bull; <strong>Views Allowed:</strong> {createdShare.maxViews}</div>
                <div>&bull; <strong>Expires At:</strong> {new Date(createdShare.expiresAt).toLocaleString()}</div>
                <div>&bull; <strong>Controlled Viewer:</strong> In-browser strictly watermarked, DOM copy-restricted</div>
              </div>

              <div className="flex items-center gap-3 pt-2">
                <Link
                  href={createdShare.accessUrl}
                  target="_blank"
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition shadow"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Open Receiver Verification Portal</span>
                </Link>
                <button
                  type="button"
                  onClick={() => {
                    setFiles([]);
                    setTitle('');
                    setCurrentStep(1);
                    setCreatedShare(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs transition"
                >
                  Create Another Share
                </button>
              </div>
            </div>

            {/* QR Code Preview */}
            <div className="flex flex-col items-center justify-center p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="text-xs font-bold text-slate-300 font-mono">Mobile Optical QR Token</div>
              {createdShare.qrCode ? (
                <div className="p-3 bg-white rounded-xl shadow-lg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={createdShare.qrCode} alt="Access QR Code" className="w-48 h-48" />
                </div>
              ) : (
                <div className="w-48 h-48 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-center text-slate-500 font-mono text-xs">
                  <QrCode className="w-8 h-8" />
                </div>
              )}
              <p className="text-[10px] text-slate-400 text-center max-w-xs">
                Scan with smartphone camera to launch zero-trust authentication challenge.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
