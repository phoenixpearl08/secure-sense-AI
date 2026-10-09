'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Download, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Archive, 
  FileCheck, 
  File, 
  ExternalLink, 
  Check, 
  Copy, 
  ShieldCheck, 
  Eye, 
  Lock,
  Layers,
  Sparkles
} from 'lucide-react';
import { 
  SecureFileAttachment, 
  downloadFileFromData, 
  formatBytes, 
  getFileTypeInfo,
  dataUrlToBlob,
  extractRawBase64
} from '@/lib/files/filePayload';

interface DecryptedFileViewerProps {
  file?: SecureFileAttachment;
  files?: SecureFileAttachment[];
  textSecret?: string;
  downloadAllowed?: boolean;
}

export default function DecryptedFileViewer({
  file,
  files,
  textSecret,
  downloadAllowed = true,
}: DecryptedFileViewerProps) {
  // Combine single file and files array
  const allFiles = useMemo(() => {
    const list: SecureFileAttachment[] = [];
    if (files && files.length > 0) {
      list.push(...files);
    } else if (file) {
      list.push(file);
    }
    return list;
  }, [file, files]);

  const [selectedFileIndex, setSelectedFileIndex] = useState(0);
  const [copiedText, setCopiedText] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const activeFile = allFiles[selectedFileIndex] || null;

  // Generate object URL for PDF preview safely
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!activeFile || !activeFile.data) {
      setPdfBlobUrl(null);
      return;
    }

    const typeInfo = getFileTypeInfo(activeFile.mimeType, activeFile.name);
    if (typeInfo.category === 'pdf') {
      try {
        const blob = dataUrlToBlob(activeFile.data, 'application/pdf');
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        return () => {
          URL.revokeObjectURL(url);
        };
      } catch (err) {
        console.error('Failed to create PDF blob URL', err);
      }
    } else {
      setPdfBlobUrl(null);
    }
  }, [activeFile]);

  // Handle file download
  const handleDownload = (targetFile: SecureFileAttachment) => {
    if (!downloadAllowed || !targetFile.data) return;
    setDownloadingId(targetFile.name);
    try {
      downloadFileFromData(targetFile.data, targetFile.name, targetFile.mimeType);
    } catch (err) {
      console.error('Download failed', err);
    } finally {
      setTimeout(() => setDownloadingId(null), 1000);
    }
  };

  // Decode text payload for text files
  const decodedTextContent = useMemo(() => {
    if (!activeFile || !activeFile.data) return null;
    const typeInfo = getFileTypeInfo(activeFile.mimeType, activeFile.name);
    if (typeInfo.category !== 'text') return null;

    try {
      if (activeFile.data.startsWith('data:')) {
        const base64 = extractRawBase64(activeFile.data);
        return decodeURIComponent(escape(window.atob(base64)));
      } else {
        return activeFile.data;
      }
    } catch {
      return activeFile.data;
    }
  }, [activeFile]);

  return (
    <div className="space-y-6">
      {/* 1. Multiple Files Selector (Tabs) */}
      {allFiles.length > 1 && (
        <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-300 flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>Decrypted File Package ({allFiles.length} files)</span>
            </span>
            {downloadAllowed && (
              <button
                type="button"
                onClick={() => {
                  allFiles.forEach((f, idx) => {
                    setTimeout(() => handleDownload(f), idx * 400);
                  });
                }}
                className="text-[11px] text-cyan-400 hover:text-cyan-300 font-mono flex items-center gap-1 transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download All</span>
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5 pt-1">
            {allFiles.map((f, idx) => {
              const active = idx === selectedFileIndex;
              return (
                <button
                  key={`${f.name}-${idx}`}
                  type="button"
                  onClick={() => setSelectedFileIndex(idx)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono transition flex items-center gap-2 border ${
                    active
                      ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="truncate max-w-[160px]">{f.name}</span>
                  <span className="text-[10px] text-slate-500">({formatBytes(f.size)})</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. Active File Card & Preview */}
      {activeFile && (
        <div className="glass-panel p-5 sm:p-6 border-slate-800 space-y-5 rounded-2xl shadow-xl">
          {/* File Header & Metadata */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 text-cyan-400 shadow-md">
                {(() => {
                  const type = getFileTypeInfo(activeFile.mimeType, activeFile.name).category;
                  switch (type) {
                    case 'pdf': return <FileText className="w-6 h-6 text-rose-400" />;
                    case 'image': return <ImageIcon className="w-6 h-6 text-sky-400" />;
                    case 'word': return <FileText className="w-6 h-6 text-blue-400" />;
                    case 'excel': return <FileSpreadsheet className="w-6 h-6 text-emerald-400" />;
                    case 'archive': return <Archive className="w-6 h-6 text-amber-400" />;
                    default: return <File className="w-6 h-6 text-cyan-400" />;
                  }
                })()}
              </div>

              <div>
                <h3 className="text-base font-bold text-white tracking-tight break-all">
                  {activeFile.name}
                </h3>
                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-400 font-mono mt-1">
                  <span>{formatBytes(activeFile.size)}</span>
                  <span>&bull;</span>
                  <span className="text-cyan-400/90">{getFileTypeInfo(activeFile.mimeType, activeFile.name).label}</span>
                  {activeFile.hash && (
                    <>
                      <span>&bull;</span>
                      <span className="text-emerald-400 flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>SHA-256: {activeFile.hash.slice(0, 8)}...</span>
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Download Button */}
            {downloadAllowed && (
              <button
                type="button"
                onClick={() => handleDownload(activeFile)}
                disabled={downloadingId === activeFile.name}
                className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-cyan-600 hover:from-emerald-400 hover:to-cyan-500 text-white font-bold text-xs shadow-lg shadow-emerald-500/20 transition flex items-center justify-center gap-2 flex-shrink-0 disabled:opacity-50"
              >
                <Download className={`w-4 h-4 ${downloadingId === activeFile.name ? 'animate-bounce' : ''}`} />
                <span>{downloadingId === activeFile.name ? 'Saving File...' : 'Download Original File'}</span>
              </button>
            )}
          </div>

          {/* 3. Preview Sections based on file type */}
          {/* CASE A: PDF Viewer */}
          {getFileTypeInfo(activeFile.mimeType, activeFile.name).category === 'pdf' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Decrypted PDF Preview</span>
                </span>
                {pdfBlobUrl && (
                  <a
                    href={pdfBlobUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>Open Full Screen</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              {pdfBlobUrl ? (
                <div className="w-full h-[540px] rounded-2xl border border-slate-700/80 overflow-hidden bg-slate-950 shadow-2xl">
                  <iframe
                    src={pdfBlobUrl}
                    title={activeFile.name}
                    className="w-full h-full border-none"
                  />
                </div>
              ) : (
                <div className="p-8 text-center bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400">
                  Initializing secure PDF viewer...
                </div>
              )}
            </div>
          )}

          {/* CASE B: Image Viewer */}
          {getFileTypeInfo(activeFile.mimeType, activeFile.name).category === 'image' && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-cyan-400" />
                  <span>Decrypted Image View</span>
                </span>
                {activeFile.data && (
                  <a
                    href={activeFile.data}
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                  >
                    <span>View Full Size</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                )}
              </div>

              <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center max-h-[520px] overflow-hidden shadow-2xl">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeFile.data}
                  alt={activeFile.name}
                  className="max-h-[500px] max-w-full rounded-xl object-contain shadow-lg"
                />
              </div>
            </div>
          )}

          {/* CASE C: Text Document Viewer */}
          {getFileTypeInfo(activeFile.mimeType, activeFile.name).category === 'text' && decodedTextContent && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <FileText className="w-4 h-4 text-cyan-400" />
                  <span>Decrypted Document Text</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(decodedTextContent);
                    setCopiedText(true);
                    setTimeout(() => setCopiedText(false), 2000);
                  }}
                  className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
                >
                  {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedText ? 'Copied' : 'Copy Text'}</span>
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-slate-200 whitespace-pre-wrap break-words max-h-96 overflow-y-auto leading-relaxed shadow-inner">
                {decodedTextContent}
              </div>
            </div>
          )}

          {/* CASE D: Binary / Office / Archive Documents without in-browser native render */}
          {!['pdf', 'image', 'text'].includes(getFileTypeInfo(activeFile.mimeType, activeFile.name).category) && (
            <div className="p-6 rounded-2xl bg-slate-950 border border-cyan-500/20 space-y-4 text-center">
              <div className="w-14 h-14 rounded-2xl bg-cyan-950/70 border border-cyan-500/40 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
                <FileCheck className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-white">Original Document Decrypted &amp; Verified</h4>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  This {getFileTypeInfo(activeFile.mimeType, activeFile.name).label} has been decrypted with authenticated AES-256-GCM. Click below to download and open the original file with complete byte fidelity in your native software.
                </p>
              </div>

              {downloadAllowed ? (
                <button
                  type="button"
                  onClick={() => handleDownload(activeFile)}
                  disabled={downloadingId === activeFile.name}
                  className="px-6 py-3 rounded-xl bg-gradient-to-r from-cyan-500 via-sky-400 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs shadow-xl shadow-cyan-500/20 transition inline-flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  <span>Download {activeFile.name}</span>
                </button>
              ) : (
                <p className="text-xs text-amber-400 font-mono">
                  &bull; Sender policy has restricted file download.
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* 4. Accompanying Confidential Text Secret (if present) */}
      {textSecret && textSecret.trim() && textSecret !== '[Encrypted Attachment]' && (
        <div className="p-4 sm:p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-2 shadow-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" />
              <span>Decrypted Message / Note</span>
            </span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard.writeText(textSecret);
                setCopiedText(true);
                setTimeout(() => setCopiedText(false), 2000);
              }}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-mono text-[11px]"
            >
              {copiedText ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedText ? 'Copied' : 'Copy Note'}</span>
            </button>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800/80 font-mono text-xs text-emerald-300 whitespace-pre-wrap break-words max-h-60 overflow-y-auto leading-relaxed">
            {textSecret}
          </div>
        </div>
      )}
    </div>
  );
}
