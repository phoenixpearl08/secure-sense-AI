'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Inbox, 
  Shield, 
  Lock, 
  Key, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  ArrowRight, 
  Smartphone, 
  Flame, 
  Eye, 
  EyeOff, 
  ExternalLink,
  RefreshCw,
  FileText
} from 'lucide-react';
import { VaultItem } from '@/types';

export default function ReceiverPortalPage() {
  const router = useRouter();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [statusTab, setStatusTab] = useState<'ALL' | 'ACTIVE' | 'EXPIRING' | 'DOWNLOADABLE' | 'VIEW_ONLY' | 'DESTROYED'>('ALL');
  const [manualAccessId, setManualAccessId] = useState('');

  const fetchItems = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/vault/list');
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setItems(data.data);
      }
    } catch (err) {
      console.error('Failed to load receiver items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleResolveAccessId = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanId = manualAccessId.trim().replace(/^.*\/vault\/access\//, '');
    if (cleanId) {
      router.push(`/vault/access/${cleanId}`);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = 
      item.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      item.accessId.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (item.recipientEmail && item.recipientEmail.toLowerCase().includes(searchFilter.toLowerCase()));

    if (!matchesSearch) return false;

    if (statusTab === 'ACTIVE') return item.status === 'ACTIVE';
    if (statusTab === 'EXPIRING') {
      if (item.status !== 'ACTIVE' || !item.expiresAt) return false;
      const msLeft = new Date(item.expiresAt).getTime() - Date.now();
      return msLeft > 0 && msLeft < 24 * 3600 * 1000;
    }
    if (statusTab === 'DOWNLOADABLE') {
      return item.status === 'ACTIVE' && item.policy?.downloadAllowed;
    }
    if (statusTab === 'VIEW_ONLY') {
      return item.status === 'ACTIVE' && !item.policy?.downloadAllowed;
    }
    if (statusTab === 'DESTROYED') return item.status === 'CONSUMED' || item.status === 'DESTROYED' || item.status === 'REVOKED';

    return true;
  });

  return (
    <div className="space-y-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Inbox className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Dedicated Receiver Portal</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Trust incoming document queue, identity challenges, and controlled access viewer.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchItems}
          className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700/60 flex items-center gap-1.5 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Queue</span>
        </button>
      </div>

      {/* Manual Access Code Resolver Box */}
      <div className="glass-panel p-5 border-slate-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-white font-bold text-xs">
            <Key className="w-4 h-4 text-cyan-400" />
            <span>Have an Access Token, Link, or Pairing Code?</span>
          </div>
          <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
            Direct Challenge Gateway
          </span>
        </div>

        <form onSubmit={handleResolveAccessId} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            required
            placeholder="Paste full URL or enter Access ID (e.g. 5f8b9a12c4d0)..."
            value={manualAccessId}
            onChange={(e) => setManualAccessId(e.target.value)}
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono text-xs focus:border-cyan-500 focus:outline-none"
          />
          <button
            type="submit"
            className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow transition"
          >
            <span>Verify & Open Challenge</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Controls: Search and Status Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'ALL' as const, label: 'All Inbound' },
            { id: 'ACTIVE' as const, label: 'Active & Ready' },
            { id: 'EXPIRING' as const, label: 'Expiring Soon' },
            { id: 'DOWNLOADABLE' as const, label: 'Downloadable' },
            { id: 'VIEW_ONLY' as const, label: 'View-Only' },
            { id: 'DESTROYED' as const, label: 'Consumed / Purged' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setStatusTab(tab.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${
                statusTab === tab.id
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search title, ID, or recipient..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Inbound Shares List */}
      {loading ? (
        <div className="glass-panel p-12 text-center text-xs font-mono text-slate-400 flex items-center justify-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-cyan-400" />
          <span>Scanning inbound cryptographic envelopes...</span>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="glass-panel p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mx-auto">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-white">No Inbound Documents Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {searchFilter ? 'No items match your active search filters.' : 'Your receiver inbox is clear. New incoming cryptographic shares will appear here.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {filteredItems.map((item) => {
            const isPurged = item.status === 'CONSUMED' || item.status === 'DESTROYED';
            const isExpired = item.status === 'EXPIRED';
            const isLocked = item.status === 'LOCKED';
            const isVisibleSender = item.policy?.senderIdentityVisibility !== 'HIDDEN';

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition space-y-3 text-xs ${
                  item.status === 'ACTIVE'
                    ? 'glass-panel border-slate-800 hover:border-cyan-500/40'
                    : 'bg-slate-950/60 border-slate-900 opacity-80'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/60 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-cyan-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{item.title}</h3>
                      <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2 mt-0.5">
                        <span>Access ID: <code className="text-cyan-300">{item.accessId}</code></span>
                        <span>&bull;</span>
                        <span>
                          Sender:{' '}
                          {isVisibleSender ? (
                            <span className="text-slate-300">{item.creatorName || 'Authorized Officer'}</span>
                          ) : (
                            <span className="text-purple-400 font-bold">[MAXIMUM PRIVACY HIDDEN]</span>
                          )}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                          : isPurged
                          ? 'bg-rose-950 text-rose-400 border-rose-800'
                          : isExpired
                          ? 'bg-amber-950 text-amber-400 border-amber-800'
                          : 'bg-slate-900 text-slate-400 border-slate-800'
                      }`}
                    >
                      {item.status}
                    </span>

                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                      {item.securityLevel}
                    </span>
                  </div>
                </div>

                {/* Constraints Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] text-slate-300 font-mono">
                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">OTP Verification</span>
                    <span className={item.policy?.otpRequired ? 'text-amber-400' : 'text-slate-400'}>
                      {item.policy?.otpRequired ? 'ENFORCED (6-DIGIT)' : 'NOT REQUIRED'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">Hardware Binding</span>
                    <span className={item.policy?.registeredDeviceOnly ? 'text-cyan-400' : 'text-slate-400'}>
                      {item.policy?.registeredDeviceOnly ? 'WHITELIST ONLY' : 'ANY BROWSER'}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">Remaining Views</span>
                    <span className="text-slate-200">
                      {item.maxViews - item.currentViews} of {item.maxViews}
                    </span>
                  </div>

                  <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
                    <span className="text-[9px] text-slate-500 block uppercase">Download Policy</span>
                    <span className={item.policy?.downloadAllowed ? 'text-emerald-400' : 'text-rose-400'}>
                      {item.policy?.downloadAllowed ? 'DOWNLOAD PERMITTED' : 'CONTROLLED VIEWER'}
                    </span>
                  </div>
                </div>

                {/* Footer Action */}
                <div className="flex items-center justify-between pt-1">
                  <div className="text-[10px] text-slate-400 font-mono">
                    {item.expiresAt && (
                      <span>Expires: {new Date(item.expiresAt).toLocaleString()}</span>
                    )}
                  </div>

                  <Link
                    href={`/vault/access/${item.accessId}`}
                    className={`px-4 py-1.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition ${
                      item.status === 'ACTIVE'
                        ? 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white shadow'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    <span>{item.status === 'ACTIVE' ? 'Open Challenge Portal' : 'View Audit Status'}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
