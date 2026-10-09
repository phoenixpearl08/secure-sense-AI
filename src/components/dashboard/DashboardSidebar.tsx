'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  FileText,
  Shield,
  Truck,
  Inbox,
  Share2,
  ShieldAlert,
  Flame,
  Settings,
  ChevronDown,
  ChevronRight,
  Sparkles,
  Lock,
  QrCode,
  Globe,
  Mail,
  Smartphone,
  MessageSquare,
  Radio,
  HardDrive,
  Printer,
  Cloud,
  Building,
  Terminal,
  Download,
  Package,
  Compass,
  Sliders,
  Users,
  Copy
} from 'lucide-react';

interface SidebarProps {
  onQuickSendClick?: () => void;
  onEmergencyLockClick?: () => void;
  activeFilter?: string;
  onFilterChange?: (filter: string) => void;
}

export default function DashboardSidebar({
  onQuickSendClick,
  onEmergencyLockClick,
  activeFilter,
  onFilterChange,
}: SidebarProps) {
  const pathname = usePathname();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({
    delivery: true, // Collapsed by default for clean density
    docsense: false,
    security: true,
  });

  const toggleSection = (section: string) => {
    setCollapsedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <aside className="w-64 flex-shrink-0 hidden xl:flex flex-col gap-4 text-xs font-medium select-none">
      {/* Top Quick Status Pill */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-br from-slate-900/90 to-slate-950/80 border border-slate-800/80 shadow-lg space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400">Security Enclave</span>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            ARMED
          </span>
        </div>
        <div className="text-slate-300 font-bold text-sm">Command Center</div>
        <p className="text-[11px] text-slate-400 leading-snug">
          AES-256-GCM &bull; Zero-Trust Device Binding &bull; Grounded Q&A
        </p>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-1 overflow-y-auto max-h-[calc(100vh-260px)] pr-1 custom-scrollbar">
        {/* HOME */}
        <div className="space-y-0.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">Home</div>
          <Link
            href="/dashboard"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              pathname === '/dashboard'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <LayoutDashboard className="w-4 h-4 text-cyan-400" />
            <span>Dashboard</span>
          </Link>
        </div>

        {/* SEND */}
        <div className="pt-2 space-y-0.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">Send Operations</div>
          <Link
            href="/send"
            className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/60 transition"
          >
            <div className="flex items-center gap-2.5">
              <Send className="w-4 h-4 text-sky-400" />
              <span>Send Secure File (Wizard)</span>
            </div>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-sky-950 text-sky-300 border border-sky-800">
              +NEW
            </span>
          </Link>
          <Link
            href="/vault"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/60 transition"
          >
            <Lock className="w-4 h-4 text-cyan-400" />
            <span>Create Secret Vault</span>
          </Link>
          <Link
            href="/transfers"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/60 transition"
          >
            <Radio className="w-4 h-4 text-indigo-400" />
            <span>Ephemeral D2D Transfer</span>
          </Link>
        </div>

        {/* RECEIVE OPERATIONS */}
        <div className="pt-2 space-y-0.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">Receive Operations</div>
          <Link
            href="/receiver"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              pathname === '/receiver'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 font-semibold'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Inbox className="w-4 h-4 text-cyan-400" />
            <span>Receiver Portal & Inbox</span>
          </Link>
        </div>

        {/* DOCSENSEAI */}
        <div className="pt-2 space-y-0.5">
          <div className="flex items-center justify-between px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>DocSenseAI</span>
            <button type="button" onClick={() => toggleSection('docsense')} className="hover:text-slate-300">
              {collapsedSections.docsense ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          {!collapsedSections.docsense && (
            <div className="space-y-0.5 pl-2 border-l border-slate-800 ml-3">
              <Link
                href="/docsense"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/50 transition text-[11px]"
              >
                <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                <span>Analyze & OCR</span>
              </Link>
              <Link
                href="/docsense"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/50 transition text-[11px]"
              >
                <FileText className="w-3.5 h-3.5 text-purple-400" />
                <span>Ask Document (Grounded)</span>
              </Link>
              <Link
                href="/combined"
                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-slate-900/50 transition text-[11px]"
              >
                <Sliders className="w-3.5 h-3.5 text-purple-400" />
                <span>Combined Mode Pipeline</span>
              </Link>
            </div>
          )}
        </div>

        {/* UNIVERSAL DELIVERY (18 Categories) */}
        <div className="pt-2 space-y-0.5">
          <div className="flex items-center justify-between px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">
            <span>Universal Delivery (18)</span>
            <button type="button" onClick={() => toggleSection('delivery')} className="hover:text-slate-300">
              {collapsedSections.delivery ? <ChevronRight className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
            </button>
          </div>
          {!collapsedSections.delivery && (
            <div className="space-y-0.5 pl-2 border-l border-slate-800 ml-3 text-[11px]">
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Globe className="w-3 h-3 text-cyan-400" /> 1. Internet / Web Links
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <QrCode className="w-3 h-3 text-cyan-400" /> 2. QR & 2D Barcodes
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Mail className="w-3 h-3 text-sky-400" /> 3. Email Out-of-Band
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Smartphone className="w-3 h-3 text-slate-500" /> 4. Mobile / SMS (Config)
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <MessageSquare className="w-3 h-3 text-slate-500" /> 5. Messaging Webhooks
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Radio className="w-3 h-3 text-slate-500" /> 6. Nearby / NFC (Sim)
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Radio className="w-3 h-3 text-indigo-400" /> 7. Device-to-Device (D2D)
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <HardDrive className="w-3 h-3 text-emerald-400" /> 8. Offline & Physical
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Printer className="w-3 h-3 text-amber-400" /> 9. Printed Access Sheets
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Cloud className="w-3 h-3 text-slate-500" /> 10. Cloud Storage (Config)
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Building className="w-3 h-3 text-sky-400" /> 11. Enterprise Tenant
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Terminal className="w-3 h-3 text-cyan-400" /> 12. Developer API
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Download className="w-3 h-3 text-emerald-400" /> 13. Controlled Download
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Package className="w-3 h-3 text-indigo-400" /> 14. Secure Package
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Compass className="w-3 h-3 text-sky-400" /> 15. Web Portals
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Shield className="w-3 h-3 text-purple-400" /> 16. Advanced Policy
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Users className="w-3 h-3 text-indigo-400" /> 17. Collaboration Rooms
              </div>
              <div className="flex items-center gap-2 px-2.5 py-1 text-slate-400 font-mono text-[10px]">
                <Copy className="w-3 h-3 text-slate-400" /> 18. Manual & External
              </div>
            </div>
          )}
        </div>

        {/* SECURITY & AUDIT */}
        <div className="pt-2 space-y-0.5">
          <div className="px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-400">Security & Governance</div>
          <Link
            href="/security-center"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              pathname === '/security-center'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Shield className="w-4 h-4 text-emerald-400" />
            <span>Security Center</span>
          </Link>
          <Link
            href="/meetings"
            className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-300 hover:text-white hover:bg-slate-900/60 transition"
          >
            <Users className="w-4 h-4 text-sky-400" />
            <span>Secure Meetings</span>
          </Link>
          <Link
            href="/admin"
            className={`flex items-center gap-2.5 px-3 py-2 rounded-xl transition ${
              pathname === '/admin'
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900/60'
            }`}
          >
            <Building className="w-4 h-4 text-purple-400" />
            <span>Enterprise Admin</span>
          </Link>
        </div>

        {/* EMERGENCY ACTION */}
        <div className="pt-3">
          <button
            type="button"
            onClick={onEmergencyLockClick}
            className="w-full flex items-center justify-between p-3 rounded-2xl bg-gradient-to-r from-rose-950/80 to-red-900/40 border border-rose-800/80 hover:border-rose-500 text-rose-300 hover:text-rose-100 transition shadow-lg shadow-rose-950/30 group"
          >
            <div className="flex items-center gap-2 font-bold text-xs">
              <Flame className="w-4 h-4 text-rose-500 group-hover:animate-pulse" />
              <span>EMERGENCY LOCK</span>
            </div>
            <span className="text-[10px] font-mono bg-rose-900/80 text-rose-200 px-2 py-0.5 rounded border border-rose-700">
              REVOKE
            </span>
          </button>
        </div>
      </div>
    </aside>
  );
}
