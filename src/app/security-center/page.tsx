'use client';

import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Smartphone, 
  RefreshCw,
  Terminal,
  Clock,
  Eye,
  Flame
} from 'lucide-react';
import { SecurityEvent, AuditLog, AccessAttempt } from '@/types';

export default function SecurityCenterPage() {
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<{
    activeItems: number;
    consumedItems: number;
    revokedItems: number;
    totalItems: number;
    blockedAttempts: number;
    totalAttempts: number;
    criticalEvents: number;
    recentEvents: SecurityEvent[];
    recentAuditLogs: AuditLog[];
  } | null>(null);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  const fetchSecurityData = async () => {
    try {
      const [eventsRes, auditRes] = await Promise.all([
        fetch('/api/security/events').then((r) => r.json()),
        fetch('/api/audit').then((r) => r.json()),
      ]);

      if (eventsRes.success) setSummary(eventsRes.data);
      if (auditRes.success && Array.isArray(auditRes.data)) setAuditLogs(auditRes.data);
    } catch (err) {
      console.error('Failed to load security telemetry', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let ignore = false;
    async function load() {
      try {
        const [eventsRes, auditRes] = await Promise.all([
          fetch('/api/security/events').then((r) => r.json()),
          fetch('/api/audit').then((r) => r.json()),
        ]);

        if (!ignore) {
          if (eventsRes.success) setSummary(eventsRes.data);
          if (auditRes.success && Array.isArray(auditRes.data)) setAuditLogs(auditRes.data);
        }
      } catch (err) {
        console.error('Failed to load security telemetry', err);
      } finally {
        if (!ignore) setLoading(false);
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Shield className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Security Center & Audit Log</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Real-time threat monitoring, access anomaly detection, and zero-residual audit trail.
          </p>
        </div>

        <button
          onClick={fetchSecurityData}
          className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-semibold text-slate-300 flex items-center gap-1.5 transition"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Threat Metrics Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Total Access Invocations</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{summary?.totalAttempts ?? 0}</div>
          <p className="mt-1 text-xs text-slate-400">Verified identity checks</p>
        </div>

        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Blocked / Intercepted</span>
            <ShieldAlert className="w-4 h-4 text-rose-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-rose-400">{summary?.blockedAttempts ?? 0}</div>
          <p className="mt-1 text-xs text-slate-400">Invalid OTP, device or recipient</p>
        </div>

        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Destroyed (Consumed)</span>
            <Flame className="w-4 h-4 text-amber-400" />
          </div>
          <div className="mt-3 text-3xl font-extrabold text-white">{summary?.consumedItems ?? 0}</div>
          <p className="mt-1 text-xs text-slate-400">One-time access completed</p>
        </div>

        <div className="glass-panel p-5 border-slate-800">
          <div className="flex items-center justify-between text-slate-400">
            <span className="text-xs font-medium uppercase tracking-wider">Threat Engine Status</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-3 text-xl font-bold text-emerald-400 font-mono">NOMINAL</div>
          <p className="mt-1 text-xs text-slate-400">Deterministic scoring active</p>
        </div>
      </div>

      {/* Two Column Grid: Security Alerts & Audit Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Security Events Feed (5 cols) */}
        <div className="lg:col-span-5 glass-panel p-6 border-slate-800 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Security Anomaly Events</span>
          </h2>

          {summary?.recentEvents && summary.recentEvents.length > 0 ? (
            <div className="space-y-3">
              {summary.recentEvents.map((ev) => (
                <div
                  key={ev.id}
                  className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-amber-400">{ev.eventType}</span>
                    <span
                      className={`font-mono text-[10px] px-2 py-0.5 rounded ${
                        ev.riskLevel === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : ev.riskLevel === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {ev.riskLevel}
                    </span>
                  </div>
                  <p className="text-slate-300">{ev.details}</p>
                  <div className="text-[10px] font-mono text-slate-400">
                    Timestamp: {new Date(ev.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center rounded-xl bg-slate-900/40 border border-dashed border-slate-800 space-y-2">
              <ShieldCheck className="w-8 h-8 text-emerald-500/80 mx-auto" />
              <p className="text-xs text-slate-300">No anomalous threat events recorded</p>
            </div>
          )}
        </div>

        {/* Right Column: Zero-Residual Audit Log Table (7 cols) */}
        <div className="lg:col-span-7 glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Terminal className="w-4 h-4 text-cyan-400" />
              <span>Immutable Audit Trail (Zero Secrets Leaked)</span>
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              {auditLogs.length} Records
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/90 text-slate-400 border-b border-slate-800 font-mono text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Action</th>
                  <th className="py-2.5 px-3">Entity</th>
                  <th className="py-2.5 px-3">Time</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-slate-400">
                      No audit events recorded yet.
                    </td>
                  </tr>
                ) : (
                  auditLogs.slice(0, 15).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-900/40 transition">
                      <td className="py-2 px-3 text-cyan-300 font-semibold">{log.action}</td>
                      <td className="py-2 px-3 text-slate-400">{log.entityType}</td>
                      <td className="py-2 px-3 text-slate-400">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </td>
                      <td className="py-2 px-3">
                        <span className="text-emerald-400">RECORDED</span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
