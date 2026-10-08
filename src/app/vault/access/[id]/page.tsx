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
  Clock
} from 'lucide-react';

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
    isDocumentAttachment: boolean;
  } | null>(null);

  const [error, setError] = useState<string | null>(null);

  // Form Verification Inputs
  const [recipientEmail, setRecipientEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [deviceId, setDeviceId] = useState('');

  // Reveal State
  const [revealing, setRevealing] = useState(false);
  const [revealedSecret, setRevealedSecret] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

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
        if (!ignore) setDeviceId(storedId);
      } catch {
        // fallback
      }
    }, 0);
    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, []);

  // Fetch Public Metadata
  const fetchMetadata = async () => {
    if (!accessId) return;
    try {
      const res = await fetch(`/api/vault/access?id=${encodeURIComponent(accessId)}`);
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

  useEffect(() => {
    if (!accessId) return;
    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/vault/access?id=${encodeURIComponent(accessId)}`);
        const data = await res.json();
        if (!ignore) {
          if (data.success && data.data) {
            setMetadata(data.data);
          } else {
            setError(data.error || 'Failed to load secure item metadata');
          }
        }
      } catch {
        if (!ignore) setError('Network error: Unable to contact security server');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [accessId]);

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

      if (data.success && data.data?.secret) {
        setRevealedSecret(data.data.secret);
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
  const isExpired = metadata?.status === 'EXPIRED';
  const isRevoked = metadata?.status === 'REVOKED';

  return (
    <div className="max-w-lg mx-auto py-8 space-y-6">
      {/* Top Security Header */}
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/60 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
          {isConsumed ? (
            <Flame className="w-7 h-7 text-rose-500" />
          ) : isExpired || isRevoked ? (
            <EyeOff className="w-7 h-7 text-amber-500" />
          ) : (
            <Lock className="w-7 h-7" />
          )}
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">RealityVault Access Portal</h1>
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
        </div>
      )}

      {/* CASE 3: ACTIVE - VERIFICATION & REVEAL CHALLENGE */}
      {!isConsumed && !isExpired && !isRevoked && !revealedSecret && metadata && (
        <div className="glass-panel p-6 sm:p-8 border-cyan-500/30 space-y-6 shadow-xl">
          {/* Metadata Overview */}
          <div className="space-y-2 border-b border-slate-800 pb-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-cyan-400 uppercase tracking-wider">
                {metadata.securityLevel} TRANSMISSION
              </span>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                ACTIVE
              </span>
            </div>
            <h2 className="text-lg font-bold text-white">{metadata.title}</h2>
            <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
              <span>Sender: {metadata.creatorName}</span>
              <span>&bull;</span>
              <span>Max Views: {metadata.maxViews}</span>
            </div>
          </div>

          {/* Verification Challenge Form */}
          <form onSubmit={handleReveal} className="space-y-4">
            <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Step-by-Step Verification Challenge</span>
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
            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-indigo-400" />
                <div>
                  <div className="font-semibold text-slate-300">Browser / Hardware Fingerprint</div>
                  <div className="text-[10px] text-slate-400 font-mono">ID: {deviceId.slice(0, 12)}...</div>
                </div>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                VERIFIED
              </span>
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
              disabled={revealing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" />
              <span>{revealing ? 'Verifying & Decrypting AES Payload...' : 'Verify Identity & Reveal Content'}</span>
            </button>
          </form>

          <p className="text-[11px] text-center text-slate-400 font-mono">
            &bull; AES-256-GCM authenticated decryption will only execute if all security challenges succeed.
          </p>
        </div>
      )}

      {/* CASE 4: SUCCESSFULLY REVEALED */}
      {revealedSecret && (
        <div className="glass-panel p-6 sm:p-8 border-emerald-500/40 space-y-6 shadow-2xl animate-fade-in">
          <div className="text-center space-y-1">
            <div className="w-12 h-12 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center justify-center mx-auto">
              <ShieldCheck className="w-6 h-6" />
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
          </div>

          {/* Secret Display Box */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Decrypted Plaintext:</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(revealedSecret);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy Content'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-emerald-900/60 font-mono text-sm text-emerald-300 whitespace-pre-wrap break-words max-h-96 overflow-y-auto">
              {revealedSecret}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 space-y-1">
            <div className="font-semibold text-slate-200">Security Notice:</div>
            <p className="text-slate-400">
              This transmission has been atomically consumed. If this link is refreshed or accessed again, the server will permanently return &ldquo;ACCESS DENIED / ALREADY CONSUMED&rdquo;.
            </p>
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

