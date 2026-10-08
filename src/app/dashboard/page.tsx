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
  Sparkles
} from 'lucide-react';

export default function DashboardPage() {
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
  const [vaultItems, setVaultItems] = useState<Array<{ id: string; accessId: string; title: string; status: string; securityLevel: string; maxViews: number; currentViews: number; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [eventsRes, docsRes, vaultRes] = await Promise.all([
          fetch('/api/security/events').then((r) => r.json()),
          fetch('/api/documents/analyze').then((r) => r.json()),
          fetch('/api/vault/list').then((r) => r.json()),
        ]);

        if (eventsRes.success) setSummary(eventsRes.data);
        if (docsRes.success && Array.isArray(docsRes.data)) setDocuments(docsRes.data);
        if (vaultRes.success && Array.isArray(vaultRes.data)) setVaultItems(vaultRes.data);
      } catch (err) {
        console.error('Failed to load dashboard data', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <span>Operations Dashboard</span>
          </h1>
          <p className="text-sm text-slate-400">
            Real-time security telemetry, active vault lifecycle, and document intelligence.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docsense"
            className="px-3.5 py-2 rounded-lg bg-indigo-600/80 hover:bg-indigo-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>New Document</span>
          </Link>
          <Link
            href="/vault"
            className="px-3.5 py-2 rounded-lg bg-cyan-600/80 hover:bg-cyan-600 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Lock className="w-3.5 h-3.5" />
            <span>New Vault Item</span>
          </Link>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Documents Analyzed */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Documents Analyzed</span>
            <FileText className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{documents.length}</span>
            <span className="text-xs text-indigo-400">DocSenseAI</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Contractual insights parsed</p>
        </div>

        {/* Card 2: Active Secure Items */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Active Vault Items</span>
            <Lock className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{summary?.activeItems ?? 0}</span>
            <span className="text-xs text-slate-400">/ {summary?.totalItems ?? 0} total</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">AES-256-GCM encrypted</p>
        </div>

        {/* Card 3: Items Consumed / Destroyed */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Consumed / Destroyed</span>
            <Flame className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{summary?.consumedItems ?? 0}</span>
            <span className="text-xs text-rose-400 font-mono">1-Time Access</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Zero-leakage policy executed</p>
        </div>

        {/* Card 4: Security Threat Alerts */}
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Security Events</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white">{summary?.criticalEvents ?? 0}</span>
            <span className="text-xs text-amber-400 font-mono">{summary?.blockedAttempts ?? 0} blocked</span>
          </div>
          <p className="mt-1 text-xs text-slate-400">Risk engine active</p>
        </div>
      </div>

      {/* Two Column Section: Active Vault Items & Recent Security Telemetry */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Active Items Table */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-cyan-400" />
              <span>Active RealityVault Items</span>
            </h2>
            <Link href="/vault" className="text-xs text-cyan-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {vaultItems.length === 0 ? (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-3">
              <Lock className="w-8 h-8 text-slate-600 mx-auto" />
              <p className="text-sm text-slate-400">No vault items created yet.</p>
              <Link
                href="/vault"
                className="inline-block px-4 py-2 rounded-lg bg-cyan-600/80 text-white text-xs font-medium"
              >
                Create First Secure Item
              </Link>
            </div>
          ) : (
            <div className="space-y-3 overflow-x-auto">
              {vaultItems.slice(0, 5).map((item) => (
                <div
                  key={item.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1 min-w-0">
                    <div className="font-semibold text-slate-200 truncate">{item.title}</div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2">
                      <span className="text-cyan-400">{item.securityLevel}</span>
                      <span>&bull;</span>
                      <span>Views: {item.currentViews}/{item.maxViews}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        item.status === 'ACTIVE'
                          ? 'bg-emerald-950/70 text-emerald-400 border border-emerald-800/50'
                          : item.status === 'CONSUMED'
                          ? 'bg-rose-950/70 text-rose-400 border border-rose-800/50'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {item.status}
                    </span>

                    <Link
                      href={`/vault/access/${item.accessId}`}
                      target="_blank"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                      title="Open Access Link"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Security Audit & Threat Feed */}
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Real-Time Security Feed</span>
            </h2>
            <Link href="/security-center" className="text-xs text-amber-400 hover:underline flex items-center gap-1">
              <span>Security Center</span>
              <ArrowRight className="w-3 h-3" />
            </Link>
          </div>

          {summary?.recentEvents && summary.recentEvents.length > 0 ? (
            <div className="space-y-3">
              {summary.recentEvents.slice(0, 5).map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-slate-900/70 border border-slate-800/80 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="font-semibold text-slate-200 flex items-center gap-2">
                      <span className="font-mono text-amber-400">{ev.eventType}</span>
                      <span className="px-1.5 py-0.2 rounded text-[10px] bg-slate-800 font-mono text-slate-400">
                        {ev.riskLevel} RISK
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400">{ev.details}</div>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                    {new Date(ev.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500/80 mx-auto" />
              <p className="text-sm text-slate-300">All Security Systems Nominal</p>
              <p className="text-xs text-slate-400">No anomalous access attempts or policy violations detected.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
