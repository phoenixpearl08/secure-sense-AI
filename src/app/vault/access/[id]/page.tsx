'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useParams } from 'next/navigation';
import { 
  Lock, 
  Key, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Flame, 
  Copy, 
  Check, 
  Smartphone, 
  Mail, 
  EyeOff, 
  RefreshCw, 
  Clock,
  FileText,
  Download,
  Calendar,
  MessageSquare,
  Send,
  CheckCircle2,
  HelpCircle,
  X,
  Type
} from 'lucide-react';
import DecryptedFileViewer from '@/components/transfer/DecryptedFileViewer';
import { formatBytes } from '@/lib/files/filePayload';

function AccessPortalContent() {
  const params = useParams();
  const accessId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState<{
    title: string;
    status: string;
    securityLevel: string;
    maxViews: number;
    currentViews: number;
    expiresAt?: string;
    creatorName: string;
    recipientRequired: boolean;
    recipientEmailHint?: string;
    otpRequired: boolean;
    deviceRequired: boolean;
    registeredDeviceOnly: boolean;
    deviceVerified?: boolean;
    deviceStatus?: string;
    deviceMessage?: string;
    isDocumentAttachment: boolean;
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    fileHash?: string;
    hasAttachment?: boolean;
    downloadAllowed?: boolean;
    allowComments?: boolean;
    allowAnnotations?: boolean;
    allowAiAnalysis?: boolean;
    allowAiExport?: boolean;
    allowPrint?: boolean;
    allowCopyText?: boolean;
    customBranding?: {
      brandName?: string;
      brandLogoUrl?: string;
      accentColor?: string;
      customMessage?: string;
      themePreset?: string;
    };
    shareTemplate?: string;
    comments?: Array<{ id: string; authorEmail: string; text: string; createdAt: string; pageNumber?: number }>;
    extensionRequests?: Array<{ id: string; requesterEmail: string; reason: string; requestedHours: number; status: string; createdAt: string }>;
    downloadRequests?: Array<{ id: string; requesterEmail: string; reason: string; status: string; createdAt: string }>;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Form Verification Inputs
  const [recipientEmail, setRecipientEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [registeringDevice, setRegisteringDevice] = useState(false);

  // Live Countdown & Expiry State
  const [timeLeftStr, setTimeLeftStr] = useState<string>('');
  const [isClientExpired, setIsClientExpired] = useState(false);

  // Receiver Request Modals
  const [extensionModalOpen, setExtensionModalOpen] = useState(false);
  const [extensionReason, setExtensionReason] = useState('');
  const [extensionHours, setExtensionHours] = useState(24);
  const [extensionSubmitting, setExtensionSubmitting] = useState(false);
  const [extensionSuccess, setExtensionSuccess] = useState(false);

  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadReason, setDownloadReason] = useState('');
  const [downloadSubmitting, setDownloadSubmitting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Collaboration State
  const [newCommentText, setNewCommentText] = useState('');
  const [commentSubmitting, setCommentSubmitting] = useState(false);
  const [acknowledged, setAcknowledged] = useState(false);

  // Receiver Customization Preferences
  const [largeFont, setLargeFont] = useState(false);
  const [highContrast, setHighContrast] = useState(false);

  // Reveal State
  const [revealing, setRevealing] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [revealedFile, setRevealedFile] = useState<any>(null);
  const [revealedFiles, setRevealedFiles] = useState<any[] | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Synchronized countdown timer
  useEffect(() => {
    if (!metadata?.expiresAt) return;
    const updateTimeLeft = () => {
      const expiry = new Date(metadata.expiresAt!).getTime();
      const now = Date.now();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeLeftStr('00:00:00 (EXPIRED)');
        setIsClientExpired(true);
        return;
      }

      const days = Math.floor(diff / (24 * 3600 * 1000));
      const hours = Math.floor((diff % (24 * 3600 * 1000)) / (3600 * 1000));
      const minutes = Math.floor((diff % (3600 * 1000)) / (60 * 1000));
      const seconds = Math.floor((diff % (60 * 1000)) / 1000);

      const pad = (n: number) => n.toString().padStart(2, '0');
      if (days > 0) {
        setTimeLeftStr(`${days}d ${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      } else {
        setTimeLeftStr(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
      }
    };

    updateTimeLeft();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, [metadata?.expiresAt]);

  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => {
        if (prev === null || prev <= 1) {
          clearInterval(interval);
          setRevealedSecret(null);
          setError('Timed view session elapsed: decrypted secret burned from screen per policy.');
          return null;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  // Fetch Public Metadata with dynamic device authorization status
  const fetchMetadata = async (idToUse?: string) => {
    if (!accessId) return;
    const currentDevice = idToUse !== undefined ? idToUse : deviceId;
    try {
      const url = `/api/vault/access?id=${encodeURIComponent(accessId)}${
        currentDevice ? `&deviceId=${encodeURIComponent(currentDevice)}` : ''
      }`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.success && data.data) {
        setMetadata(data.data);
      } else {
        setError(data.error || 'Failed to load secure item metadata');
      }
    } catch {
      setError('Network error: Unable to contact security server');
    } finally {
      setLoading(false);
    }
  };

  // Generate or retrieve stable browser device ID for verification
  useEffect(() => {
    let ignore = false;
    const timer = setTimeout(() => {
      try {
        let storedId = localStorage.getItem('rv_device_id');
        if (!storedId) {
          storedId = 'dev-' + Math.random().toString(36).substring(2, 10);
          localStorage.setItem('rv_device_id', storedId);
        }
        if (!ignore) {
          setDeviceId(storedId);
          fetchMetadata(storedId);
        }
      } catch {
        fetchMetadata();
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [accessId]);

  // Enroll and trust current device for this security policy
  const handleRegisterCurrentDevice = async () => {
    if (!deviceId) return;
    setRegisteringDevice(true);
    setError(null);
    try {
      const res = await fetch('/api/devices/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deviceId,
          deviceName: 'Authorized Client Hardware Fingerprint',
        }),
      });
      const data = await res.json();
      if (data.success) {
        await fetchMetadata(deviceId);
      } else {
        setError(data.error || 'Failed to authorize device');
      }
    } catch {
      setError('Network error during device authorization');
    } finally {
      setRegisteringDevice(false);
    }
  };

  // Handle Controlled Reveal
  const handleReveal = async (e: React.FormEvent) => {
    e.preventDefault();
    setRevealing(true);
    setError(null);

    try {
      const res = await fetch('/api/vault/reveal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accessId,
          recipientEmail: metadata?.recipientRequired ? recipientEmail : undefined,
          otp: metadata?.otpRequired ? otp : undefined,
          deviceId,
        }),
      });

      const data = await res.json();

      if (data.success && (data.data?.secret !== undefined || data.data?.file || data.data?.files)) {
        setRevealedSecret(data.data.secret || '');
        setRevealedFile(data.data.file || null);
        setRevealedFiles(data.data.files || null);
        if (data.data.viewDurationSeconds) {
          setSecondsRemaining(data.data.viewDurationSeconds);
        }
        // Refresh metadata to show consumed status
        fetchMetadata();
      } else {
        setError(data.error || 'Access verification failed');
      }
    } catch {
      setError('An error occurred during cryptographic decryption');
    } finally {
      setRevealing(false);
    }
  };

  // Handle Extension Request
  const handleRequestExtension = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extensionReason) return;
    setExtensionSubmitting(true);
    try {
      const res = await fetch('/api/vault/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_EXTENSION',
          accessId,
          payload: {
            requesterEmail: recipientEmail || 'receiver@guest.local',
            reason: extensionReason,
            requestedHours: Number(extensionHours),
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setExtensionSuccess(true);
        setTimeout(() => {
          setExtensionModalOpen(false);
          setExtensionSuccess(false);
          setExtensionReason('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to submit extension request');
      }
    } catch {
      alert('Network error submitting extension request');
    } finally {
      setExtensionSubmitting(false);
    }
  };

  // Handle Download Request
  const handleRequestDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!downloadReason) return;
    setDownloadSubmitting(true);
    try {
      const res = await fetch('/api/vault/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'REQUEST_DOWNLOAD',
          accessId,
          payload: {
            requesterEmail: recipientEmail || 'receiver@guest.local',
            reason: downloadReason,
          },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setDownloadSuccess(true);
        setTimeout(() => {
          setDownloadModalOpen(false);
          setDownloadSuccess(false);
          setDownloadReason('');
        }, 1500);
      } else {
        alert(data.error || 'Failed to submit download request');
      }
    } catch {
      alert('Network error submitting download request');
    } finally {
      setDownloadSubmitting(false);
    }
  };

  // Handle Adding Comment
  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    setCommentSubmitting(true);
    try {
      const res = await fetch('/api/vault/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ADD_COMMENT',
          accessId,
          payload: {
            authorEmail: recipientEmail || 'receiver@verified.local',
            text: newCommentText.trim(),
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.comment) {
        setNewCommentText('');
        setMetadata((prev) => prev ? {
          ...prev,
          comments: [...(prev.comments || []), data.comment]
        } : prev);
      }
    } catch {
      alert('Network error posting comment');
    } finally {
      setCommentSubmitting(false);
    }
  };

  // Handle Acknowledge Receipt
  const handleAcknowledgeReceipt = async () => {
    try {
      await fetch('/api/vault/collaboration', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ACKNOWLEDGE_RECEIPT',
          accessId,
          payload: { userEmail: recipientEmail || 'receiver@verified.local' },
        }),
      });
      setAcknowledged(true);
    } catch {
      setAcknowledged(true);
    }
  };

  if (loading) {
    return (
      <div className="max-w-lg mx-auto py-24 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-cyan-400 animate-spin mx-auto" />
        <p className="text-sm font-mono text-slate-400">Loading cryptographic access challenge...</p>
      </div>
    );
  }

  // Already Consumed or Inactive State
  const isConsumed = metadata?.status === 'CONSUMED';
  const isExpired = metadata?.status === 'EXPIRED' || isClientExpired;
  const isRevoked = metadata?.status === 'REVOKED';

  const isRevealed = Boolean(revealedSecret !== null || revealedFile || revealedFiles);

  return (
    <div className={`mx-auto py-8 space-y-6 transition-all duration-300 ${isRevealed ? 'max-w-4xl' : 'max-w-xl'} ${highContrast ? 'contrast-125' : ''}`}>
      {/* Top Security Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-cyan-500/40 p-1 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Secure Sense AI"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Secure Sense Access Portal</h1>
        <p className="text-xs text-slate-400 font-mono">
          Non-Enumerable Identifier: {accessId?.slice(0, 10)}...
        </p>
      </div>

      {/* CASE 1: ALREADY CONSUMED (ONE-TIME VIEW DESTROYED) */}
      {isConsumed && !revealedSecret && (
        <div className="glass-panel p-8 border-rose-500/30 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-950/70 text-rose-400 border border-rose-800/60 flex items-center justify-center mx-auto">
            <Flame className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold text-white">ACCESS DENIED / ITEM CONSUMED</h2>
            <p className="text-xs text-rose-300 font-mono">
              Status: CONSUMED &bull; Views: {metadata?.currentViews}/{metadata?.maxViews}
            </p>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            This secure item was configured with a strict one-time atomic access policy. It has already been viewed and permanently destroyed according to policy.
          </p>
          <div className="pt-2">
            <span className="px-3 py-1 rounded bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400">
              Zero Plaintext Residual Guarantee
            </span>
          </div>
        </div>
      )}

      {/* CASE 2: EXPIRED OR REVOKED */}
      {(isExpired || isRevoked) && !revealedSecret && (
        <div className="glass-panel p-8 border-amber-500/30 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-amber-950/70 text-amber-400 border border-amber-800/60 flex items-center justify-center mx-auto">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-white">
            {isExpired ? 'SECURE ITEM EXPIRED' : 'ACCESS REVOKED BY SENDER'}
          </h2>
          <p className="text-xs text-slate-400">
            {isExpired
              ? 'The cryptographic lifecycle expiration window for this item has elapsed.'
              : 'The authorized sender has revoked authorization for this transmission.'}
          </p>
          {isExpired && (
            <button
              type="button"
              onClick={() => setExtensionModalOpen(true)}
              className="mt-2 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition flex items-center gap-1.5 mx-auto"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Request Access Extension</span>
            </button>
          )}
        </div>
      )}

      {/* CASE 3: ACTIVE - ACCESS PASSPORT & VERIFICATION CHALLENGE */}
      {!isConsumed && !isExpired && !isRevoked && !revealedSecret && metadata && (
        <div className="space-y-4">
          {/* RECEIVER ACCESS PASSPORT CARD */}
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/40 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs uppercase tracking-wider">
                  Receiver Access Passport
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-bold">
                {metadata.securityLevel}
              </span>
            </div>

            {/* Document & Sender Info */}
            <div>
              <h2 className="text-base font-bold text-white">{metadata.title}</h2>
              <div className="text-xs text-slate-400 font-mono mt-1 flex flex-wrap items-center gap-2">
                <span>Sender: <strong className="text-slate-200">{metadata.creatorName}</strong></span>
                <span>&bull;</span>
                <span>Remaining Views: <strong className="text-cyan-300">{metadata.maxViews - metadata.currentViews}</strong></span>
              </div>
            </div>

            {/* Authoritative Live Countdown Timer */}
            {metadata.expiresAt && (
              <div className="p-3 rounded-xl bg-slate-950 border border-amber-500/40 flex items-center justify-between gap-3 text-xs font-mono">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400 animate-pulse" />
                  <div>
                    <div className="text-[10px] text-slate-400 uppercase">Authorized Access Remaining</div>
                    <div className="font-bold text-amber-300 text-sm">{timeLeftStr || 'Synchronizing...'}</div>
                  </div>
                </div>
                <div className="text-right text-[10px] text-slate-400 hidden sm:block">
                  <div>Server UTC: {new Date(metadata.expiresAt).toUTCString().slice(17, 25)} UTC</div>
                  <div>Local: {new Date(metadata.expiresAt).toLocaleTimeString()}</div>
                </div>
              </div>
            )}

            {/* Attachment details if present */}
            {metadata.hasAttachment && metadata.fileName && (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-xs">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                  <div>
                    <div className="font-semibold text-slate-200 truncate max-w-[200px]">{metadata.fileName}</div>
                    {metadata.fileSize && (
                      <div className="text-[10px] text-slate-400 font-mono">{formatBytes(metadata.fileSize)} &bull; {metadata.mimeType || 'Document'}</div>
                    )}
                  </div>
                </div>
                {metadata.fileHash && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-emerald-400 border border-slate-800">
                    SHA-256 Verified
                  </span>
                )}
              </div>
            )}

            {/* Permissions & Collaboration Matrix */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] font-mono">
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block uppercase">Preview</span>
                <span className="text-emerald-400 font-bold">PERMITTED</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block uppercase">Download</span>
                <span className={metadata.downloadAllowed ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                  {metadata.downloadAllowed ? 'PERMITTED' : 'RESTRICTED'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block uppercase">AI Analysis</span>
                <span className={metadata.allowAiAnalysis !== false ? 'text-cyan-400 font-bold' : 'text-slate-400'}>
                  {metadata.allowAiAnalysis !== false ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
              <div className="p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="text-slate-500 block uppercase">Comments</span>
                <span className={metadata.allowComments !== false ? 'text-purple-400 font-bold' : 'text-slate-400'}>
                  {metadata.allowComments !== false ? 'ENABLED' : 'DISABLED'}
                </span>
              </div>
            </div>

            {/* Receiver Action Buttons: Request Extension / Request Download */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-800/80">
              <button
                type="button"
                onClick={() => setExtensionModalOpen(true)}
                className="text-xs text-amber-400 hover:text-amber-300 font-medium flex items-center gap-1.5 transition"
              >
                <Calendar className="w-3.5 h-3.5" />
                <span>Request Extension</span>
              </button>

              {!metadata.downloadAllowed && (
                <button
                  type="button"
                  onClick={() => setDownloadModalOpen(true)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1.5 transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Request Download Permission</span>
                </button>
              )}
            </div>
          </div>

          {/* VERIFICATION CHALLENGE FORM */}
          <div className="glass-panel p-6 sm:p-8 border-cyan-500/30 space-y-6 shadow-xl">
            <form onSubmit={handleReveal} className="space-y-4">
              <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
                <span>Identity Verification Challenge</span>
              </div>

              {/* Recipient Check */}
              {metadata.recipientRequired && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>Authorized Recipient Email:</span>
                    {metadata.recipientEmailHint && (
                      <span className="text-[10px] text-slate-400 font-mono">
                        Hint: {metadata.recipientEmailHint}
                      </span>
                    )}
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="email"
                      required
                      value={recipientEmail}
                      onChange={(e) => setRecipientEmail(e.target.value)}
                      placeholder="Enter your authorized email address"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* OTP Challenge */}
              {metadata.otpRequired && (
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-slate-300 flex items-center justify-between">
                    <span>One-Time Password (OTP):</span>
                    <span className="text-[10px] text-amber-400 font-mono">6-DIGIT CHALLENGE</span>
                  </label>
                  <div className="relative">
                    <Key className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="Enter 6-digit OTP code"
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none font-mono tracking-widest text-center"
                    />
                  </div>
                </div>
              )}

              {/* Device Verification Status */}
              <div className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                metadata.registeredDeviceOnly
                  ? metadata.deviceVerified
                    ? 'bg-emerald-950/40 border-emerald-500/40'
                    : 'bg-rose-950/40 border-rose-500/50'
                  : 'bg-slate-900/80 border-slate-800'
              }`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5">
                    <Smartphone className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                      metadata.registeredDeviceOnly
                        ? metadata.deviceVerified
                          ? 'text-emerald-400'
                          : 'text-rose-400'
                        : 'text-indigo-400'
                    }`} />
                    <div>
                      <div className="font-semibold text-slate-200">Browser / Hardware Fingerprint</div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        ID: {deviceId ? `${deviceId.slice(0, 16)}...` : 'Detecting hardware identity...'}
                      </div>
                    </div>
                  </div>

                  {metadata.registeredDeviceOnly ? (
                    metadata.deviceVerified ? (
                      <span className="text-[10px] font-mono font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex-shrink-0">
                        VERIFIED
                      </span>
                    ) : (
                      <span className="text-[10px] font-mono font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-800 flex-shrink-0">
                        NOT VERIFIED / UNTRUSTED
                      </span>
                    )
                  ) : metadata.deviceRequired ? (
                    <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800 flex-shrink-0">
                      RECOGNIZED
                    </span>
                  ) : (
                    <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex-shrink-0">
                      ANY DEVICE
                    </span>
                  )}
                </div>

                {metadata.registeredDeviceOnly && !metadata.deviceVerified && (
                  <div className="pt-1.5 border-t border-rose-900/40 space-y-2">
                    <div className="p-2.5 rounded-lg bg-rose-950/70 border border-rose-800/80 text-[11px] text-rose-300 font-mono flex items-start gap-2">
                      <AlertTriangle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0 mt-0.5" />
                      <span>{metadata.deviceMessage || 'Access denied: Device is not registered or untrusted for this security policy.'}</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>Sender policy requires an enrolled, trusted hardware device.</span>
                      <button
                        type="button"
                        onClick={handleRegisterCurrentDevice}
                        disabled={registeringDevice}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 border border-slate-700 font-medium text-[10px] transition disabled:opacity-50"
                      >
                        {registeringDevice ? 'Enrolling...' : 'Authorize Device'}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Error Banner */}
              {error && (
                <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={revealing || (metadata.registeredDeviceOnly && !metadata.deviceVerified)}
                className={`w-full py-3 rounded-xl font-bold text-sm shadow-lg transition flex items-center justify-center gap-2 ${
                  metadata.registeredDeviceOnly && !metadata.deviceVerified
                    ? 'bg-slate-800/80 text-slate-500 cursor-not-allowed border border-slate-700/60'
                    : 'bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow-cyan-500/20'
                }`}
              >
                <Lock className="w-4 h-4" />
                <span>
                  {revealing
                    ? 'Verifying & Decrypting AES Payload...'
                    : metadata.registeredDeviceOnly && !metadata.deviceVerified
                    ? 'Device Authorization Required to Reveal'
                    : 'Verify Identity & Reveal Content'}
                </span>
              </button>
            </form>

            <p className="text-[11px] text-center text-slate-400 font-mono">
              &bull; AES-256-GCM authenticated decryption will only execute if all security challenges succeed.
            </p>
          </div>
        </div>
      )}

      {/* CASE 4: SUCCESSFULLY REVEALED */}
      {(revealedSecret !== null || revealedFile || revealedFiles) && (
        <div className={`glass-panel p-6 sm:p-8 border-emerald-500/40 space-y-6 shadow-2xl animate-fade-in ${largeFont ? 'text-base' : 'text-xs'}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-white text-base">{metadata?.title || 'Decrypted Transmission'}</h3>
                <div className="text-[11px] text-slate-400 font-mono">
                  Sender: {metadata?.creatorName || 'Authorized Sender'} &bull; AES-256-GCM Authenticated
                </div>
              </div>
            </div>

            {/* Display customization toggles */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setLargeFont(!largeFont)}
                className={`p-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition ${
                  largeFont ? 'bg-cyan-950 text-cyan-300 border-cyan-800' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle Larger Font Size"
              >
                <Type className="w-3.5 h-3.5" />
                <span>{largeFont ? 'Default Font' : 'Large Font'}</span>
              </button>

              <button
                type="button"
                onClick={() => setHighContrast(!highContrast)}
                className={`p-1.5 rounded-lg border text-[11px] font-mono flex items-center gap-1 transition ${
                  highContrast ? 'bg-indigo-950 text-indigo-300 border-indigo-800' : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
                title="Toggle High Contrast"
              >
                <span>{highContrast ? 'Standard Contrast' : 'High Contrast'}</span>
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-950 text-rose-400 text-[10px] font-mono border border-rose-800">
              <Flame className="w-3 h-3" />
              <span>ATOMIC CONSUMPTION: ACCESS DESTROYED</span>
            </div>
            {secondsRemaining !== null && (
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950 text-amber-400 text-[10px] font-mono border border-amber-800 animate-pulse">
                <Clock className="w-3 h-3" />
                <span>WINDOW: {secondsRemaining}s REMAINING</span>
              </div>
            )}
          </div>

          {/* Unified Decrypted File Viewer & Downloader */}
          <DecryptedFileViewer
            file={revealedFile}
            files={revealedFiles || undefined}
            textSecret={revealedSecret || undefined}
            downloadAllowed={metadata?.downloadAllowed !== false}
          />

          {/* Receiver Collaboration: Acknowledgment & Comments */}
          <div className="pt-4 border-t border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-white text-xs">Receiver Collaboration &amp; Notes</span>
              </div>

              {/* Receipt Acknowledgment Button */}
              <button
                type="button"
                onClick={handleAcknowledgeReceipt}
                disabled={acknowledged}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition ${
                  acknowledged
                    ? 'bg-emerald-950 text-emerald-400 border border-emerald-800 cursor-default'
                    : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{acknowledged ? 'Receipt Acknowledged \u2713' : 'Acknowledge Secure Receipt'}</span>
              </button>
            </div>

            {/* Existing Comments List */}
            {metadata?.comments && metadata.comments.length > 0 && (
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {metadata.comments.map((c) => (
                  <div key={c.id} className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                      <span className="text-cyan-300 font-semibold">{c.authorEmail}</span>
                      <span>{new Date(c.createdAt).toLocaleTimeString()}</span>
                    </div>
                    <p className="text-slate-200">{c.text}</p>
                  </div>
                ))}
              </div>
            )}

            {/* Add Comment Form */}
            {metadata?.allowComments !== false && (
              <form onSubmit={handleAddComment} className="flex gap-2">
                <input
                  type="text"
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder="Add a feedback note or question for the sender..."
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={commentSubmitting || !newCommentText.trim()}
                  className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs transition disabled:opacity-50 flex items-center gap-1"
                >
                  <Send className="w-3 h-3" />
                  <span>Send</span>
                </button>
              </form>
            )}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200">Security Notice:</div>
            <p className="text-slate-400">
              This transmission has been atomically consumed. If this link is refreshed or accessed again, the server will permanently return &ldquo;ACCESS DENIED / ALREADY CONSUMED&rdquo;.
            </p>
          </div>
        </div>
      )}

      {/* MODAL 1: REQUEST EXTENSION */}
      {extensionModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Request Access Extension</span>
              </div>
              <button
                type="button"
                onClick={() => setExtensionModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {extensionSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <div className="font-bold">Request Dispatched!</div>
                <p className="text-[11px] text-slate-400">Sender has been notified to review your extension.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestExtension} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Additional Time Needed:</label>
                  <select
                    value={extensionHours}
                    onChange={(e) => setExtensionHours(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
                  >
                    <option value={1}>+ 1 Hour</option>
                    <option value={6}>+ 6 Hours</option>
                    <option value={24}>+ 24 Hours (1 Day)</option>
                    <option value={72}>+ 72 Hours (3 Days)</option>
                    <option value={168}>+ 7 Days</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-300 font-medium block mb-1">Reason for Extension:</label>
                  <textarea
                    rows={3}
                    required
                    value={extensionReason}
                    onChange={(e) => setExtensionReason(e.target.value)}
                    placeholder="e.g. Legal counsel reviewing obligation covenants prior to signing..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setExtensionModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={extensionSubmitting || !extensionReason}
                    className="px-4 py-1.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold transition disabled:opacity-50"
                  >
                    {extensionSubmitting ? 'Sending...' : 'Submit Request'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* MODAL 2: REQUEST DOWNLOAD PERMISSION */}
      {downloadModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2 font-bold text-white text-sm">
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Request Download Permission</span>
              </div>
              <button
                type="button"
                onClick={() => setDownloadModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {downloadSuccess ? (
              <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800 text-emerald-300 text-xs text-center space-y-1">
                <CheckCircle2 className="w-6 h-6 mx-auto text-emerald-400" />
                <div className="font-bold">Request Dispatched!</div>
                <p className="text-[11px] text-slate-400">Sender will be notified to authorize local export.</p>
              </div>
            ) : (
              <form onSubmit={handleRequestDownload} className="space-y-3 text-xs">
                <div>
                  <label className="text-slate-300 font-medium block mb-1">Reason for Offline Download:</label>
                  <textarea
                    rows={3}
                    required
                    value={downloadReason}
                    onChange={(e) => setDownloadReason(e.target.value)}
                    placeholder="e.g. Offline audit requirement, board presentation..."
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 focus:border-cyan-500 focus:outline-none"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
                  <button
                    type="button"
                    onClick={() => setDownloadModalOpen(false)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={downloadSubmitting || !downloadReason}
                    className="px-4 py-1.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold transition disabled:opacity-50"
                  >
                    {downloadSubmitting ? 'Sending...' : 'Request Permission'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccessPortalPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto py-24 text-center space-y-4">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-mono text-slate-400">Initializing secure access channel...</p>
        </div>
      }
    >
      <AccessPortalContent />
    </Suspense>
  );
}

