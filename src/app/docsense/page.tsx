'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Sparkles, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  DollarSign, 
  ShieldAlert, 
  BookOpen, 
  ArrowRight,
  Send,
  Lock,
  Search,
  Camera,
  Calendar,
  AlertTriangle,
  Download,
  ListFilter,
  Check,
  HelpCircle,
  RefreshCw
} from 'lucide-react';
import { DocumentData, DocumentInsight, AskAnswer, DocumentDeadline, DocumentObligation, DocumentFinancialItem } from '@/types';
import CameraScannerModal from '@/components/camera/CameraScannerModal';
import FileUploadZone, { UploadedFileItem } from '@/components/upload/FileUploadZone';

const SAMPLE_CONTRACT = `=== Page 1 ===
MASTER CLOUD & SECURITY SERVICES AGREEMENT
Effective Date: October 15, 2026
Between: Secure Sense AI Systems Inc. ("Provider") and Global Enterprise Holdings ("Client")

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
  const [selectedFileItem, setSelectedFileItem] = useState<UploadedFileItem | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [processingStage, setProcessingStage] = useState<string>('');
  const [showRawEditor, setShowRawEditor] = useState(false);
  const [activeDocument, setActiveDocument] = useState<DocumentData | null>(null);

  // Active Tab for Deep Intelligence
  const [activeTab, setActiveTab] = useState<'overview' | 'deadlines' | 'obligations' | 'financial' | 'inconsistencies' | 'qa' | 'search'>('overview');

  // Q&A State
  const [question, setQuestion] = useState('What is the payment deadline?');
  const [asking, setAsking] = useState(false);
  const [answer, setAnswer] = useState<AskAnswer | null>(null);

  // Chunk Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Optical Camera State
  const [showCameraModal, setShowCameraModal] = useState(false);

  // Export Calendar Reminder (.ics)
  const downloadCalendarReminder = (dl: DocumentDeadline) => {
    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//SecureSense DocSenseAI//EN
BEGIN:VEVENT
SUMMARY:${dl.title}
DESCRIPTION:${dl.sourceSnippet} - Extracted from ${dl.sectionRef}
STATUS:CONFIRMED
END:VEVENT
END:VCALENDAR`;
    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `${dl.title.replace(/\s+/g, '_')}.ics`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load sample contract
  const loadSample = () => {
    setSelectedFileItem(null);
    setTitle('Confidential Master Security Agreement 2026');
    setTextContent(SAMPLE_CONTRACT);
    setShowRawEditor(true);
  };

  // Handle Document Analysis
  const handleAnalyze = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textContent.trim() && !selectedFileItem?.base64Data) {
      alert('Please upload a document file or provide text content.');
      return;
    }

    setAnalyzing(true);
    setAnswer(null);
    setProcessingStage('Stage 1/4: Ingesting file payload & format validation...');

    try {
      setTimeout(() => {
        setProcessingStage('Stage 2/4: Optical OCR & text stream parsing...');
      }, 350);

      setTimeout(() => {
        setProcessingStage('Stage 3/4: Synthesizing obligation matrix & financial intelligence...');
      }, 700);

      const res = await fetch('/api/documents/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title || selectedFileItem?.displayName || 'Document',
          fileName: selectedFileItem?.originalName || `${title.replace(/\s+/g, '_')}.pdf`,
          mimeType: selectedFileItem?.mimeType || 'application/pdf',
          fileBufferBase64: selectedFileItem?.base64Data,
          textContent: textContent || undefined,
        }),
      });

      const data = await res.json();
      if (data.success && data.data) {
        setProcessingStage('Stage 4/4: Grounded indexing complete!');
        setActiveDocument(data.data);
        if (data.data.extractedText) {
          setTextContent(data.data.extractedText);
        }
      } else {
        alert(data.error || 'Document processing failed');
      }
    } catch {
      alert('Failed to connect to document analysis engine');
    } finally {
      setAnalyzing(false);
      setProcessingStage('');
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
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">DocSenseAI Intelligence Workspace</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Autonomous contract understanding, obligation matrix, financial breakdown, inconsistency detection, and grounded Q&A.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/send"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition"
          >
            <Send className="w-3.5 h-3.5 text-cyan-400" />
            <span>Send Secure File</span>
          </Link>
          <Link
            href="/combined"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Combined Pipeline Demo</span>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Document Ingestion Form (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <form onSubmit={handleAnalyze} className="glass-panel p-5 border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-400" />
                <span>Ingest Document or Folder</span>
              </h2>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setShowCameraModal(true)}
                  className="px-2 py-1 rounded bg-slate-900 hover:bg-slate-800 text-cyan-300 text-[10px] font-mono border border-cyan-700/60 transition flex items-center gap-1"
                >
                  <Camera className="w-3 h-3 text-cyan-400" />
                  <span>Camera</span>
                </button>
                <button
                  type="button"
                  onClick={loadSample}
                  className="px-2 py-1 rounded bg-indigo-950/80 hover:bg-indigo-900 text-indigo-300 text-[10px] font-mono border border-indigo-700/60 transition"
                >
                  + Sample
                </button>
              </div>
            </div>

            {/* Reusable File & Folder Upload Component */}
            <FileUploadZone
              singleFile={true}
              onSingleFileParsed={(item) => {
                setSelectedFileItem(item);
                setTitle(item.displayName);
                if (item.textSnippet) {
                  setTextContent(item.textSnippet);
                }
              }}
              onFilesChange={(items) => {
                if (items.length > 0) {
                  setSelectedFileItem(items[0]);
                  setTitle(items[0].displayName);
                  if (items[0].textSnippet) {
                    setTextContent(items[0].textSnippet);
                  }
                } else {
                  setSelectedFileItem(null);
                }
              }}
              title="Drag & Drop Document or Folder"
              description="Drop PDF, DOCX, CSV, Excel, Images (with Optical OCR), or select a folder."
            />

            <div className="space-y-1">
              <label className="text-[11px] font-semibold text-slate-300">Document Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Master Services Agreement"
                className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-indigo-500 focus:outline-none font-mono"
              />
            </div>

            {/* Toggle Raw Extracted Text Editor */}
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-semibold text-slate-300">
                  Extracted Document Text
                </label>
                <button
                  type="button"
                  onClick={() => setShowRawEditor(!showRawEditor)}
                  className="text-[10px] text-cyan-400 hover:underline font-mono"
                >
                  {showRawEditor ? 'Hide Text Editor' : 'Review / Edit Text'}
                </button>
              </div>

              {showRawEditor && (
                <textarea
                  rows={8}
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Paste or review extracted text..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono focus:border-indigo-500 focus:outline-none"
                />
              )}
            </div>

            {/* Live Processing Stage Indicator */}
            {processingStage && (
              <div className="p-2.5 rounded-xl bg-indigo-950/60 border border-indigo-800 text-indigo-300 text-xs font-mono flex items-center gap-2 animate-pulse">
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                <span>{processingStage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={analyzing || (!textContent.trim() && !selectedFileItem?.base64Data)}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-cyan-600 hover:from-indigo-500 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-indigo-500/20 transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              <span>{analyzing ? 'Analyzing with DocSenseAI...' : 'Analyze with DocSenseAI \u2192'}</span>
            </button>
          </form>
        </div>

        {/* Right Deep Intelligence Workspace (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {!activeDocument ? (
            <div className="glass-panel p-12 border-slate-800 text-center space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-indigo-950/50 border border-indigo-800/60 text-indigo-400 flex items-center justify-center mx-auto">
                <FileText className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-white">No Document Analyzed Yet</h3>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Click &ldquo;+ Sample&rdquo; on the left and hit &ldquo;Analyze with DocSenseAI&rdquo; to unlock contractual deadline extraction, obligation matrices, financial breakdown, and grounded Q&A.
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Top Document Summary & Secure Sense AI Action Bar */}
              <div className="glass-panel p-5 border-slate-800 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white">{activeDocument.title}</h2>
                      {activeDocument.documentType && (
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold uppercase border ${
                          activeDocument.documentType === 'TEXTBOOK_EDUCATIONAL'
                            ? 'bg-purple-950 text-purple-300 border-purple-800'
                            : activeDocument.documentType === 'LEGAL_CONTRACT'
                            ? 'bg-blue-950 text-blue-300 border-blue-800'
                            : activeDocument.documentType === 'FINANCIAL_INVOICE'
                            ? 'bg-emerald-950 text-emerald-300 border-emerald-800'
                            : 'bg-slate-800 text-slate-300 border-slate-700'
                        }`}>
                          {activeDocument.documentType.replace('_', ' ')}
                        </span>
                      )}
                      {activeDocument.extractionQualityScore !== undefined && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                          Text Quality: {Math.round(activeDocument.extractionQualityScore * 100)}%
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono flex items-center gap-2 mt-1">
                      <span>Pages: {activeDocument.pageCount}</span>
                      <span>&bull;</span>
                      <span>Chunks: {activeDocument.chunks.length}</span>
                      <span>&bull;</span>
                      <span>Size: {activeDocument.fileSize} bytes</span>
                    </div>
                  </div>

                  <Link
                    href={`/combined?docId=${activeDocument.id}`}
                    className="px-3.5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold flex items-center gap-1.5 shadow transition"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Secure with Secure Sense AI</span>
                  </Link>
                </div>

                {/* Extraction Warnings Banner if present */}
                {activeDocument.extractionWarnings && activeDocument.extractionWarnings.length > 0 && (
                  <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-800/60 text-amber-300 text-xs flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <span className="font-semibold text-amber-200">Extraction Quality Notice:</span>
                      <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-300/80">
                        {activeDocument.extractionWarnings.map((w, idx) => (
                          <li key={idx}>{w}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )}

                {/* DocSenseAI Security Classification Badge */}
                {activeDocument.classification && (
                  <div className="p-3.5 rounded-xl bg-slate-950 border border-cyan-500/30 space-y-1.5 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 text-amber-400" />
                        <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                          DocSenseAI Security Classification
                        </span>
                      </div>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800 font-bold">
                        {activeDocument.classification.sensitivityLevel} ({activeDocument.classification.overallRiskScore}/100)
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px] leading-relaxed">
                      {activeDocument.classification.justification}
                    </p>
                  </div>
                )}
              </div>

              {/* Deep Intelligence Tab Navigation */}
              <div className="flex items-center gap-1 overflow-x-auto border-b border-slate-800 pb-1">
                {[
                  { id: 'overview' as const, label: 'Overview & Insights', icon: FileText },
                  { id: 'deadlines' as const, label: 'Deadlines & Milestones', icon: Clock },
                  { id: 'obligations' as const, label: 'Obligation Matrix', icon: BookOpen },
                  { id: 'financial' as const, label: 'Financial Breakdown', icon: DollarSign },
                  { id: 'inconsistencies' as const, label: 'Inconsistencies & Missing', icon: AlertTriangle },
                  { id: 'qa' as const, label: 'Ask Your Document', icon: HelpCircle },
                  { id: 'search' as const, label: 'Chunk Search', icon: Search },
                ].map((t) => {
                  const Icon = t.icon;
                  const isActive = activeTab === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setActiveTab(t.id)}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium transition whitespace-nowrap ${
                        isActive
                          ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 font-bold'
                          : 'text-slate-400 hover:text-white hover:bg-slate-900/60'
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* TAB 1: OVERVIEW & INSIGHTS */}
              {activeTab === 'overview' && (
                <div className="glass-panel p-5 border-slate-800 space-y-4">
                  <div className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                    Source-Grounded Insights ({activeDocument.insights.length})
                  </div>
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
                        <p className="text-slate-400 leading-relaxed text-[11px]">{insight.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 2: DEADLINES & MILESTONES */}
              {activeTab === 'deadlines' && (
                <div className="glass-panel p-5 border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                      Critical Deadlines & Deployment Schedule
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Total: {activeDocument.deadlines?.length || 0}
                    </span>
                  </div>

                  {activeDocument.deadlines && activeDocument.deadlines.length > 0 ? (
                    <div className="space-y-3">
                      {activeDocument.deadlines.map((dl) => (
                        <div
                          key={dl.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white">{dl.title}</span>
                              <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
                                {dl.dueDate}
                              </span>
                            </div>
                            <div className="text-[11px] text-slate-400 font-mono">
                              Section: {dl.sectionRef} &bull; Snippet: &ldquo;{dl.sourceSnippet}&rdquo;
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => downloadCalendarReminder(dl)}
                            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 text-[11px] font-mono border border-slate-700 transition flex items-center gap-1.5 flex-shrink-0"
                          >
                            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                            <span>Export .ICS</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                      <Clock className="w-8 h-8 text-slate-500 mx-auto" />
                      <div className="text-sm font-semibold text-slate-300">No verified deadlines found</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        This document does not contain enforceable calendar deadlines or time-bound milestone commitments. Relative terms (such as &apos;before&apos;) without calendar references are excluded.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: OBLIGATION MATRIX */}
              {activeTab === 'obligations' && (
                <div className="glass-panel p-5 border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-indigo-400">
                      Contractual Obligation Matrix
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Items: {activeDocument.obligations?.length || 0}
                    </span>
                  </div>

                  {activeDocument.obligations && activeDocument.obligations.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-800 text-[11px] font-mono text-slate-400">
                            <th className="py-2 pr-3">ID</th>
                            <th className="py-2 pr-3">Responsible</th>
                            <th className="py-2 pr-3">Required Action</th>
                            <th className="py-2 pr-3">Penalties / Clause</th>
                            <th className="py-2">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-800/60">
                          {activeDocument.obligations.map((obl) => (
                            <tr key={obl.id} className="hover:bg-slate-900/50">
                              <td className="py-2.5 pr-3 font-mono text-cyan-400 text-[11px]">{obl.id}</td>
                              <td className="py-2.5 pr-3 font-semibold text-white">{obl.responsibleParty}</td>
                              <td className="py-2.5 pr-3 text-slate-300 text-[11px] leading-relaxed max-w-xs">{obl.action}</td>
                              <td className="py-2.5 pr-3 text-slate-400 text-[11px]">{obl.penalties || 'N/A'}</td>
                              <td className="py-2.5">
                                <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800">
                                  {obl.status}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                      <BookOpen className="w-8 h-8 text-slate-500 mx-auto" />
                      <div className="text-sm font-semibold text-slate-300">No verified obligations found</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        No enforceable contractual duties or compliance covenants were detected. Educational statements and mathematical formulations are excluded from enforceable obligation matrices.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: FINANCIAL BREAKDOWN */}
              {activeTab === 'financial' && (
                <div className="glass-panel p-5 border-slate-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-emerald-400">
                      Financial Provisions & Fee Breakdown
                    </span>
                    <span className="text-[10px] font-mono text-slate-400">
                      Stated Terms: {activeDocument.financialBreakdown?.length || 0}
                    </span>
                  </div>

                  {activeDocument.financialBreakdown && activeDocument.financialBreakdown.length > 0 ? (
                    <div className="space-y-3">
                      {activeDocument.financialBreakdown.map((fin) => (
                        <div
                          key={fin.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between text-xs"
                        >
                          <div className="space-y-1">
                            <div className="font-bold text-white flex items-center gap-2">
                              <span>{fin.item}</span>
                              <span className="font-mono text-emerald-400 text-sm font-extrabold">{fin.amount}</span>
                            </div>
                            <div className="text-[11px] text-slate-400">
                              Terms: {fin.terms} &bull; Section: {fin.sectionRef}
                            </div>
                            <div className="text-[10px] text-slate-500 italic">
                              &ldquo;{fin.snippet}&rdquo;
                            </div>
                          </div>
                          <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 flex-shrink-0">
                            STATED
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 rounded-xl bg-slate-900/60 border border-slate-800 text-center space-y-2">
                      <DollarSign className="w-8 h-8 text-slate-500 mx-auto" />
                      <div className="text-sm font-semibold text-slate-300">No verified financial information found</div>
                      <p className="text-xs text-slate-500 max-w-sm mx-auto">
                        No explicit payment schedules, fees, currencies, or invoicing terms were detected with verifiable monetary context in this document.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: INCONSISTENCIES & MISSING INFO */}
              {activeTab === 'inconsistencies' && (
                <div className="glass-panel p-5 border-slate-800 space-y-6">
                  {/* Potential Inconsistencies */}
                  <div className="space-y-3">
                    <span className="text-xs font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-rose-400" />
                      <span>Potential Contractual Inconsistencies</span>
                    </span>

                    {activeDocument.inconsistencies && activeDocument.inconsistencies.length > 0 ? (
                      activeDocument.inconsistencies.map((inc) => (
                        <div
                          key={inc.id}
                          className="p-3.5 rounded-xl bg-rose-950/30 border border-rose-800/60 space-y-2 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-rose-300">{inc.category}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800">
                              {inc.severity} SEVERITY
                            </span>
                          </div>
                          <p className="text-slate-300 text-[11px]">{inc.explanation}</p>
                          <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800 space-y-1 text-[11px] font-mono text-slate-400">
                            <div>Snippet A: {inc.citationA}</div>
                            <div>Snippet B: {inc.citationB}</div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-400 text-xs">
                        No critical inconsistencies detected in this document.
                      </div>
                    )}
                  </div>

                  {/* Missing Information Findings */}
                  <div className="space-y-3 pt-3 border-t border-slate-800">
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                      <HelpCircle className="w-4 h-4 text-amber-400" />
                      <span>Missing Compliance Information & Appendix Warnings</span>
                    </span>

                    {activeDocument.missingInformation && activeDocument.missingInformation.length > 0 ? (
                      activeDocument.missingInformation.map((mis) => (
                        <div
                          key={mis.id}
                          className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1.5 text-xs"
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-slate-200">{mis.missingField}</span>
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-400 border border-amber-800">
                              {mis.criticality}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400">
                            Expected Section: <span className="font-mono text-slate-300">{mis.expectedSection}</span>
                          </div>
                          <p className="text-[11px] text-cyan-300">{mis.remedyAction}</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-3 rounded-xl bg-slate-900 text-slate-400 text-xs">
                        All mandatory legal sections present.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB 6: GROUNDED ASK YOUR DOCUMENT */}
              {activeTab === 'qa' && (
                <div className="glass-panel p-5 border-indigo-500/30 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <Search className="w-4 h-4 text-cyan-400" />
                      <span>Ask Your Document (Zero Hallucination Engine)</span>
                    </h3>
                    <span className="text-[10px] font-mono text-cyan-300 bg-cyan-950 px-2 py-0.5 rounded border border-cyan-800">
                      Grounded Citations
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

                  {answer && (
                    <div className="p-4 rounded-xl bg-slate-900 border border-cyan-800/50 space-y-3 text-xs">
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
              )}

              {/* TAB 7: CHUNK SEARCH */}
              {activeTab === 'search' && (
                <div className="glass-panel p-5 border-slate-800 space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-slate-300">Search In-Document Chunks</label>
                    <input
                      type="text"
                      placeholder="Search keywords (e.g. liability, encryption, invoice)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-100 text-xs focus:border-cyan-500 focus:outline-none"
                    />
                  </div>

                  <div className="space-y-3">
                    {activeDocument.chunks
                      .filter((c) => !searchQuery || c.content.toLowerCase().includes(searchQuery.toLowerCase()))
                      .map((chunk) => (
                        <div key={chunk.id} className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 space-y-2 text-xs">
                          <div className="flex items-center justify-between text-[11px] font-mono text-cyan-400">
                            <span>Page {chunk.pageNumber} &bull; Chunk #{chunk.chunkIndex}</span>
                            <span className="text-slate-500">{chunk.content.length} chars</span>
                          </div>
                          <p className="text-slate-300 font-mono text-[11px] leading-relaxed whitespace-pre-line">
                            {chunk.content}
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <CameraScannerModal
        isOpen={showCameraModal}
        onClose={() => setShowCameraModal(false)}
        onCaptureCompleted={(capturedText) => {
          setTextContent(capturedText);
          setTitle('Optical Camera Capture - ' + new Date().toLocaleTimeString());
        }}
      />
    </div>
  );
}
