'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  HelpCircle, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  BookOpen, 
  ArrowRight,
  Send,
  Lock,
  Search
} from 'lucide-react';
import { DocumentData, DocumentInsight, AskAnswer } from '@/types';

const SAMPLE_CONTRACT = `=== Page 1 ===
MASTER CLOUD & SECURITY SERVICES AGREEMENT
Effective Date: October 15, 2026
Between: RealityVault Systems Inc. ("Provider") and Global Enterprise Holdings ("Client")

Section 1.0 Executive Overview
This Master Agreement governs the deployment of Zero-Trust cryptographic infrastructure, AI policy verification engines, and automated document analysis services across Client's cloud environments.

Section 2.0 Financial Terms & Payment Schedule
Client shall pay an annual licensing fee of $120,000 USD payable net-30 days from invoice issuance. In the event of late payment exceeding 15 business days, Provider reserves the right to impose a late penalty fee of 1.5% per month on all outstanding balances.

=== Page 2 ===
Section 3.0 Critical Deadlines & Deployment Schedule
3.1 Architecture Review: Completed within 14 calendar days of Effective Date.
3.2 Payment Deadline: All initial invoices must be settled prior to November 15, 2026.
3.3 Contract Expiration: This agreement shall terminate on October 14, 2027, unless renewed in writing by both parties at least 60 days prior to expiration.

Section 4.0 Enforceable Obligations & Service Level Agreements
Provider shall guarantee 99.99% system availability for cryptographic vault verification services. Provider warrants that all customer secret payloads shall be encrypted exclusively using AES-256-GCM authenticated encryption.
Client covenants and agrees to restrict administrative key management access exclusively to certified security officers.

=== Page 3 ===
Section 5.0 Confidentiality, Trade Secrets & Liabilities
5.1 Proprietary Data: Both parties acknowledge that algorithmic model weights, source encryption keys, and internal policy schemas constitute confidential trade secrets.
5.2 Limitation of Liability: Neither party shall be liable for indirect or consequential damages. Maximum aggregate liability for breach of non-disclosure shall be capped at $500,000 USD.
5.3 Destruction Protocol: Upon contract termination, Provider must execute secure zero-residual destruction of all cached metadata within 7 calendar days.`;

export default function DocSensePage() {
  const [title, setTitle] = useState('Vendor Master Security Agreement 2026');
  const [textContent, setTextContent] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [activeDocument, setActiveDocument] = useState<DocumentData | null>(null);

  // Q&A State
  const [question, setQuestion] = useState('What is the payment deadline?');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);

  // Load sample contract
  const loadSample = () => {
    setTitle('Confidential Master Security Agreement 2026');
    setTextContent(SAMPLE_CONTRACT);
  };

  // Handle Document Analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() || !title.trim()) {
      alert('Please provide document title and content.');
      return;
    }

    setAnalyzing(true);
    setAnswer(null);
    try {
      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          fileName: `${title.replace(/\s+/g, '_')}.pdf`,
          textContent,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setActiveDocument(data.data);
      } else {
        alert(data.error || 'Document processing failed');
      }
    } catch {
      alert('Failed to connect to document analysis engine');
    } finally {
      setAnalyzing(false);
    }
  };

  // Handle Ask Your Document
  const handleAskQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeDocument || !question.trim()) return;

    setAsking(true);
    try {
      const res = await fetch('/api/documents/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          documentId: activeDocument.id,
          question,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setAnswer(data.data);
      } else {
        alert(data.error || 'Q&A engine failed');
      }
    } catch {
      alert('Error querying document intelligence');
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-indigo-400" />
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">DocSenseAI</h1>
          </div>
          <p className="text-sm text-slate-400 mt-1">
            Intelligent contractual analysis, financial extraction, obligation detection, and source-grounded Q&A.
          </p>
        </div>

        <Link
          href="/combined"
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Launch Combined Mode Demo</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Document Ingestion Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAnalyze} className="glass-panel p-6 border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Ingest Document</span>
              </h2>
              <button
                type="button"
                onClick={loadSample}
                className="px-2.5 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 text-[11px] font-mono border border-indigo-700/60 transition"
              >
                + Load Sample Contract
              </button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">Document Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-sm focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-300">
                Document Content / Contract Text (Supports multi-page delimiters)
              </label>
              <textarea
                required
                rows={12}
                value={textContent}
                onChange={(e) => setTextContent(e.target.value)}
                placeholder="Paste contract text, legal provisions, or click '+ Load Sample Contract' above..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={analyzing}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-sm shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzing ? 'Chunking & Analyzing Document...' : 'Analyze Document with DocSenseAI'}</span>
            </button>
          </form>
        </div>

        {/* Right Analysis Insights & Ask Your Document (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!activeDocument ? (
            <div className="glass-panel p-12 border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Document Analyzed Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Click &ldquo;+ Load Sample Contract&rdquo; on the left and hit &ldquo;Analyze Document with DocSenseAI&rdquo; to experience multi-page extraction, obligation detection, and source-grounded Q&A.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Document Summary Card */}
              <div className="glass-panel p-6 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{activeDocument.title}</h2>
                    <div className="text-xs text-slate-400 font-mono flex items-center gap-2">
                      <span>Pages: {activeDocument.pageCount}</span>
                      <span>&bull;</span>
                      <span>Chunks: {activeDocument.chunks.length}</span>
                      <span>&bull;</span>
                      <span>Size: {activeDocument.fileSize} bytes</span>
                    </div>
                  </div>

                  <Link
                    href={`/combined?docId=${activeDocument.id}`}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Securely Share Document</span>
                  </Link>
                </div>

                {/* Extracted Structured Insights Grid */}
                <div className="space-y-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Source-Grounded Insights ({activeDocument.insights.length})
                  </span>

                  <div className="grid grid-cols-1 gap-3">
                    {activeDocument.insights.map((insight) => (
                      <div
                        key={insight.id}
                        className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1.5 text-xs"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-200 flex items-center gap-2">
                            {insight.category === 'FINANCIAL' && <DollarSign className="w-4 h-4 text-emerald-400" />}
                            {insight.category === 'DEADLINE' && <Clock className="w-4 h-4 text-amber-400" />}
                            {insight.category === 'OBLIGATION' && <BookOpen className="w-4 h-4 text-indigo-400" />}
                            {insight.category === 'RISK' && <ShieldAlert className="w-4 h-4 text-rose-400" />}
                            {insight.category === 'SUMMARY' && <FileText className="w-4 h-4 text-cyan-400" />}
                            <span>{insight.title}</span>
                          </span>

                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                            {insight.sectionRef || `Page ${insight.pageNumber}`}
                          </span>
                        </div>
                        <p className="text-slate-400 leading-relaxed">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Ask Your Document (Source Grounded Q&A) */}
              <div className="glass-panel p-6 border-indigo-500/30 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Search className="w-4 h-4 text-cyan-400" />
                    <span>Ask Your Document (Grounded Q&A)</span>
                  </h3>
                  <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                    No Hallucinations
                  </span>
                </div>

                <form onSubmit={handleAskQuestion} className="space-y-3">
                  <div className="relative">
                    <input
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="e.g. What is the payment deadline?"
                      className="w-full pl-3.5 pr-24 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-cyan-400 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={asking}
                      className="absolute right-1.5 top-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold transition disabled:opacity-50 flex items-center gap-1"
                    >
                      <Send className="w-3 h-3" />
                      <span>{asking ? 'Querying...' : 'Ask'}</span>
                    </button>
                  </div>

                  {/* Sample prompt shortcuts */}
                  <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400">
                    <span>Quick Prompts:</span>
                    <button
                      type="button"
                      onClick={() => setQuestion('What is the payment deadline?')}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                    >
                      Payment deadline?
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestion('What are the termination penalties?')}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                    >
                      Termination penalties?
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuestion('What encryption algorithm is required?')}
                      className="px-2 py-0.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300"
                    >
                      Encryption algorithm?
                    </button>
                  </div>
                </form>

                {/* Grounded Answer Display */}
                {answer && (
                  <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/50 space-y-3 text-xs animate-fade-in">
                    <div className="flex items-center justify-between">
                      <div className="font-bold text-cyan-300 flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Source-Grounded Answer</span>
                      </div>
                      {answer.grounded && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">
                          {answer.sectionRef} &bull; {(answer.confidence * 100).toFixed(0)}% Confidence
                        </span>
                      )}
                    </div>

                    <p className="text-slate-200 leading-relaxed text-sm bg-slate-950/60 p-3 rounded-lg border border-slate-800">
                      &ldquo;{answer.answer}&rdquo;
                    </p>

                    {answer.relevantExcerpt && (
                      <div className="text-[11px] text-slate-400 border-l-2 border-cyan-500 pl-3 italic">
                        Excerpt from {answer.sectionRef}: &ldquo;{answer.relevantExcerpt}&rdquo;
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
