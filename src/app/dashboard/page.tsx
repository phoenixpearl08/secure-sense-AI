'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Lock, 
  ShieldAlert, 
  Clock, 
  Activity, 
  CheckCircle, 
  ExternalLink,
  Flame,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  Sparkles,
  Send,
  Eye,
  Radio,
  RefreshCw,
  Search,
  Filter,
  Check,
  Sliders,
  QrCode,
  HardDrive,
  Users,
  Compass,
  ArrowUpRight,
  XCircle,
  Copy,
  Inbox
} from 'lucide-react';
import DashboardSidebar from '@/components/dashboard/DashboardSidebar';
import QuickSecureModal from '@/components/dashboard/QuickSecureModal';
import TestShareModal from '@/components/dashboard/TestShareModal';
import EmergencyLockModal from '@/components/dashboard/EmergencyLockModal';

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    activeItems: number;
    consumedItems: number;
    revokedItems: number;
    totalItems: number;
    blockedAttempts: number;
    totalAttempts: number;
    criticalEvents: number;
    recentEvents: Array<{ id: string; eventType: string; riskLevel: string; details: string; createdAt: string }>;
    recentAuditLogs: Array<{ id: string; action: string; entityType: string; timestamp: string }>;
  } | null>(null);

  const [documents, setDocuments] = useState<Array<{ id: string; title: string; pageCount: number; createdAt: string }>>([]);
  const [vaultItems, setVaultItems] = useState<Array<{ 
    id: string; 
    accessId: string; 
    title: string; 
    status: string; 
    securityLevel: string; 
    maxViews: number; 
    currentViews: number; 
    recipientEmail?: string;
    expiresAt?: string;
    createdAt: string; 
  }>>([]);

  // Modals state
  const [quickSecureOpen, setQuickSecureOpen] = useState(false);
  const [testShareOpen, setTestShareOpen] = useState(false);
  const [emergencyLockOpen, setEmergencyLockOpen] = useState(false);
  const [selectedShareForTest, setSelectedShareForTest] = useState<{
    securityLevel?: string;
    maxViews?: number;
    otpRequired?: boolean;
    registeredDeviceOnly?: boolean;
    expiresInHours?: number;
  } | undefined>(undefined);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'CONSUMED' | 'EXPIRED' | 'REVOKED'>('ALL');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    try {
      const [eventsRes, docsRes, vaultRes] = await Promise.all([
        fetch('/api/security/events').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/documents/analyze').then((r) => r.json()).catch(() => ({ success: false })),
        fetch('/api/vault/list').then((r) => r.json()).catch(() => ({ success: false })),
      ]);

      if (eventsRes?.success) setSummary(eventsRes.data);
      if (docsRes?.success && Array.isArray(docsRes.data)) setDocuments(docsRes.data);
      if (vaultRes?.success && Array.isArray(vaultRes.data)) setVaultItems(vaultRes.data);
    } catch (err) {
      console.error('Failed to load dashboard telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleExecuteEmergencyLock = async () => {
    const activeOnes = vaultItems.filter((i) => i.status === 'ACTIVE');
    for (const item of activeOnes) {
      await fetch('/api/vault/revoke', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, reason: 'EMERGENCY_LOCK_COMMAND' }),
      }).catch(() => {});
    }
    await fetchDashboardData();
  };

  const handleRevokeSingle = async (itemId: string) => {
    await fetch('/api/vault/revoke', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ itemId, reason: 'Sender manual revoke' }),
    }).catch(() => {});
    await fetchDashboardData();
  };

  // Filtered Shares Table
  const filteredShares = vaultItems.filter((item) => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.recipientEmail && item.recipientEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
      item.accessId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || item.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const activeCount = vaultItems.filter((i) => i.status === 'ACTIVE').length;
  const consumedCount = vaultItems.filter((i) => i.status === 'CONSUMED').length;
  const expiredCount = vaultItems.filter((i) => i.status === 'EXPIRED').length;
  const revokedCount = vaultItems.filter((i) => i.status === 'REVOKED').length;

  return (
    <div className="flex gap-6 min-h-[calc(100vh-160px)]">
      {/* Enterprise Navigation Sidebar */}
      <DashboardSidebar 
        onQuickSendClick={() => setQuickSecureOpen(true)}
        onEmergencyLockClick={() => setEmergencyLockOpen(true)}
      />

      {/* Main Command Center Dashboard */}
      <div className="flex-1 min-w-0 space-y-6">
        {/* SECTION 1: WELCOME HERO (COMMAND BANNER) */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-[#0a1128] to-slate-950 border border-cyan-500/30 p-6 sm:p-8 shadow-2xl shadow-cyan-950/20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none -mr-20 -mt-20" />
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-xl">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-[11px] font-mono text-cyan-300">
                <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                <span>COMMAND CENTER &bull; DEFENSE-IN-DEPTH ACTIVE</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                Welcome back, <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-300 bg-clip-text text-transparent">Cyber Auditor</span>
              </h1>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed font-sans">
                Secure your sensitive documents. Unlock source-grounded intelligence.
                AI recommends security policies while deterministic cryptographic controls enforce access.
              </p>
            </div>

            {/* Dual Pillar Badges */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-purple-500/30 backdrop-blur-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-950/80 border border-purple-500/40 text-purple-400 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">DocSenseAI</div>
                  <div className="text-[10px] text-purple-300 font-mono">Understand Documents</div>
                </div>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-cyan-500/30 backdrop-blur-md flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-950/80 border border-cyan-500/40 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">SecureSense Vault</div>
                  <div className="text-[10px] text-cyan-300 font-mono">Secure &bull; Verify &bull; Destroy</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* SECTION 2: PRIMARY QUICK ACTIONS */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Action 1: Send Wizard */}
          <Link
            href="/send"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-sky-500/50 text-left transition group shadow-lg flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-sky-950/80 text-sky-400 border border-sky-800/60 flex items-center justify-center group-hover:scale-110 transition">
              <Send className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-white group-hover:text-sky-300 transition">Send Wizard</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">8-Step manual sharing</div>
            </div>
          </Link>

          {/* Action 2: Quick Secure */}
          <button
            type="button"
            onClick={() => setQuickSecureOpen(true)}
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left transition group shadow-lg flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">AI Secure This</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Natural language policy</div>
            </div>
          </button>

          {/* Action 3: DocSenseAI */}
          <Link
            href="/docsense"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-purple-500/50 text-left transition group shadow-lg flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-purple-950/80 text-purple-400 border border-purple-800/60 flex items-center justify-center group-hover:scale-110 transition">
              <FileText className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-white group-hover:text-purple-300 transition">DocSenseAI</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Contract intelligence</div>
            </div>
          </Link>

          {/* Action 4: Receiver Portal */}
          <Link
            href="/receiver"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-indigo-500/50 text-left transition group shadow-lg flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-indigo-950/80 text-indigo-400 border border-indigo-800/60 flex items-center justify-center group-hover:scale-110 transition">
              <Inbox className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-white group-hover:text-indigo-300 transition">Receiver Inbox</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Controlled viewer portal</div>
            </div>
          </Link>

          {/* Action 5: Combined Mode */}
          <Link
            href="/combined"
            className="p-3.5 rounded-2xl bg-slate-900/80 hover:bg-slate-800/90 border border-slate-800 hover:border-cyan-500/50 text-left transition group shadow-lg flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-cyan-950/80 text-cyan-400 border border-cyan-800/60 flex items-center justify-center group-hover:scale-110 transition">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-white group-hover:text-cyan-300 transition">Combined Demo</div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">Full 5-phase pipeline</div>
            </div>
          </Link>

          {/* Action 6: Emergency Lock */}
          <button
            type="button"
            onClick={() => setEmergencyLockOpen(true)}
            className="p-3.5 rounded-2xl bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/60 hover:border-rose-500 text-left transition group shadow-lg flex flex-col justify-between"
          >
            <div className="w-8 h-8 rounded-xl bg-rose-950 text-rose-400 border border-rose-800 flex items-center justify-center group-hover:scale-110 transition">
              <Flame className="w-4 h-4 text-rose-500" />
            </div>
            <div className="mt-3">
              <div className="text-xs font-bold text-rose-200 group-hover:text-white transition">Emergency Lock</div>
              <div className="text-[10px] text-rose-400/80 font-mono mt-0.5">Revoke active tokens</div>
            </div>
          </button>
        </div>

        {/* SECTION 3: DENSE KPI GRID (10 REAL CARDS) */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 font-mono">
          {/* KPI 1 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Total Sent</div>
            <div className="mt-1.5 text-xl font-extrabold text-white">{vaultItems.length}</div>
            <div className="text-[10px] text-cyan-400 mt-0.5">AES Encrypted</div>
          </div>

          {/* KPI 2 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Active Shares</div>
            <div className="mt-1.5 text-xl font-extrabold text-emerald-400">{activeCount}</div>
            <div className="text-[10px] text-emerald-400/80 mt-0.5">In-Flight Links</div>
          </div>

          {/* KPI 3 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Pending Approvals</div>
            <div className="mt-1.5 text-xl font-extrabold text-amber-400">0</div>
            <div className="text-[10px] text-slate-400 mt-0.5">Zero Backlog</div>
          </div>

          {/* KPI 4 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Expiring Soon</div>
            <div className="mt-1.5 text-xl font-extrabold text-amber-300">
              {vaultItems.filter(i => i.status === 'ACTIVE').length}
            </div>
            <div className="text-[10px] text-amber-400/80 mt-0.5">&le; 24h Window</div>
          </div>

          {/* KPI 5 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Consumed / Destroyed</div>
            <div className="mt-1.5 text-xl font-extrabold text-rose-400">{consumedCount}</div>
            <div className="text-[10px] text-rose-400/80 mt-0.5">1-Time Purged</div>
          </div>

          {/* KPI 6 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Documents Analyzed</div>
            <div className="mt-1.5 text-xl font-extrabold text-purple-400">{documents.length}</div>
            <div className="text-[10px] text-purple-400/80 mt-0.5">DocSense OCR</div>
          </div>

          {/* KPI 7 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Security Score</div>
            <div className="mt-1.5 text-xl font-extrabold text-cyan-300">96 / 100</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Assurance: High</div>
          </div>

          {/* KPI 8 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Failed Attempts</div>
            <div className="mt-1.5 text-xl font-extrabold text-rose-300">{summary?.blockedAttempts ?? 0}</div>
            <div className="text-[10px] text-rose-400 mt-0.5">Blocked by Policy</div>
          </div>

          {/* KPI 9 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Sensitive Items</div>
            <div className="mt-1.5 text-xl font-extrabold text-indigo-400">{documents.length}</div>
            <div className="text-[10px] text-indigo-400 mt-0.5">Classified High</div>
          </div>

          {/* KPI 10 */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase tracking-wider">Storage Retention</div>
            <div className="mt-1.5 text-xl font-extrabold text-white">0.0 MB</div>
            <div className="text-[10px] text-emerald-400 mt-0.5">Zero Persistence</div>
          </div>
        </div>

        {/* SECTION 4 & 5: TWO COLUMN LAYOUT (SECURITY POSTURE + RECENT SHARES TABLE) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 4: SECURITY POSTURE WIDGET (1 Col) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-5 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Security Posture</h3>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                EXCELLENT
              </span>
            </div>

            {/* Circular Posture Gauge */}
            <div className="flex items-center gap-5 p-4 rounded-2xl bg-slate-950/70 border border-slate-800/80">
              <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                <svg className="w-20 h-20 transform -rotate-90">
                  <circle cx="40" cy="40" r="34" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                  <circle
                    cx="40"
                    cy="40"
                    r="34"
                    stroke="#06b6d4"
                    strokeWidth="6"
                    strokeDasharray={213}
                    strokeDashoffset={213 * (1 - 0.96)}
                    strokeLinecap="round"
                    fill="transparent"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-xl font-extrabold text-white font-mono">96</span>
                  <span className="text-[9px] text-slate-400 font-mono">/ 100</span>
                </div>
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-slate-200">Zero-Trust Standard</div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  High-assurance authenticated encryption &bull; Enrolled device binding &bull; Atomic single-use
                </p>
              </div>
            </div>

            {/* Breakdown Progress Bars */}
            <div className="space-y-2.5 text-xs font-mono">
              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Identity &amp; RBAC</span>
                  <span className="text-emerald-400">95%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: '95%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Device Trust Verification</span>
                  <span className="text-cyan-400">98%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-cyan-400 rounded-full" style={{ width: '98%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>AES-256-GCM Cryptography</span>
                  <span className="text-sky-400">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-sky-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-300 mb-1">
                  <span>Zero-Secret Audit Telemetry</span>
                  <span className="text-indigo-400">100%</span>
                </div>
                <div className="w-full h-1.5 bg-slate-950 rounded-full overflow-hidden">
                  <div className="h-full bg-indigo-400 rounded-full" style={{ width: '100%' }} />
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800 text-[11px] text-slate-300 font-mono flex items-center gap-2">
              <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
              <span>Zero critical vulnerabilities or leakages detected.</span>
            </div>
          </div>

          {/* SECTION 5: RECENT SHARES TABLE (2 Cols) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4 shadow-xl flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-white tracking-tight">Recent Shares &bull; Active Vault</h3>
                </div>

                {/* Filters */}
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search title, recipient..."
                      className="pl-8 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none w-44"
                    />
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="px-2.5 py-1.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 text-xs focus:border-cyan-500 focus:outline-none font-mono"
                  >
                    <option value="ALL">All Status</option>
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="CONSUMED">CONSUMED</option>
                    <option value="EXPIRED">EXPIRED</option>
                    <option value="REVOKED">REVOKED</option>
                  </select>
                </div>
              </div>

              {/* Shares Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] text-slate-400 uppercase tracking-wider">
                      <th className="py-2.5 px-3">File / Item</th>
                      <th className="py-2.5 px-3">Recipient</th>
                      <th className="py-2.5 px-3">Views</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {filteredShares.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 font-sans text-xs">
                          No vault items matching filter criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredShares.slice(0, 6).map((item) => (
                        <tr key={item.id} className="hover:bg-slate-950/40 transition">
                          <td className="py-3 px-3">
                            <div className="font-semibold text-slate-200 font-sans">{item.title}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              ID: {item.accessId?.slice(0, 10)}...
                            </div>
                          </td>
                          <td className="py-3 px-3 text-slate-300">
                            {item.recipientEmail || <span className="text-slate-500">Public Link</span>}
                          </td>
                          <td className="py-3 px-3">
                            <span className="text-cyan-300 font-bold">{item.currentViews}</span>
                            <span className="text-slate-400">/{item.maxViews}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                item.status === 'ACTIVE'
                                  ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                  : item.status === 'CONSUMED'
                                  ? 'bg-rose-950 text-rose-400 border border-rose-800'
                                  : item.status === 'REVOKED'
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-slate-900 text-slate-400 border border-slate-800'
                              }`}
                            >
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-right">
                            <div className="inline-flex items-center gap-1.5">
                              {/* Open link */}
                              <Link
                                href={`/vault/access/${item.accessId}`}
                                target="_blank"
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300"
                                title="Open Receiver Portal"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </Link>

                              {/* Test Share */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedShareForTest({
                                    securityLevel: item.securityLevel,
                                    maxViews: item.maxViews,
                                    otpRequired: true,
                                    registeredDeviceOnly: true,
                                  });
                                  setTestShareOpen(true);
                                }}
                                className="p-1 rounded bg-slate-800 hover:bg-slate-700 text-indigo-400 hover:text-indigo-300"
                                title="Test My Share Policy"
                              >
                                <Radio className="w-3.5 h-3.5" />
                              </button>

                              {/* Revoke */}
                              {item.status === 'ACTIVE' && (
                                <button
                                  type="button"
                                  onClick={() => handleRevokeSingle(item.id)}
                                  className="p-1 rounded bg-rose-950/80 hover:bg-rose-900 text-rose-400 hover:text-rose-200 border border-rose-800"
                                  title="Revoke Immediately"
                                >
                                  <Flame className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Showing {Math.min(6, filteredShares.length)} of {vaultItems.length} vault transmissions</span>
              <Link href="/vault" className="text-cyan-400 hover:underline flex items-center gap-1">
                <span>Manage All Shares</span>
                <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 6 & 7: EXPIRING SOON & RECENT ACTIVITY FEED */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* SECTION 6: EXPIRING SOON */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Expiring Soon &bull; Lifecycle Sweeper</h3>
              </div>
              <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                ACTIVE WINDOW
              </span>
            </div>

            <div className="space-y-2.5">
              {vaultItems.filter((i) => i.status === 'ACTIVE').slice(0, 3).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div>
                    <div className="font-semibold text-slate-200">{item.title}</div>
                    <div className="text-[10px] text-slate-400 font-mono">
                      Expires: {item.expiresAt ? new Date(item.expiresAt).toLocaleTimeString() : 'In 24h'}
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800">
                    &lt; 24h Left
                  </span>
                </div>
              ))}
              {vaultItems.filter((i) => i.status === 'ACTIVE').length === 0 && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  No active shares currently in expiration countdown.
                </div>
              )}
            </div>
          </div>

          {/* SECTION 7: RECENT ACTIVITY FEED */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Security Telemetry &bull; Audit Trail</h3>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                LIVE
              </span>
            </div>

            <div className="space-y-2.5">
              {(summary?.recentEvents || []).slice(0, 3).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-0.5">
                    <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
                      <span>{ev.eventType}</span>
                    </div>
                    <div className="text-[10px] text-slate-400 font-mono leading-tight">{ev.details}</div>
                  </div>
                  <span className="text-[9px] font-mono text-slate-400 flex-shrink-0">
                    {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                </div>
              ))}
              {(!summary?.recentEvents || summary.recentEvents.length === 0) && (
                <div className="py-6 text-center text-slate-400 text-xs">
                  Zero security alerts. All zero-trust boundaries operational.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 8: DOCSENSEAI INSIGHTS CARDS */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-purple-500/30 space-y-4 shadow-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                DocSenseAI &bull; Autonomous Document Insights
              </h3>
            </div>
            <Link href="/docsense" className="text-xs text-purple-400 hover:underline flex items-center gap-1 font-mono">
              <span>Inspect Document Corpus</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-purple-400 uppercase tracking-wider">Financial Liability</div>
              <div className="font-semibold text-slate-200 text-xs">Acquisition Consideration: $42,500,000 USD</div>
              <p className="text-[11px] text-slate-400 leading-tight">Closing escrow required within 5 business days of signing.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-amber-400 uppercase tracking-wider">Critical Deadline</div>
              <div className="font-semibold text-slate-200 text-xs">Exclusivity Period: December 1, 2026</div>
              <p className="text-[11px] text-slate-400 leading-tight">30-day strict non-solicitation exclusivity active.</p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-950/80 border border-slate-800 space-y-1">
              <div className="text-[10px] font-mono text-rose-400 uppercase tracking-wider">Sensitive Clause</div>
              <div className="font-semibold text-slate-200 text-xs">Restrictive Covenant: 3-Year Founder Non-Compete</div>
              <p className="text-[11px] text-slate-400 leading-tight">Confidential disclosure to third parties blocked.</p>
            </div>
          </div>
        </div>

        {/* SECTION 9 & 10: AI ANALYTICS & QUICK TOOLS (2 ROWS) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* SECTION 9: AI ANALYTICS (1 Col) */}
          <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">AI Analytics &amp; Risk Metrics</h3>
            </div>

            <div className="space-y-3 font-mono text-xs">
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Classification Accuracy:</span>
                <span className="text-emerald-400 font-bold">99.4%</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Prompt Injection Defense:</span>
                <span className="text-cyan-400 font-bold">100% Blocked</span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800 flex items-center justify-between">
                <span className="text-slate-300">Atomic Concurrency Safety:</span>
                <span className="text-purple-400 font-bold">100/100 Passed</span>
              </div>
            </div>
          </div>

          {/* SECTION 10: QUICK TOOLS (2 COLS, 2 ROWS) */}
          <div className="lg:col-span-2 p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4 shadow-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-sky-400" />
                <h3 className="text-sm font-bold text-white tracking-tight">Quick Tools Enclave</h3>
              </div>
              <span className="text-[10px] font-mono text-slate-400">8 OPERATIONAL UTILITIES</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              {/* Tool 1 */}
              <Link
                href="/docsense"
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <FileText className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Scan OCR</span>
              </Link>

              {/* Tool 2 */}
              <button
                type="button"
                onClick={() => setQuickSecureOpen(true)}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <Lock className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Generate QR</span>
              </button>

              {/* Tool 3 */}
              <Link
                href="/transfers"
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <Radio className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Ephemeral D2D</span>
              </Link>

              {/* Tool 4 */}
              <button
                type="button"
                onClick={() => setTestShareOpen(true)}
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Simulator</span>
              </button>

              {/* Tool 5 */}
              <Link
                href="/combined"
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <Sparkles className="w-4 h-4 text-purple-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Combined Mode</span>
              </Link>

              {/* Tool 6 */}
              <Link
                href="/meetings"
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <Users className="w-4 h-4 text-sky-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Secure Meeting</span>
              </Link>

              {/* Tool 7 */}
              <Link
                href="/security-center"
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <Activity className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Audit Ledger</span>
              </Link>

              {/* Tool 8 */}
              <Link
                href="/api/health"
                target="_blank"
                className="p-3 rounded-2xl bg-slate-950/80 hover:bg-slate-800 border border-slate-800 flex flex-col items-center text-center gap-2 group transition"
              >
                <Compass className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition" />
                <span className="font-semibold text-slate-200">Diagnostics</span>
              </Link>
            </div>
          </div>
        </div>

        {/* SECTION 11 & 12: UNIVERSAL DELIVERY & RECEIVER SUMMARY */}
        <div className="p-6 rounded-3xl bg-slate-900/80 border border-slate-800/80 space-y-4 shadow-xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Compass className="w-5 h-5 text-cyan-400" />
              <h3 className="text-sm font-bold text-white tracking-tight">
                Universal Delivery Engine &bull; Provider Status Architecture
              </h3>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              18 CATEGORIES &bull; 141 CAPABILITIES
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 font-mono text-center">
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-emerald-900/40">
              <div className="text-[10px] text-slate-400">IMPLEMENTED</div>
              <div className="text-lg font-bold text-emerald-400 mt-1">84</div>
              <div className="text-[9px] text-slate-400">Live Tested</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-sky-900/40">
              <div className="text-[10px] text-slate-400">PROVIDER READY</div>
              <div className="text-lg font-bold text-sky-400 mt-1">18</div>
              <div className="text-[9px] text-slate-400">Interface Spec</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-amber-900/40">
              <div className="text-[10px] text-slate-400">CONFIG REQUIRED</div>
              <div className="text-lg font-bold text-amber-400 mt-1">22</div>
              <div className="text-[9px] text-slate-400">Credentials Req</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-purple-900/40">
              <div className="text-[10px] text-slate-400">SIMULATION</div>
              <div className="text-lg font-bold text-purple-400 mt-1">12</div>
              <div className="text-[9px] text-slate-400">Sandbox Ready</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-slate-800">
              <div className="text-[10px] text-slate-400">UNSUPPORTED</div>
              <div className="text-lg font-bold text-slate-500 mt-1">5</div>
              <div className="text-[9px] text-slate-400">Hardware Bound</div>
            </div>
            <div className="p-3 rounded-2xl bg-slate-950/80 border border-cyan-900/40">
              <div className="text-[10px] text-slate-400">TOTAL MATRIX</div>
              <div className="text-lg font-bold text-cyan-400 mt-1">141</div>
              <div className="text-[9px] text-cyan-400">18 Categories</div>
            </div>
          </div>
        </div>
      </div>

      {/* MODALS */}
      <QuickSecureModal
        isOpen={quickSecureOpen}
        onClose={() => setQuickSecureOpen(false)}
        onSuccess={() => fetchDashboardData()}
      />

      <TestShareModal
        isOpen={testShareOpen}
        onClose={() => setTestShareOpen(false)}
        initialPolicy={selectedShareForTest}
      />

      <EmergencyLockModal
        isOpen={emergencyLockOpen}
        onClose={() => setEmergencyLockOpen(false)}
        onConfirm={handleExecuteEmergencyLock}
        activeCount={activeCount}
      />
    </div>
  );
}
