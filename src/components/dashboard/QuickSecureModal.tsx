'use client';

import React, { useState } from 'react';
import { 
  Sparkles, 
  ShieldCheck, 
  AlertTriangle, 
  Lock, 
  Check, 
  X, 
  RefreshCw,
  Eye,
  Sliders,
  Send,
  Copy
} from 'lucide-react';
import { SecurityPolicyData, PolicyConflictWarning, SecurityScoreReport } from '@/types';
import { SimulationResult } from '@/services/ai/policyEngine';

interface QuickSecureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (createdItem: { id: string; accessId: string; title: string }) => void;
}

export default function QuickSecureModal({ isOpen, onClose, onSuccess }: QuickSecureModalProps) {
  const [prompt, setPrompt] = useState(
    'Send this confidential contract to Arun. He should open it once from his registered laptop before tomorrow. Download should be disabled.'
  );
  const [recipientEmail, setRecipientEmail] = useState('arun@securesense.ai');
  const [secretContent, setSecretContent] = useState('EXECUTIVE_CONTRACT_TERMS_ALPHA_2026: Total valuation $42.5M USD.');
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Policy output state
  const [generatedPolicy, setGeneratedPolicy] = useState<SecurityPolicyData | null>(null);
  const [securityScore, setSecurityScore] = useState<SecurityScoreReport | null>(null);
  const [conflicts, setConflicts] = useState<PolicyConflictWarning[]>([]);
  const [simulations, setSimulations] = useState<SimulationResult[]>([]);
  const [showSimulator, setShowSimulator] = useState(false);

  if (!isOpen) return null;

  const handleGeneratePolicy = async () => {
    setAnalyzing(true);
    setError(null);
    try {
      const res = await fetch('/api/security/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json();
      if (data.success && data.data) {
        setGeneratedPolicy(data.data.policy);
        setSecurityScore(data.data.securityScore || data.data.score);
        setConflicts(data.data.conflicts || []);
        setSimulations(data.data.simulation || []);
      } else {
        setError(data.error || 'Failed to compile AI security policy');
      }
    } catch {
      setError('Network failure contacting AI policy engine');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApproveAndSend = async () => {
    if (!generatedPolicy) return;
    setSubmitting(true);
    setError(null);
    try {
      const payloadPolicy: SecurityPolicyData = {
        ...generatedPolicy,
        recipientEmail: recipientEmail.trim().toLowerCase(),
        recipientRequired: Boolean(recipientEmail),
      };

      const res = await fetch('/api/vault/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: 'DocSense Confidential Contract',
          plaintextSecret: secretContent,
          recipientEmail: recipientEmail.trim().toLowerCase(),
          policy: payloadPolicy,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        onSuccess(data.data);
        onClose();
      } else {
        setError(data.error || 'Failed to encrypt and persist vault item');
      }
    } catch {
      setError('Cryptographic encryption or persistence failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFixConflictAutomatically = (conflict: PolicyConflictWarning) => {
    if (!generatedPolicy) return;
    setGeneratedPolicy({
      ...generatedPolicy,
      [conflict.field]: conflict.resolvedValue,
    });
    setConflicts((prev) => prev.filter((c) => c.field !== conflict.field));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="w-full max-w-2xl bg-slate-950 border border-cyan-500/30 rounded-3xl shadow-2xl shadow-cyan-500/10 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-gradient-to-r from-slate-900 to-slate-950">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-500/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">AI Secure This For Me</h2>
              <p className="text-xs text-slate-400 font-mono">
                Natural-Language Intent &rarr; AI Recommendation &rarr; Cryptographic Enforcement
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar">
          {/* Natural Language Box */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
              <span>Natural-Language Security Requirements:</span>
              <span className="text-[10px] text-cyan-400 font-mono">AI POLICY GENERATOR</span>
            </label>
            <textarea
              rows={3}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Send this to Arun. He can open it once from his registered laptop before tomorrow. Download disabled."
              className="w-full p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none transition resize-none leading-relaxed"
            />
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-400 font-mono">
                Prompt injection defense &amp; deterministic schema validation active.
              </span>
              <button
                type="button"
                onClick={handleGeneratePolicy}
                disabled={analyzing || !prompt.trim()}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs shadow-lg shadow-cyan-600/20 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {analyzing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                <span>{analyzing ? 'Compiling Policy...' : 'Compile Security Policy'}</span>
              </button>
            </div>
          </div>

          {/* Generated Policy Review & Conflicts */}
          {generatedPolicy && (
            <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800/80 space-y-4 animate-fade-in">
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Compiled Security Policy
                  </span>
                </div>
                {securityScore && (
                  <span className="text-xs font-mono font-bold text-emerald-400 bg-emerald-950 px-2.5 py-0.5 rounded-full border border-emerald-800">
                    Security Score: {securityScore.score}/100
                  </span>
                )}
              </div>

              {/* Policy Parameters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono">
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Security Level</div>
                  <div className="text-cyan-300 font-bold mt-0.5">{generatedPolicy.securityLevel}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">View Constraint</div>
                  <div className="text-emerald-300 font-bold mt-0.5">
                    {generatedPolicy.maxViews === 1 ? '1-Time Atomic' : `${generatedPolicy.maxViews} Views`}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Zero-Trust Device</div>
                  <div className="text-indigo-300 font-bold mt-0.5">
                    {generatedPolicy.registeredDeviceOnly ? 'Registered Only' : 'Any Device'}
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="text-slate-400 text-[10px]">Lifecycle Expiry</div>
                  <div className="text-amber-300 font-bold mt-0.5">{generatedPolicy.expiresInHours}h</div>
                </div>
              </div>

              {/* Conflict Detector Warnings */}
              {conflicts.length > 0 && (
                <div className="space-y-2">
                  {conflicts.map((conflict, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-amber-950/40 border border-amber-600/40 text-xs flex items-start justify-between gap-3"
                    >
                      <div className="flex items-start gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                        <div>
                          <div className="font-semibold text-amber-200">Policy Conflict Detected</div>
                          <div className="text-[11px] text-amber-300 font-mono mt-0.5">{conflict.message}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => handleFixConflictAutomatically(conflict)}
                          className="px-2.5 py-1 rounded-lg bg-amber-900/80 hover:bg-amber-800 text-amber-200 text-[10px] font-bold border border-amber-700 transition"
                        >
                          Fix Automatically
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Recipient & Secret Input Fields */}
              <div className="space-y-3 pt-1 border-t border-slate-800/80">
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Authorized Recipient Email:</label>
                  <input
                    type="email"
                    value={recipientEmail}
                    onChange={(e) => setRecipientEmail(e.target.value)}
                    placeholder="recipient@securesense.ai"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-medium text-slate-300">Confidential Secret / Document Content:</label>
                  <textarea
                    rows={2}
                    value={secretContent}
                    onChange={(e) => setSecretContent(e.target.value)}
                    placeholder="Enter confidential text or key"
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none font-mono resize-none"
                  />
                </div>
              </div>

              {/* Policy Simulator Toggle */}
              {simulations.length > 0 && (
                <div className="pt-1">
                  <button
                    type="button"
                    onClick={() => setShowSimulator(!showSimulator)}
                    className="text-xs text-cyan-400 hover:underline font-mono flex items-center gap-1.5"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>{showSimulator ? 'Hide Policy Simulation Results' : 'View Policy Simulator (Test My Share)'}</span>
                  </button>

                  {showSimulator && (
                    <div className="mt-3 space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {simulations.map((sim, i) => (
                        <div
                          key={i}
                          className="p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-[11px]"
                        >
                          <div>
                            <div className="font-semibold text-slate-200">{sim.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">{sim.reason}</div>
                          </div>
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
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-5 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApproveAndSend}
            disabled={!generatedPolicy || submitting}
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 disabled:opacity-50"
          >
            {submitting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            <span>{submitting ? 'Encrypting with AES-256-GCM...' : 'Approve Policy & Encrypt'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
