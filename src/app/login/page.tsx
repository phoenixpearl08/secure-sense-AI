'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Lock, Mail, ArrowRight, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const deviceId = typeof window !== 'undefined' ? localStorage.getItem('rv_device_id') || 'dev-browser' : 'dev-browser';

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          deviceId,
          deviceName: navigator.userAgent.includes('Windows') ? 'Windows Workstation' : 'Desktop Browser',
        }),
      });

      const data = await res.json();
      if (data.success) {
        router.push('/dashboard');
      } else {
        setError(data.error || 'Authentication failed');
      }
    } catch {
      setError('Network error contacting authentication server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto py-12 space-y-6">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 rounded-2xl bg-slate-900 border border-cyan-500/40 p-1 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/20">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/brand/logo.png"
            alt="Secure Sense AI"
            className="w-full h-full object-contain"
          />
        </div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Identity Authentication</h1>
        <p className="text-xs text-slate-400">
          Zero-Trust credential verification and hardware enrollment.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4 text-xs">
          <div className="space-y-1.5">
            <label className="font-semibold text-slate-300">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@securesense.ai"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300">Master Password</label>
              <Link href="/forgot-password" className="text-[11px] text-cyan-400 hover:underline font-mono">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Verifying Credentials...' : 'Authenticate & Enter Vault'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800">
          <span>Need an account? </span>
          <Link href="/register" className="text-cyan-400 hover:underline font-semibold">
            Register Operator
          </Link>
        </div>
      </div>
    </div>
  );
}
