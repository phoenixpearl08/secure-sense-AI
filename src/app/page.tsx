'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Shield, 
  FileText, 
  Lock, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle, 
  Flame, 
  Key, 
  Cpu, 
  EyeOff, 
  Server,
  Activity
} from 'lucide-react';

export default function LandingPage() {
  const [healthData, setHealthData] = useState<{
    status?: string;
    database?: { status: string; provider: string; fallbackActive: boolean; details?: string };
    latencyMs?: number;
  } | null>(null);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setHealthData(data))
      .catch(() => null);
  }, []);

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative text-center space-y-6 pt-6">
        <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-cyan-950/60 border border-cyan-500/30 text-cyan-400 text-xs font-mono tracking-wide">
          <Sparkles className="w-3.5 h-3.5" />
          <span>CYBERSECURITY + ENTERPRISE AI INFRASTRUCTURE</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-tight">
          <span className="block text-slate-100">Understand. Secure.</span>
          <span className="block bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400 bg-clip-text text-transparent">
            Share. Destroy.
          </span>
        </h1>

        <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto font-normal">
          AI-powered document intelligence and high-assurance secure communication in one platform.
          Zero-trust verified access, adaptive policies, and authentic AES-256-GCM authenticated encryption.
        </p>

        {/* Primary Action Buttons */}
        <div className="flex flex-wrap justify-center items-center gap-4 pt-4">
          <Link
            href="/docsense"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-semibold shadow-lg shadow-cyan-500/25 transition transform hover:-translate-y-0.5"
          >
            <FileText className="w-5 h-5" />
            <span>Analyze Document</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </Link>

          <Link
            href="/vault"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-100 font-semibold border border-slate-700 shadow-md transition transform hover:-translate-y-0.5"
          >
            <Lock className="w-5 h-5 text-cyan-400" />
            <span>Secure Information</span>
          </Link>

          <Link
            href="/combined"
            className="flex items-center space-x-2 px-6 py-3.5 rounded-xl bg-indigo-950/60 hover:bg-indigo-900/80 text-indigo-300 font-semibold border border-indigo-700/50 transition transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <span>Combined Mode Demo</span>
          </Link>
        </div>

        {/* Live Connectivity Proof Box */}
        <div className="max-w-xl mx-auto pt-4">
          <div className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs font-mono flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Server className="w-4 h-4 text-cyan-400" />
              <span className="text-slate-400">System Architecture Status:</span>
            </div>
            <div className="flex items-center space-x-3">
              <span className="flex items-center space-x-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span>Backend API: Online</span>
              </span>
              <span className="text-slate-600">|</span>
              <span className="text-cyan-400">
                DB: {healthData?.database?.status === 'connected' ? 'PostgreSQL' : 'ACID Local Fallback'}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Core Principle Banner */}
      <section className="glass-panel p-6 sm:p-8 max-w-5xl mx-auto border-cyan-500/20">
        <div className="text-center space-y-2 mb-6">
          <span className="text-xs font-mono uppercase tracking-widest text-cyan-400">Core Architecture Philosophy</span>
          <h2 className="text-2xl font-bold tracking-tight text-white">
            AI Recommends. Backend Decides. Cryptography Enforces.
          </h2>
          <p className="text-sm text-slate-400 max-w-xl mx-auto">
            An LLM is never the final authorization authority. Human intent is translated into structured policies, strictly validated against typed schemas, and enforced by backend state machines and authenticated AES-256-GCM encryption.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-cyan-400 font-semibold text-sm">
              <Cpu className="w-4 h-4" />
              <span>1. Human Intent</span>
            </div>
            <p className="text-xs text-slate-400">
              Users describe security goals naturally (e.g. &ldquo;Send to manager, one-time view, OTP required&rdquo;).
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-indigo-400 font-semibold text-sm">
              <Sparkles className="w-4 h-4" />
              <span>2. AI Policy Engine</span>
            </div>
            <p className="text-xs text-slate-400">
              Compiles natural language into strict JSON schema with zero hallucinated privilege escalation.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-emerald-400 font-semibold text-sm">
              <Key className="w-4 h-4" />
              <span>3. AES-256-GCM</span>
            </div>
            <p className="text-xs text-slate-400">
              Authenticated payload encryption with 96-bit unique IVs and 128-bit authentication tags before storage.
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 space-y-2">
            <div className="flex items-center space-x-2 text-rose-400 font-semibold text-sm">
              <Flame className="w-4 h-4" />
              <span>4. Atomic Destruction</span>
            </div>
            <p className="text-xs text-slate-400">
              Single-use views are atomically consumed. Subsequent attempts receive instant access denial.
            </p>
          </div>
        </div>
      </section>

      {/* Dual Modules Spotlight */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
        {/* Module 1: RealityVault AI */}
        <div className="glass-panel p-6 sm:p-8 space-y-4 border-cyan-500/30 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">RealityVault AI</h3>
            <p className="text-sm text-slate-400">
              High-assurance secure communication channel with non-enumerable tokens, verified recipient checks, OTP challenges, and hardware fingerprint checks.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Authenticated AES-256-GCM with unique random IVs</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Atomic one-time access: Concurrency-safe reveal</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                <span>Deterministic threat engine with risk scoring</span>
              </li>
            </ul>
          </div>
          <Link
            href="/vault"
            className="inline-flex items-center justify-between px-4 py-2.5 rounded-lg bg-cyan-950/60 hover:bg-cyan-900/60 border border-cyan-700/50 text-cyan-300 text-sm font-medium transition"
          >
            <span>Open RealityVault</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Module 2: DocSenseAI */}
        <div className="glass-panel p-6 sm:p-8 space-y-4 border-indigo-500/30 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <FileText className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-bold text-white">DocSenseAI</h3>
            <p className="text-sm text-slate-400">
              Intelligent document analysis extracting contractual obligations, financial sums, critical deadlines, and answering questions with source citations.
            </p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Structured extraction: Summaries, Deadlines, Finances</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Ask Your Document: Source-grounded Q&A with citations</span>
              </li>
              <li className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                <span>Traceability: Every insight linked to exact page and chunk</span>
              </li>
            </ul>
          </div>
          <Link
            href="/docsense"
            className="inline-flex items-center justify-between px-4 py-2.5 rounded-lg bg-indigo-950/60 hover:bg-indigo-900/60 border border-indigo-700/50 text-indigo-300 text-sm font-medium transition"
          >
            <span>Launch DocSenseAI</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Combined Mode Highlight Banner */}
      <section className="glass-panel-glow p-8 max-w-5xl mx-auto rounded-2xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-left max-w-2xl">
            <div className="inline-flex items-center space-x-2 px-2.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-mono">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>THE FLAGSHIP HACKATHON WORKFLOW</span>
            </div>
            <h3 className="text-2xl font-bold text-white">Combined Mode: Analyze &rarr; Secure &rarr; Share &rarr; Destroy</h3>
            <p className="text-sm text-slate-300">
              DocSenseAI extracts confidential liabilities from contracts, feeds them directly into the AI Security Policy Engine, encrypts the document with AES-256-GCM, and destroys the link atomically upon verified receiver access.
            </p>
          </div>
          <Link
            href="/combined"
            className="flex-shrink-0 px-6 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold shadow-lg shadow-cyan-500/20 transition"
          >
            Try Flagship Combined Demo
          </Link>
        </div>
      </section>
    </div>
  );
}
