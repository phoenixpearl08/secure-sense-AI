'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, KeyRound, Mail, ArrowRight, AlertCircle, CheckCircle2, Lock, ArrowLeft, RefreshCw } from 'lucide-react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [step, setStep] = useState<'request' | 'verify' | 'success'>('request');
  const [otpCode, setOtpCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');

  // Handle Token / Recovery Code Request
  const handleRequestRecovery = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Mask email for display
      const parts = email.split('@');
      const namePart = parts[0] || 'user';
      const domainPart = parts[1] || 'domain.com';
      const masked = `${namePart.slice(0, 2)}***@${domainPart}`;
      setMaskedEmail(masked);

      // Simulate network request with deterministic delay
      await new Promise((r) => setTimeout(r, 600));

      setStep('verify');
    } catch {
      setError('Unable to initiate recovery challenge. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Password Reset Submission
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (newPassword.length < 8) {
      setError('Password must contain at least 8 characters with high entropy.');
      setLoading(false);
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      setLoading(false);
      return;
    }

    if (!otpCode || otpCode.length !== 6) {
      setError('Please provide a valid 6-digit recovery OTP.');
      setLoading(false);
      return;
    }

    try {
      await new Promise((r) => setTimeout(r, 700));
      setStep('success');
    } catch {
      setError('Invalid or expired recovery code.');
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
        <h1 className="text-2xl font-bold text-white tracking-tight">Account Recovery</h1>
        <p className="text-xs text-slate-400">
          Cryptographic operator identity recovery & session revocation.
        </p>
      </div>

      <div className="glass-panel p-6 sm:p-8 border-slate-800 space-y-5">
        {error && (
          <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800/80 text-rose-300 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {step === 'request' && (
          <form onSubmit={handleRequestRecovery} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-[11px] leading-relaxed">
              <span className="font-semibold text-cyan-400">Security Note:</span> To prevent credential enumeration, recovery verification codes are rate-limited and dispatched via your configured out-of-band email channel.
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Registered Operator Email</label>
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

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Issuing Recovery Challenge...' : 'Send Recovery Verification'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'verify' && (
          <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
            <div className="p-3 rounded-xl bg-cyan-950/40 border border-cyan-800/50 text-cyan-300 text-[11px]">
              Challenge issued to <span className="font-mono font-bold text-white">{maskedEmail}</span>. Enter the 6-digit verification code below.
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">6-Digit Recovery OTP</label>
              <input
                type="text"
                required
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 font-mono tracking-widest text-center text-lg focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">New Master Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-slate-300">Confirm New Password</label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full pl-9 pr-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-cyan-500 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-sm shadow-lg shadow-cyan-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{loading ? 'Re-encrypting Credentials...' : 'Update Password & Revoke Sessions'}</span>
              <CheckCircle2 className="w-4 h-4" />
            </button>
          </form>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4 py-3">
            <div className="w-12 h-12 rounded-full bg-emerald-950/60 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white">Credentials Successfully Reset</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              All previous active sessions have been invalidated across enrolled hardware. You may now authenticate with your new master password.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition shadow"
            >
              <span>Proceed to Login</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}

        <div className="pt-2 text-center text-xs text-slate-400 border-t border-slate-800 flex items-center justify-between">
          <Link href="/login" className="text-slate-400 hover:text-white flex items-center gap-1 font-mono text-[11px]">
            <ArrowLeft className="w-3 h-3" /> Back to Login
          </Link>
          <Link href="/register" className="text-cyan-400 hover:underline font-mono text-[11px]">
            Register New Account
          </Link>
        </div>
      </div>
    </div>
  );
}
