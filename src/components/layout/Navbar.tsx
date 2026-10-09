'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Shield, 
  FileText, 
  Lock, 
  Sparkles, 
  Video, 
  LayoutDashboard,
  Menu,
  X,
  Send,
  Inbox,
  Building
} from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [healthStatus, setHealthStatus] = useState<'checking' | 'healthy' | 'fallback'>('checking');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data.status === 'ok') {
          setHealthStatus(data.database?.status === 'connected' ? 'healthy' : 'fallback');
        } else {
          setHealthStatus('fallback');
        }
      })
      .catch(() => setHealthStatus('fallback'));
  }, []);

  const navLinks = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'DocSenseAI', href: '/docsense', icon: FileText },
    { name: 'Send Wizard', href: '/send', icon: Send },
    { name: 'Secure Vault', href: '/vault', icon: Lock },
    { name: 'Receiver', href: '/receiver', icon: Inbox },
    { name: 'Combined', href: '/combined', icon: Sparkles },
    { name: 'Transfers', href: '/transfers', icon: Send },
    { name: 'Security Center', href: '/security-center', icon: Shield },
    { name: 'Meetings', href: '/meetings', icon: Video },
    { name: 'Admin', href: '/admin', icon: Building },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Subtitle */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-cyan-500/40 flex items-center justify-center shadow-lg shadow-cyan-500/25 group-hover:border-cyan-400 group-hover:shadow-cyan-500/40 transition">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/brand/logo.png"
                alt="Secure Sense AI Logo"
                className="w-full h-full object-contain p-0.5"
              />
            </div>
            <div>
              <div className="flex items-center">
                <span className="text-lg font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                  SECURE SENSE
                </span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300 ml-1.5 px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-700/60 shadow-sm">
                  AI
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono hidden sm:block">
                Intelligent Security & Document Intelligence
              </div>
            </div>
          </Link>

          {/* Global Search Bar (Ctrl+K) */}
          <div className="hidden lg:flex items-center relative w-64 xl:w-80">
            <input
              type="text"
              readOnly
              placeholder="Search documents, ask AI, or find anything..."
              className="w-full pl-8 pr-12 py-1.5 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 text-xs focus:outline-none cursor-pointer hover:border-slate-700 transition"
              onClick={() => {
                window.location.href = '/docsense';
              }}
            />
            <span className="absolute left-2.5 top-2.5 text-slate-400">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </span>
            <kbd className="absolute right-2.5 top-1.5 text-[9px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
              Ctrl+K
            </kbd>
          </div>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* System Online & User Profile */}
          <div className="hidden sm:flex items-center space-x-2.5">
            <Link
              href="/api/health"
              target="_blank"
              className="flex items-center space-x-2 px-2.5 py-1 rounded-full bg-slate-900 border border-slate-700/60 text-xs text-slate-300 hover:border-cyan-500/50 transition"
              title="Click to view live /api/health diagnostics"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  healthStatus === 'healthy'
                    ? 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]'
                    : healthStatus === 'fallback'
                    ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]'
                    : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="font-mono text-[10px]">
                {healthStatus === 'healthy' ? 'SYSTEM ONLINE' : 'LOCAL ACID ACTIVE'}
              </span>
            </Link>

            {/* User Profile */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-cyan-600 to-indigo-600 flex items-center justify-center text-white font-bold text-[11px] shadow">
                CA
              </div>
              <div className="text-left hidden lg:block">
                <div className="text-[11px] font-bold text-slate-200 leading-none">Cyber Auditor</div>
                <div className="text-[9px] text-cyan-400 font-mono leading-none mt-0.5">Sender &bull; Org Admin</div>
              </div>
            </div>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-slate-800 bg-slate-950 px-4 pt-2 pb-4 space-y-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center space-x-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                  isActive
                    ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-800/60'
                }`}
              >
                <Icon className="w-4 h-4 text-cyan-400" />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </div>
      )}
    </nav>
  );
}
