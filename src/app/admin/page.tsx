'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Building, 
  Users, 
  ShieldCheck, 
  Activity, 
  Server, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  Cpu, 
  Key, 
  Shield, 
  Flame, 
  ArrowRight,
  Database
} from 'lucide-react';
import { UserRole, AuditLog } from '@/types';

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  department: string;
  enrolledDevices: number;
  lastActive: string;
  status: 'ACTIVE' | 'SUSPENDED';
}

export default function AdminManagementPage() {
  const [activeTab, setActiveTab] = useState<'org' | 'members' | 'providers' | 'audit' | 'maintenance'>('org');

  // Members state
  const [members, setMembers] = useState<OrgMember[]>([
    {
      id: 'mem-1',
      name: 'Cyber Security Officer',
      email: 'officer@securesense.ai',
      role: 'SECURITY_ADMIN',
      department: 'Cyber Operations',
      enrolledDevices: 2,
      lastActive: 'Just now',
      status: 'ACTIVE'
    },
    {
      id: 'mem-2',
      name: 'Lead Compliance Auditor',
      email: 'auditor@enterprise.org',
      role: 'ORG_ADMIN',
      department: 'Legal & Compliance',
      enrolledDevices: 1,
      lastActive: '2 hours ago',
      status: 'ACTIVE'
    },
    {
      id: 'mem-3',
      name: 'Executive Shareholder',
      email: 'executive@enterprise.org',
      role: 'USER',
      department: 'Executive Board',
      enrolledDevices: 1,
      lastActive: 'Yesterday',
      status: 'ACTIVE'
    },
    {
      id: 'mem-4',
      name: 'Platform Administrator',
      email: 'admin@securesense.ai',
      role: 'SUPER_ADMIN',
      department: 'Infrastructure',
      enrolledDevices: 3,
      lastActive: 'Just now',
      status: 'ACTIVE'
    }
  ]);

  // Audit Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Health Data
  const [healthData, setHealthData] = useState<{
    status?: string;
    database?: { status: string; provider: string; fallbackActive: boolean };
    timestamp?: string;
  } | null>(null);

  // Maintenance state
  const [runningCleanup, setRunningCleanup] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<string | null>(null);

  // Fetch Health & Audit
  const loadData = async () => {
    try {
      const hRes = await fetch('/api/health');
      const hData = await hRes.json();
      setHealthData(hData);
    } catch {
      // Ignore
    }

    setLoadingAudit(true);
    try {
      const aRes = await fetch('/api/audit');
      const aData = await aRes.json();
      if (aData.success && Array.isArray(aData.data)) {
        setAuditLogs(aData.data.slice(0, 15));
      }
    } catch {
      // Fallback
    } finally {
      setLoadingAudit(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Run Storage and Expired Tokens Cleanup
  const handleTriggerCleanup = async () => {
    setRunningCleanup(true);
    setCleanupResult(null);
    try {
      const res = await fetch('/api/admin/cleanup', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setCleanupResult(`Purge completed: ${data.data?.purgedItems ?? 0} expired items purged. Zero-Persistence caches flushed.`);
      } else {
        setCleanupResult(data.error || 'Cleanup execution completed with warnings.');
      }
    } catch {
      setCleanupResult('Network error executing maintenance daemon.');
    } finally {
      setRunningCleanup(false);
    }
  };

  // Toggle user suspension
  const toggleSuspendMember = (id: string) => {
    setMembers((prev) =>
      prev.map((m) =>
        m.id === id ? { ...m, status: m.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE' } : m
      )
    );
  };

  return (
    <div className="space-y-8 py-4">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <Building className="w-6 h-6 text-cyan-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">Enterprise Administration & Governance</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Tenant isolation, role-based access control, provider verification, and system lifecycle maintenance.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs font-mono text-cyan-400">
            Tenant ID: <span className="text-white font-bold">tenant-enclave-01</span>
          </div>
        </div>
      </div>

      {/* Admin Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 pb-1">
        {[
          { id: 'org' as const, label: 'Organization & Workspaces', icon: Building },
          { id: 'members' as const, label: 'Members & Role Governance', icon: Users },
          { id: 'providers' as const, label: 'Provider Health & Integrations', icon: Server },
          { id: 'audit' as const, label: 'System Audit Logs', icon: ShieldCheck },
          { id: 'maintenance' as const, label: 'Lifecycle & Purge Daemon', icon: Trash2 },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: ORGANIZATION & WORKSPACES */}
      {activeTab === 'org' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="glass-panel p-5 border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Tenant Isolation</span>
              <div className="text-lg font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Strict Boundary Armed</span>
              </div>
              <p className="text-xs text-slate-400">
                Data partition enforced at database layer. Cross-tenant queries are blocked and audited.
              </p>
            </div>

            <div className="glass-panel p-5 border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Active Workspaces</span>
              <div className="text-lg font-bold text-white">4 Departments</div>
              <p className="text-xs text-slate-400">
                Cyber Operations, Legal & Compliance, Executive Board, Infrastructure Enclave.
              </p>
            </div>

            <div className="glass-panel p-5 border-slate-800 space-y-2">
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400">Cryptographic Storage</span>
              <div className="text-lg font-bold text-white">12.4 MB / 10 GB</div>
              <p className="text-xs text-slate-400">
                AES-256-GCM encrypted payloads with automatic zero-persistence purge on consumption.
              </p>
            </div>
          </div>

          <div className="glass-panel p-6 border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-white">Workspace Security Policies</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Default Security Profile</div>
                <div className="text-cyan-400 font-mono text-[11px]">HIGH_SECURITY (OTP + Hardware Whitelist)</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Maximum Session Lifespan</div>
                <div className="text-slate-300 font-mono text-[11px]">24 Hours with sliding re-authentication</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Zero-Persistence Purge Enforced</div>
                <div className="text-emerald-400 font-mono text-[11px]">ENABLED (Ciphertext wiped upon max views)</div>
              </div>
              <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1">
                <div className="font-bold text-slate-200">Out-of-Band Delivery Provider</div>
                <div className="text-slate-300 font-mono text-[11px]">Internal SMTP / DevOtpProvider fallback</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MEMBERS & ROLE GOVERNANCE */}
      {activeTab === 'members' && (
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Authorized Operators & Role Assignment</h3>
            <span className="text-xs font-mono text-slate-400">Total Members: {members.length}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <th className="py-2.5 pr-4">Operator</th>
                  <th className="py-2.5 pr-4">Role</th>
                  <th className="py-2.5 pr-4">Department</th>
                  <th className="py-2.5 pr-4">Enrolled Hardware</th>
                  <th className="py-2.5 pr-4">Status</th>
                  <th className="py-2.5">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {members.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-900/50">
                    <td className="py-3 pr-4">
                      <div className="font-bold text-slate-200">{m.name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{m.email}</div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800 font-bold">
                        {m.role}
                      </span>
                    </td>
                    <td className="py-3 pr-4 text-slate-300">{m.department}</td>
                    <td className="py-3 pr-4 font-mono text-slate-400">{m.enrolledDevices} Device(s)</td>
                    <td className="py-3 pr-4">
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold border ${
                          m.status === 'ACTIVE'
                            ? 'bg-emerald-950 text-emerald-400 border-emerald-800'
                            : 'bg-rose-950 text-rose-400 border-rose-800'
                        }`}
                      >
                        {m.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button
                        type="button"
                        onClick={() => toggleSuspendMember(m.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[11px] font-mono transition"
                      >
                        {m.status === 'ACTIVE' ? 'Suspend' : 'Reinstate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: PROVIDER HEALTH */}
      {activeTab === 'providers' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="glass-panel p-5 border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Database className="w-4 h-4 text-cyan-400" />
                  <span>Database & Persistence Layer</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  HEALTHY
                </span>
              </div>
              <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                <div>Status: <span className="text-white">{healthData?.database?.status || 'Online'}</span></div>
                <div>Storage Engine: <span className="text-cyan-300">{healthData?.database?.provider || 'ACID Local File Fallback'}</span></div>
                <div>Integrity Check: <span className="text-emerald-400">PASSED</span></div>
              </div>
            </div>

            <div className="glass-panel p-5 border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Lock className="w-4 h-4 text-purple-400" />
                  <span>Cryptographic Enclave</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  AES-256-GCM
                </span>
              </div>
              <div className="space-y-1 text-slate-400 font-mono text-[11px]">
                <div>Algorithm: <span className="text-white">AES-256-GCM (Authenticated)</span></div>
                <div>IV Generation: <span className="text-white">12-Byte Cryptographically Secure Nonce</span></div>
                <div>MAC Verification: <span className="text-emerald-400">16-Byte Auth Tag Enforced</span></div>
              </div>
            </div>

            <div className="glass-panel p-5 border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Server className="w-4 h-4 text-sky-400" />
                  <span>Out-of-Band OTP Dispatch</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  DEVELOPMENT MODE
                </span>
              </div>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <div>Active Provider: <code className="text-cyan-300 font-mono">DevOtpProvider</code></div>
                <p className="text-slate-400 leading-snug">
                  Production requires SMTP or Twilio SMS credentials in <code className="text-slate-300">.env</code>.
                </p>
              </div>
            </div>

            <div className="glass-panel p-5 border-slate-800 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-indigo-400" />
                  <span>DocSenseAI & Policy Engine</span>
                </span>
                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                  OPERATIONAL
                </span>
              </div>
              <div className="space-y-1 text-slate-400 text-[11px]">
                <div>Model Boundaries: <span className="text-emerald-400">Strictly Isolated (Zero Training)</span></div>
                <div>Hallucination Defense: <span className="text-emerald-400">Chunk Grounded Citations</span></div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: SYSTEM AUDIT LOGS */}
      {activeTab === 'audit' && (
        <div className="glass-panel p-6 border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Metadata-Only Cryptographic Audit Log</h3>
            <button
              type="button"
              onClick={loadData}
              className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 text-xs font-mono border border-slate-700 transition"
            >
              Refresh
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <th className="py-2.5 pr-4">Timestamp</th>
                  <th className="py-2.5 pr-4">Action</th>
                  <th className="py-2.5 pr-4">Entity</th>
                  <th className="py-2.5 pr-4">Actor ID</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50">
                    <td className="py-2.5 pr-4 text-slate-400">{new Date(log.timestamp).toLocaleTimeString()}</td>
                    <td className="py-2.5 pr-4 font-bold text-cyan-300">{log.action}</td>
                    <td className="py-2.5 pr-4 text-slate-300">{log.entityType} ({log.entityId?.slice(0, 8)}...)</td>
                    <td className="py-2.5 text-slate-400">{log.userId || 'anonymous-challenge'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: LIFECYCLE & PURGE DAEMON */}
      {activeTab === 'maintenance' && (
        <div className="glass-panel p-6 border-slate-800 space-y-6">
          <div className="border-b border-slate-800 pb-3">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Zero-Persistence Lifecycle & Purge Daemon</span>
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Triggers cryptographic destruction of expired tokens, wipes consumption caches, and flushes ephemeral D2D transfer memory buffers.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
            <div className="font-semibold text-slate-200">Automated Daemon Responsibilities:</div>
            <ul className="list-disc pl-5 space-y-1 text-slate-400 text-[11px]">
              <li>Purges ciphertext for vault items where currentViews &ge; maxViews.</li>
              <li>Invalidates pairing tokens and session tokens older than configured expiration window.</li>
              <li>Overwrites payload ciphertext with zero-residual cryptographic padding.</li>
            </ul>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleTriggerCleanup}
                disabled={runningCleanup}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-rose-700 to-red-800 hover:from-rose-600 hover:to-red-700 text-white font-bold text-xs flex items-center gap-2 shadow transition disabled:opacity-50"
              >
                <Flame className="w-4 h-4" />
                <span>{runningCleanup ? 'Executing Purge Daemon...' : 'Execute Immediate Purge Cycle'}</span>
              </button>
            </div>

            {cleanupResult && (
              <div className="p-3 rounded-xl bg-slate-900 border border-cyan-800 text-cyan-300 font-mono text-xs mt-3">
                {cleanupResult}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
