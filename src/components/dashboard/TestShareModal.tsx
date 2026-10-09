'use client';

import React, { useState } from 'react';
import { 
  ShieldCheck, 
  X, 
  AlertTriangle, 
  Smartphone, 
  Mail, 
  Clock, 
  Flame, 
  Lock, 
  Check, 
  Radio, 
  RefreshCw 
} from 'lucide-react';
import { SimulationResult } from '@/services/ai/policyEngine';

interface TestShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialPolicy?: {
    securityLevel?: string;
    maxViews?: number;
    otpRequired?: boolean;
    registeredDeviceOnly?: boolean;
    expiresInHours?: number;
  };
}

export default function TestShareModal({ isOpen, onClose, initialPolicy }: TestShareModalProps) {
  const [loading, setLoading] = useState(false);
  const [registeredDeviceOnly, setRegisteredDeviceOnly] = useState(initialPolicy?.registeredDeviceOnly ?? true);
  const [otpRequired, setOtpRequired] = useState(initialPolicy?.otpRequired ?? true);
  const [maxViews, setMaxViews] = useState(initialPolicy?.maxViews ?? 1);
  const [expiresInHours, setExpiresInHours] = useState(initialPolicy?.expiresInHours ?? 24);
  const [simulations, setSimulations] = useState<SimulationResult[] | null>(null);

  if (!isOpen) return null;

  const runSimulation = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/security/simulate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          policy: {
            securityLevel: 'HIGH_SECURITY',
            registeredDeviceOnly,
            otpRequired,
            maxViews,
            expiresInHours,
            recipientRequired: true,
            downloadAllowed: false,
          },
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.simulation) {
        setSimulations(data.data.simulation);
      }
    } catch {
      // fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-950 border border-indigo-500/30 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-950/80 border border-indigo-500/40 text-indigo-400 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Policy Simulator &bull; Test My Share</h2>
              <p className="text-xs text-slate-400 font-mono">
                Isolated sandbox testing of access scenarios without mutating persistent database state.
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Controls */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-3">
            <div className="text-xs font-semibold text-slate-200">Configure Test Security Policy:</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={registeredDeviceOnly}
                  onChange={(e) => setRegisteredDeviceOnly(e.target.checked)}
                  className="rounded bg-slate-800 text-cyan-500 focus:ring-0"
                />
                <span>Registered Device Only</span>
              </label>
              <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={otpRequired}
                  onChange={(e) => setOtpRequired(e.target.checked)}
                  className="rounded bg-slate-800 text-cyan-500 focus:ring-0"
                />
                <span>OTP Required</span>
              </label>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Views:</span>
                <select
                  value={maxViews}
                  onChange={(e) => setMaxViews(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1"
                >
                  <option value={1}>1 (Atomic)</option>
                  <option value={2}>2 Views</option>
                  <option value={5}>5 Views</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-slate-400">Expiry:</span>
                <select
                  value={expiresInHours}
                  onChange={(e) => setExpiresInHours(Number(e.target.value))}
                  className="bg-slate-950 border border-slate-800 text-slate-200 text-xs rounded-lg px-2 py-1"
                >
                  <option value={1}>1 Hour</option>
                  <option value={24}>24 Hours</option>
                  <option value={168}>7 Days</option>
                </select>
              </div>
            </div>
            <button
              type="button"
              onClick={runSimulation}
              disabled={loading}
              className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
            >
              {loading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Radio className="w-3.5 h-3.5" />}
              <span>{loading ? 'Evaluating Access Scenarios...' : 'Run Security Simulation Matrix'}</span>
            </button>
          </div>

          {/* Results List */}
          {simulations && (
            <div className="space-y-3">
              <div className="text-xs font-mono uppercase text-slate-400 tracking-wider flex items-center justify-between">
                <span>Deterministic Outcome Matrix</span>
                <span className="text-cyan-400">{simulations.length} Scenarios Evaluated</span>
              </div>
              {simulations.map((sim, i) => (
                <div
                  key={i}
                  className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80 space-y-1.5 transition hover:border-slate-700"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-200 text-xs">{sim.name}</span>
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        sim.decision === 'ALLOW'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : sim.decision === 'BLOCK'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : 'bg-amber-950 text-amber-400 border border-amber-800'
                      }`}
                    >
                      {sim.decision}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono">Condition: {sim.condition}</div>
                  <div className="text-[11px] text-slate-300 font-sans leading-relaxed">{sim.reason}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
          >
            Close Simulator
          </button>
        </div>
      </div>
    </div>
  );
}
