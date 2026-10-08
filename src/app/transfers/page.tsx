'use client';

import React, { useState, useEffect } from 'react';
import { 
  Send, 
  Shield, 
  Clock, 
  Trash2, 
  Copy, 
  Check, 
  Key, 
  QrCode, 
  CheckCircle2, 
  FileText,
  AlertTriangle
} from 'lucide-react';
import { TransferSession } from '@/types';

export default function TransfersPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  const [fileName, setFileName] = useState('confidential_archive.zip');
  const [payloadText, setPayloadText] = useState('HIGH_SECURITY_SOURCE_ARCHIVE_CONTENT_PAYLOAD_2026');
  const [receiverEmail, setReceiverEmail] = useState('');
  const [zeroPersistence, setZeroPersistence] = useState(true);
  const [expiresInMinutes, setExpiresInMinutes] = useState(10);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Result state
  const [createdSession, setCreatedSession] = useState<{
    sessionToken: string;
    fileName: string;
    fileSize: number;
    fileHash: string;
    rawOtp?: string;
    accessUrl: string;
    qrCode?: string;
    expiresAt: string;
    zeroPersistence: boolean;
  } | null>(null);

  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // Active sessions list
  const [sessions, setSessions] = useState<Omit<TransferSession, 'payloadBuffer' | 'otpCodeHash'>[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);

  const fetchSessions = async () => {
    try {
      const res = await fetch('/api/transfers/list');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setSessions(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSessions(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'list') {
      let ignore = false;
      async function load() {
        try {
          const res = await fetch('/api/transfers/list');
          const data = await res.json();
          if (!ignore && data.success && Array.isArray(data.data)) {
            setSessions(data.data);
          }
        } catch (err) {
          console.error(err);
        } finally {
          if (!ignore) setLoadingSessions(false);
        }
      }
      load();
      return () => {
        ignore = true;
      };
    }
  }, [activeTab]);

  const handleCreateTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payloadText || !fileName) return;

    setCreating(true);
    setError(null);

    try {
      const res = await fetch('/api/transfers/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          payloadData: payloadText,
          mimeType: 'text/plain',
          receiverEmail: receiverEmail || undefined,
          zeroPersistence,
          expiresInMinutes,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCreatedSession(data.data);
      } else {
        setError(data.error || 'Failed to initialize transfer');
      }
    } catch {
      setError('Network communication failed');
    } finally {
      setCreating(false);
    }
  };

  const handleCancelTransfer = async (token: string) => {
    try {
      await fetch('/api/transfers/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken: token, reason: 'Sender emergency cancellation' }),
      });
      fetchSessions();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Send className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Ephemeral Real-Time Transfers</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Zero-Persistence peer relay. Encrypted payload exists only in memory during transfer and is purged immediately upon completion.
          </p>
        </div>

        <div className="flex bg-slate-900 border border-slate-800 rounded-xl p-1">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'create' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Start Transfer
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition ${
              activeTab === 'list' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active Relays
          </button>
        </div>
      </div>

      {activeTab === 'create' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Transfer Setup Form */}
          <div className="lg:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Initialize Ephemeral Transfer</h2>

            {error && (
              <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-sm flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleCreateTransfer} className="space-y-5">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Payload / File Name
                </label>
                <input
                  type="text"
                  value={fileName}
                  onChange={(e) => setFileName(e.target.value)}
                  placeholder="e.g. legal_brief_oct2026.docx"
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                  Confidential Content / Data Buffer
                </label>
                <textarea
                  rows={4}
                  value={payloadText}
                  onChange={(e) => setPayloadText(e.target.value)}
                  placeholder="Paste confidential data payload..."
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm font-mono text-cyan-300 focus:outline-none focus:border-cyan-500/50"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Designated Recipient (Optional)
                  </label>
                  <input
                    type="email"
                    value={receiverEmail}
                    onChange={(e) => setReceiverEmail(e.target.value)}
                    placeholder="receiver@security.org"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                    Session Timeout (Minutes)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="60"
                    value={expiresInMinutes}
                    onChange={(e) => setExpiresInMinutes(parseInt(e.target.value, 10))}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
              </div>

              {/* Zero-Persistence Toggle */}
              <div className="p-4 bg-slate-950/80 border border-cyan-500/30 rounded-xl flex items-center justify-between">
                <div>
                  <span className="text-sm font-semibold text-white">Zero-Persistence Mode</span>
                  <p className="text-xs text-slate-400">
                    Purge buffer from RAM immediately upon receiver delivery or timeout.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={zeroPersistence}
                  onChange={(e) => setZeroPersistence(e.target.checked)}
                  className="w-5 h-5 rounded bg-slate-800 border-slate-700 text-cyan-500 focus:ring-cyan-500"
                />
              </div>

              <button
                type="submit"
                disabled={creating}
                className="w-full py-3.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 disabled:opacity-50 text-white font-semibold rounded-xl text-sm transition shadow-lg shadow-cyan-500/20 flex items-center justify-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>{creating ? 'Establishing Secure Relay...' : 'Initialize Real-Time Transfer'}</span>
              </button>
            </form>
          </div>

          {/* Transfer Result / QR Code Sidebar */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
            <h2 className="text-lg font-semibold text-white mb-4">Relay Endpoint</h2>

            {createdSession ? (
              <div className="space-y-6">
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>Relay Active: Waiting for receiver connection</span>
                </div>

                {/* QR Code */}
                {createdSession.qrCode && (
                  <div className="flex flex-col items-center p-4 bg-slate-950 rounded-xl border border-slate-800">
                    <img
                      src={createdSession.qrCode}
                      alt="Transfer QR Code"
                      className="w-48 h-48 rounded-lg shadow-lg"
                    />
                    <span className="text-xs text-slate-500 mt-2">Scan to receive ephemeral payload</span>
                  </div>
                )}

                {/* OTP Passcode */}
                {createdSession.rawOtp && (
                  <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                    <span className="text-xs text-slate-500 block mb-1">One-Time Transfer Passcode (OTP)</span>
                    <div className="flex items-center justify-between">
                      <span className="text-xl font-mono font-bold tracking-widest text-cyan-400">
                        {createdSession.rawOtp}
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(createdSession.rawOtp || '');
                          setCopiedOtp(true);
                          setTimeout(() => setCopiedOtp(false), 2000);
                        }}
                        className="text-xs text-slate-400 hover:text-white flex items-center space-x-1"
                      >
                        {copiedOtp ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedOtp ? 'Copied' : 'Copy'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Access Link */}
                <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl">
                  <span className="text-xs text-slate-500 block mb-1">Direct Receiver Link</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-300 truncate max-w-[180px]">
                      {createdSession.accessUrl}
                    </span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(`http://localhost:3000${createdSession.accessUrl}`);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center space-x-1"
                    >
                      {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedLink ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs text-slate-500 space-y-1">
                  <p>SHA-256 Hash: {createdSession.fileHash.slice(0, 16)}...</p>
                  <p>Zero-Persistence: {createdSession.zeroPersistence ? 'Active (RAM only)' : 'Inactive'}</p>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-3">
                <Send className="w-10 h-10 mx-auto text-slate-700" />
                <p className="text-sm">Initiate an ephemeral transfer session on the left to generate the receiver link and QR code.</p>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Sessions List */
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-semibold text-white">Active Ephemeral Transfer Relays</h2>
            <button
              onClick={fetchSessions}
              className="text-xs text-cyan-400 hover:text-cyan-300"
            >
              Refresh Status
            </button>
          </div>

          {loadingSessions ? (
            <div className="py-12 text-center text-slate-500 text-sm">Loading active relays...</div>
          ) : sessions.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <Clock className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-sm">No active transfer sessions.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sessions.map((sess) => (
                <div
                  key={sess.id}
                  className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-cyan-400" />
                      <span className="font-semibold text-white text-sm">{sess.fileName}</span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-mono ${
                          sess.state === 'COMPLETED' || sess.state === 'CLEANED_UP'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                            : sess.state === 'WAITING_RECEIVER'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                        }`}
                      >
                        {sess.state}
                      </span>
                    </div>
                    <div className="text-xs text-slate-500 space-x-3">
                      <span>Token: {sess.sessionToken.slice(0, 12)}...</span>
                      <span>Hash: {sess.fileHash.slice(0, 10)}...</span>
                      <span>Zero-Persistence: {sess.zeroPersistence ? 'YES' : 'NO'}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {sess.state === 'WAITING_RECEIVER' && (
                      <button
                        onClick={() => handleCancelTransfer(sess.sessionToken)}
                        className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 rounded-lg text-xs border border-rose-500/30 flex items-center space-x-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Cancel & Purge</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
