'use client';

import React, { useState } from 'react';
import { Flame, AlertTriangle, X, Lock, RefreshCw } from 'lucide-react';

interface EmergencyLockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  activeCount: number;
}

export default function EmergencyLockModal({
  isOpen,
  onClose,
  onConfirm,
  activeCount,
}: EmergencyLockModalProps) {
  const [confirmInput, setConfirmInput] = useState('');
  const [locking, setLocking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleExecuteLock = async () => {
    if (confirmInput.trim().toUpperCase() !== 'REVOKE') {
      setError('Please type REVOKE to confirm emergency execution.');
      return;
    }
    setLocking(true);
    setError(null);
    try {
      await onConfirm();
      onClose();
    } catch {
      setError('Failed to trigger emergency revocation');
    } finally {
      setLocking(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-md bg-slate-950 border border-rose-500/50 rounded-3xl shadow-2xl shadow-rose-950/40 p-6 space-y-5">
        <div className="flex items-start justify-between">
          <div className="w-12 h-12 rounded-2xl bg-rose-950/80 border border-rose-500/40 text-rose-400 flex items-center justify-center shadow-lg shadow-rose-500/20">
            <Flame className="w-6 h-6 animate-pulse" />
          </div>
          <button onClick={onClose} className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-white tracking-tight">EMERGENCY VAULT LOCK</h2>
          <p className="text-xs text-rose-300 font-mono">
            CRITICAL CONTAINMENT ACTION: Immediate Cryptographic Invalidation
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-200 leading-relaxed space-y-2">
          <p>
            You are about to revoke all <span className="font-bold text-white underline">{activeCount} active items</span>.
            Any in-flight access tokens, QR codes, or receiver sessions will be permanently denied immediately.
          </p>
          <div className="text-[11px] text-slate-400 font-mono">
            &bull; Database status transitions from ACTIVE &rarr; REVOKED
            <br />
            &bull; Security incident logged to audit ledger
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300">
            Type <span className="text-rose-400 font-mono font-bold">REVOKE</span> to confirm containment:
          </label>
          <input
            type="text"
            value={confirmInput}
            onChange={(e) => setConfirmInput(e.target.value)}
            placeholder="Type REVOKE"
            className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-rose-900/60 text-rose-100 text-sm focus:border-rose-500 focus:outline-none font-mono uppercase text-center tracking-widest"
          />
        </div>

        {error && (
          <div className="p-3 rounded-xl bg-rose-950 border border-rose-800 text-rose-300 text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-800 transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleExecuteLock}
            disabled={locking || confirmInput.trim().toUpperCase() !== 'REVOKE'}
            className="w-1/2 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs shadow-lg shadow-rose-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {locking ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Flame className="w-3.5 h-3.5" />}
            <span>{locking ? 'Revoking All...' : 'Execute Lock'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
