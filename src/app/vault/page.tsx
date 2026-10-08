'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Lock, 
  Sparkles, 
  Key, 
  Clock, 
  Shield, 
  Check, 
  Copy, 
  ExternalLink,
  Flame,
  RefreshCw,
  Eye,
  Smartphone
} from 'lucide-react';
import { SecurityPolicyData, VaultItem } from '@/types';

export default function VaultPage() {
  const [activeTab, setActiveTab] = useState<'create' | 'list'>('create');
  
  // Form State
  const [title, setTitle] = useState('');
  const [plaintextSecret, setPlaintextSecret] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [aiPrompt, setAiPrompt] = useState('Send this contract to my manager. It is highly confidential. He should open it only once from his registered device before tomorrow and require OTP.');
  
  // Policy State
  const [policy, setPolicy] = useState<SecurityPolicyData>({
    securityLevel: 'HIGH_SECURITY',
    recipientRequired: true,
    recipientEmail: '',
    otpRequired: true,
    deviceRequired: true,
    registeredDeviceOnly: true,
    senderApproval: false,
    riskDetection: true,
    maxViews: 1,
    expiresInHours: 24,
  });

  const [aiGenerating, setAiGenerating] = useState(false);
  const [aiExplanation, setAiExplanation] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  
  // Generated Item Result Modal
  const [createdResult, setCreatedResult] = useState<{
    accessId: string;
    accessUrl: string;
    rawOtp?: string;
    maxViews: number;
    expiresAt: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedOtp, setCopiedOtp] = useState(false);

  // List State
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);

  // Load items
  const fetchItems = async () => {
    try {
      const res = await fetch('/api/vault/list');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingItems(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'list') return;
    let ignore = false;
    async function load() {
      try {
        const res = await fetch('/api/vault/list');
        const data = await res.json();
        if (!ignore && data.success && Array.isArray(data.data)) {
          setItems(data.data);
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!ignore) setLoadingItems(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [activeTab]);

  // Handle AI Policy Generation
  const handleGenerateAiPolicy = async () => {
    if (!aiPrompt.trim()) return;
    setAiGenerating(true);
    try {
      const res = await fetch('/api/security/policy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: aiPrompt }),
      });
      const data = await res.json();
      if (data.success && data.data?.policy) {
        setPolicy(data.data.policy);
        setAiExplanation(data.data.explanation);
        if (data.data.policy.recipientEmail) {
          setRecipientEmail(data.data.policy.recipientEmail);
        }
      }
    } catch (err) {
      console.error('Failed to generate policy', err);
    } finally {
      setAiGenerating(false);
    }
  };

  // Handle Create Vault Item
  const handleCreateVaultItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !plaintextSecret) {
      alert('Please provide a title and confidential content.');
      return;
    }

    setCreating(true);
    try {
      const res = await fetch('/api/vault/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          plaintextSecret,
          recipientEmail: recipientEmail || policy.recipientEmail,
          policy,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setCreatedResult({
          accessId: data.data.accessId,
          accessUrl: `${window.location.origin}${data.data.accessUrl}`,
          rawOtp: data.data.rawOtp,
          maxViews: data.data.maxViews,
          expiresAt: data.data.expiresAt,
        });
        // Clear form
        setTitle('');
        setPlaintextSecret('');
      } else {
        alert(data.error || 'Failed to create item');
      }
    } catch (err) {
      console.error(err);
      alert('Network error while creating vault item');
    } finally {
      setCreating(false);
    }
  };

  // Handle Revoke / Emergency Lock / Burn
  const handleRevoke = async (itemId: string, actionType: 'REVOKE' | 'EMERGENCY_LOCK' | 'BURN' = 'REVOKE') => {
    const confirmMsg = actionType === 'EMERGENCY_LOCK' 
      ? 'Trigger EMERGENCY LOCK? All active access sessions and tokens will be immediately severed.'
      : actionType === 'BURN'
      ? 'Burn this item? Cryptographic ciphertext will be permanently purged from storage.'
      : 'Are you sure you want to revoke access to this item?';
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/vault/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, actionType }),
      });
      const data = await res.json();
      if (data.success) {
        fetchItems();
      } else {
        alert(data.error || 'Operation failed');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Lock className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">RealityVault Core</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Authenticated AES-256-GCM encryption, adaptive policy enforcement, and atomic 1-time lifecycle.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex p-1 bg-slate-900 border border-slate-800 rounded-xl">
          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'create'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Create Secure Item
          </button>
          <button
            onClick={() => setActiveTab('list')}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'list'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            Manage Vault Items
          </button>
        </div>
      </div>

      {/* TAB 1: CREATE ITEM */}
      {activeTab === 'create' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Form (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            <form onSubmit={handleCreateVaultItem} className="glass-panel p-6 border-slate-800 space-y-5">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                <span>1. Payload & Metadata</span>
              </h2>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Secret Title / Subject</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Master API Keys / Vendor Contract Alpha"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Confidential Content (Encrypted with AES-256-GCM before storage)
                </label>
                <textarea
                  required
                  rows={4}
                  value={plaintextSecret}
                  onChange={(e) => setPlaintextSecret(e.target.value)}
                  placeholder="Enter sensitive message, credentials, or private contract text..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-300">Recipient Email (Optional Restriction)</label>
                <input
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="manager@enterprise.com"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>

              {/* AI Natural Language Policy Box */}
              <div className="pt-2 border-t border-slate-800/80 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-cyan-400 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>AI Security Intent (Natural Language)</span>
                  </label>
                  <span className="text-[11px] text-slate-400 font-mono">Core Innovation</span>
                </div>

                <div className="relative">
                  <textarea
                    rows={2}
                    value={aiPrompt}
                    onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe how this item should be protected in plain English..."
                    className="w-full px-3.5 py-2 rounded-xl bg-cyan-950/20 border border-cyan-800/40 text-slate-200 text-xs focus:border-cyan-400 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={handleGenerateAiPolicy}
                    disabled={aiGenerating}
                    className="mt-2 w-full px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-indigo-600 hover:from-cyan-500 hover:to-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-md transition disabled:opacity-50"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{aiGenerating ? 'AI Generating Structured Policy...' : 'Compile Intent &rarr; AI Security Policy'}</span>
                  </button>
                </div>

                {aiExplanation && (
                  <p className="text-[11px] text-cyan-300/80 bg-cyan-950/40 p-2.5 rounded-lg border border-cyan-800/30">
                    &ldquo;{aiExplanation}&rdquo;
                  </p>
                )}
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Lock className="w-4 h-4" />
                <span>{creating ? 'Encrypting with AES-256-GCM...' : 'Encrypt & Generate Secure Access Link'}</span>
              </button>
            </form>
          </div>

          {/* Right Policy Preview Panel (5 cols) */}
          <div className="lg:col-span-5 space-y-4">
            <div className="glass-panel p-6 border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Shield className="w-4 h-4 text-cyan-400" />
                  <span>Enforceable Policy Breakdown</span>
                </h3>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                  {policy.securityLevel}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                {/* Max Views */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-rose-400" />
                    <div>
                      <div className="font-semibold text-slate-200">One-Time / Max Views</div>
                      <div className="text-[10px] text-slate-400">Atomic destruction upon view</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-rose-400 text-sm">{policy.maxViews} View</span>
                </div>

                {/* Expiration */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-amber-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Lifecycle Expiration</div>
                      <div className="text-[10px] text-slate-400">Auto-invalidated after window</div>
                    </div>
                  </div>
                  <span className="font-mono font-bold text-amber-400">{policy.expiresInHours} Hours</span>
                </div>

                {/* OTP Requirement */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Key className="w-4 h-4 text-cyan-400" />
                    <div>
                      <div className="font-semibold text-slate-200">OTP Challenge</div>
                      <div className="text-[10px] text-slate-400">Salted scrypt hash challenge</div>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${policy.otpRequired ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {policy.otpRequired ? 'ENFORCED' : 'OFF'}
                  </span>
                </div>

                {/* Device Requirement */}
                <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-indigo-400" />
                    <div>
                      <div className="font-semibold text-slate-200">Device Fingerprint</div>
                      <div className="text-[10px] text-slate-400">Hardware verification</div>
                    </div>
                  </div>
                  <span className={`font-mono font-bold ${policy.registeredDeviceOnly ? 'text-emerald-400' : 'text-slate-400'}`}>
                    {policy.registeredDeviceOnly ? 'REGISTERED ONLY' : 'ANY DEVICE'}
                  </span>
                </div>
              </div>

              {/* Cryptography Guarantee Box */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-900/40 text-[11px] text-slate-300 space-y-1 font-mono">
                <div className="text-cyan-400 font-bold">&bull; Cryptographic Guarantee:</div>
                <p className="text-slate-400">
                  Unique 96-bit IV generated per item. Ciphertext and 128-bit authentication tag stored in database. Keys strictly separated.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MANAGE ITEMS */}
      {activeTab === 'list' && (
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>All Active & Historical Vault Items</span>
            </h2>
            <button
              onClick={fetchItems}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>

          {loadingItems ? (
            <div className="py-12 text-center text-sm text-slate-400">Loading vault items...</div>
          ) : items.length === 0 ? (
            <div className="py-12 text-center text-sm text-slate-400 space-y-2">
              <Lock className="w-8 h-8 text-slate-600 mx-auto" />
              <p>No vault items found. Create one using the &ldquo;Create Secure Item&rdquo; tab.</p>
            </div>
          ) : (
            <div className="space-y-3 overflow-x-auto">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-bold text-sm text-slate-100 flex items-center gap-2">
                      <span>{item.title}</span>
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                        {item.securityLevel}
                      </span>
                    </div>

                    <div className="text-slate-400 flex flex-wrap items-center gap-3 font-mono text-[11px]">
                      <span>Views: {item.currentViews}/{item.maxViews}</span>
                      <span>&bull;</span>
                      <span>Recipient: {item.recipientEmail || 'Any Authorized'}</span>
                      <span>&bull;</span>
                      <span>Expires: {item.expiresAt ? new Date(item.expiresAt).toLocaleString() : 'N/A'}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span
                      className={`px-2.5 py-1 rounded text-[11px] font-mono font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : item.status === 'CONSUMED'
                          ? 'bg-rose-950 text-rose-400 border border-rose-800'
                          : item.status === 'REVOKED'
                          ? 'bg-amber-950 text-amber-400 border border-amber-800'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>

                    <Link
                      href={`/vault/access/${item.accessId}`}
                      target="_blank"
                      className="px-3 py-1.5 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-800/60 font-semibold flex items-center gap-1 transition"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Test Access Portal</span>
                    </Link>

                    {item.status === 'ACTIVE' && (
                      <button
                        onClick={() => handleRevoke(item.id)}
                        className="px-2.5 py-1.5 rounded-lg bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/60 font-semibold transition"
                      >
                        Revoke
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* POPUP MODAL: CREATED ITEM LINK & CREDENTIALS */}
      {createdResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="glass-panel p-6 sm:p-8 max-w-lg w-full border-cyan-500/40 space-y-6 shadow-2xl relative">
            <div className="text-center space-y-2">
              <div className="w-12 h-12 rounded-full bg-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto border border-cyan-500/40">
                <Check className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Item Encrypted & Link Created</h3>
              <p className="text-xs text-slate-400">
                Your payload is protected with AES-256-GCM. Share this non-enumerable access link with the recipient.
              </p>
            </div>

            {/* Access URL Box */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Secure Access URL (Non-Enumerable)</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={createdResult.accessUrl}
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-cyan-300 font-mono"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(createdResult.accessUrl);
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

            {/* OTP Code Box if generated */}
            {createdResult.rawOtp && (
              <div className="p-3.5 rounded-xl bg-indigo-950/50 border border-indigo-700/60 space-y-1">
                <div className="text-xs font-semibold text-indigo-300 flex items-center justify-between">
                  <span>One-Time Password (OTP) Challenge:</span>
                  <span className="text-[10px] text-amber-400 font-mono">DELIVER SEPARATELY</span>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="font-mono text-2xl font-black tracking-widest text-white">
                    {createdResult.rawOtp}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdResult.rawOtp || '');
                      setCopiedOtp(true);
                      setTimeout(() => setCopiedOtp(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-medium transition"
                  >
                    {copiedOtp ? 'Copied' : 'Copy OTP'}
                  </button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center justify-between pt-2">
              <Link
                href={createdResult.accessUrl}
                target="_blank"
                className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
              >
                <span>Open Receiver Flow in New Tab</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </Link>

              <button
                onClick={() => setCreatedResult(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
