'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, Shield, Key, CheckCircle2, AlertTriangle, FileText, Download, Copy, Check } from 'lucide-react';
import { TransferSession } from '@/types';

function ReceiveContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [session, setSession] = useState<Omit<TransferSession, 'payloadBuffer' | 'otpCodeHash'> | null>(null);
  const [loading, setLoading] = useState(true);
  const [otp, setOtp] = useState('');
  const [consuming, setConsuming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Delivered state
  const [deliveredPayload, setDeliveredPayload] = useState<string | null>(null);
  const [verifiedHash, setVerifiedHash] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!token) {
      setLoading(false);
      setError('Missing transfer session token');
      return;
    }

    let ignore = false;
    async function load() {
      try {
        const res = await fetch(`/api/transfers/session?token=${encodeURIComponent(token || '')}`);
        const data = await res.json();
        if (!ignore) {
          if (data.success && data.data) {
            setSession(data.data);
          } else {
            setError(data.error || 'Transfer session not found or expired');
          }
        }
      } catch {
        if (!ignore) setError('Failed to connect to transfer relay');
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [token]);

  const handleConsume = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !otp) return;

    setConsuming(true);
    setError(null);

    try {
      const res = await fetch('/api/transfers/consume', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionToken: token,
          otp,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setDeliveredPayload(data.data.payload);
        setVerifiedHash(data.data.fileHash);
      } else {
        setError(data.error || 'Failed to claim ephemeral transfer');
      }
    } catch {
      setError('Network communication failed');
    } finally {
      setConsuming(false);
    }
  };

  const handleDownload = () => {
    if (!deliveredPayload || !session) return;
    const blob = new Blob([deliveredPayload], { type: session.mimeType || 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = session.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm text-slate-400">Verifying transfer relay session...</p>
        </div>
      </div>
    );
  }

  if (error && !deliveredPayload) {
    return (
      <div className="max-w-md mx-auto my-12 p-8 bg-slate-900/80 border border-rose-500/30 rounded-2xl text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-rose-400 mx-auto" />
        <h2 className="text-xl font-bold text-white">Transfer Unavailable</h2>
        <p className="text-sm text-slate-400">{error}</p>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-12">
      <div className="bg-slate-900/80 border border-cyan-500/30 rounded-2xl p-8 backdrop-blur-xl shadow-2xl space-y-6">
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <Send className="w-6 h-6 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold text-white">Ephemeral Transfer Receiver Portal</h1>
            <p className="text-xs text-slate-400">Zero-Persistence direct delivery relay</p>
          </div>
        </div>

        {deliveredPayload ? (
          <div className="space-y-6">
            <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-sm flex items-center space-x-3">
              <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
              <div>
                <p className="font-semibold">Payload Delivered & Memory Purged</p>
                <p className="text-xs text-emerald-500/80">
                  Zero-Persistence policy enforced: server buffer has been wiped from memory.
                </p>
              </div>
            </div>

            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex justify-between items-center text-xs text-slate-400">
                <span>File: {session?.fileName}</span>
                <span>SHA-256: {verifiedHash?.slice(0, 16)}...</span>
              </div>
              <textarea
                readOnly
                rows={5}
                value={deliveredPayload}
                className="w-full bg-slate-900 border border-slate-800 rounded-lg p-3 text-sm font-mono text-cyan-300 focus:outline-none"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(deliveredPayload);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 border border-slate-700"
              >
                {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                <span>{copied ? 'Copied' : 'Copy Content'}</span>
              </button>

              <button
                onClick={handleDownload}
                className="flex-1 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl text-sm font-semibold flex items-center justify-center space-x-2 shadow-lg shadow-cyan-500/20"
              >
                <Download className="w-4 h-4" />
                <span>Save File</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleConsume} className="space-y-6">
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-2">
              <div className="flex items-center space-x-2 text-sm text-white font-semibold">
                <FileText className="w-4 h-4 text-cyan-400" />
                <span>{session?.fileName}</span>
              </div>
              <p className="text-xs text-slate-400">
                Sender: <span className="text-slate-200">{session?.senderName}</span>
              </p>
              <p className="text-xs text-slate-400">
                Zero-Persistence: <span className="text-emerald-400">{session?.zeroPersistence ? 'Enabled (Instant Purge)' : 'Disabled'}</span>
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Enter One-Time Verification Passcode (OTP)
              </label>
              <div className="relative">
                <Key className="w-5 h-5 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="e.g. 748291"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-11 pr-4 py-3 text-lg font-mono tracking-widest text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={consuming || !otp}
              className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
            >
              <Shield className="w-4 h-4" />
              <span>{consuming ? 'Verifying & Claiming...' : 'Verify OTP & Receive Payload'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function ReceiveTransferPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <ReceiveContent />
    </Suspense>
  );
}
