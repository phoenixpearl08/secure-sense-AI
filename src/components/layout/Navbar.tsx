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
  X
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
    { name: 'RealityVault', href: '/vault', icon: Lock },
    { name: 'Combined Mode', href: '/combined', icon: Sparkles },
    { name: 'Security Center', href: '/security-center', icon: Shield },
    { name: 'Meetings', href: '/meetings', icon: Video },
  ];

  return (
    <nav className="sticky top-0 z-50 border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-bold tracking-tight bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
                REALITYVAULT
              </span>
              <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400/80 ml-1.5 px-1.5 py-0.5 rounded bg-cyan-950/50 border border-cyan-800/40">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-2">
            {navLinks.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition ${
                    isActive
                      ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>

          {/* System Health Badge */}
          <div className="hidden sm:flex items-center space-x-3">
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
              <span className="font-mono text-[11px]">
                {healthStatus === 'healthy' ? 'POSTGRES ACTIVE' : 'LOCAL ACID ADAPTER'}
              </span>
            </Link>
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
