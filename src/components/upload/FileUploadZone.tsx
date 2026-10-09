'use client';

import React, { useState, useRef, useCallback } from 'react';
import { 
  Upload, 
  Folder, 
  File, 
  FileText, 
  Image as ImageIcon, 
  FileSpreadsheet, 
  Film, 
  Music, 
  Archive, 
  X, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Edit2, 
  Check, 
  ShieldAlert,
  Eye,
  Plus
} from 'lucide-react';

export interface UploadedFileItem {
  id: string;
  file: File;
  originalName: string;
  displayName: string;
  folderPath?: string;
  size: number;
  mimeType: string;
  extension: string;
  category: 'document' | 'spreadsheet' | 'presentation' | 'image' | 'audio' | 'video' | 'archive' | 'data' | 'other';
  previewUrl?: string;
  textSnippet?: string;
  base64Data?: string;
  sha256Hash?: string;
  status: 'READY' | 'READING' | 'PARSED' | 'UPLOADING' | 'COMPLETED' | 'ERROR';
  progress: number;
  error?: string;
}

interface FileUploadZoneProps {
  onFilesChange?: (files: UploadedFileItem[]) => void;
  onSingleFileParsed?: (file: UploadedFileItem) => void;
  singleFile?: boolean;
  maxFiles?: number;
  maxFileSizeMb?: number;
  allowedExtensions?: string[];
  title?: string;
  description?: string;
}

const DEFAULT_EXTENSIONS = [
  // Documents
  'pdf', 'doc', 'docx', 'txt', 'rtf',
  // Spreadsheets
  'csv', 'xls', 'xlsx',
  // Presentations
  'ppt', 'pptx',
  // Images
  'png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp',
  // Data
  'json', 'xml', 'md', 'log',
  // Audio & Video
  'mp3', 'wav', 'm4a', 'mp4', 'mov', 'webm',
  // Archives
  'zip'
];

export default function FileUploadZone({
  onFilesChange,
  onSingleFileParsed,
  singleFile = false,
  maxFiles = 50,
  maxFileSizeMb = 50,
  allowedExtensions = DEFAULT_EXTENSIONS,
  title = 'Drag & Drop Files or Complete Folders',
  description = 'Supports PDF, Word, Excel, Images (with Optical OCR), Audio, Video, and Zip Archives up to 50MB.',
}: FileUploadZoneProps) {
  const [files, setFiles] = useState<UploadedFileItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [previewItem, setPreviewItem] = useState<UploadedFileItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  // Determine file category
  const getFileCategory = (ext: string, mime: string): UploadedFileItem['category'] => {
    if (['pdf', 'doc', 'docx', 'txt', 'rtf'].includes(ext) || mime.includes('word') || mime.includes('pdf')) return 'document';
    if (['csv', 'xls', 'xlsx'].includes(ext) || mime.includes('sheet') || mime.includes('excel')) return 'spreadsheet';
    if (['ppt', 'pptx'].includes(ext) || mime.includes('presentation')) return 'presentation';
    if (['png', 'jpg', 'jpeg', 'webp', 'tiff', 'bmp'].includes(ext) || mime.startsWith('image/')) return 'image';
    if (['mp3', 'wav', 'm4a'].includes(ext) || mime.startsWith('audio/')) return 'audio';
    if (['mp4', 'mov', 'webm'].includes(ext) || mime.startsWith('video/')) return 'video';
    if (['zip', 'tar', 'gz', 'rar'].includes(ext) || mime.includes('zip')) return 'archive';
    if (['json', 'xml', 'md', 'log'].includes(ext)) return 'data';
    return 'other';
  };

  // Helper to format file size
  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  // Compute SHA-256 client side
  const computeClientHash = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
    } catch {
      return '';
    }
  };

  // Process File object into UploadedFileItem
  const processRawFile = async (file: File, folderPath?: string): Promise<UploadedFileItem> => {
    const ext = file.name.split('.').pop()?.toLowerCase() || '';
    const category = getFileCategory(ext, file.type);
    const id = `file-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    // Validation checks
    let error: string | undefined;
    if (file.size > maxFileSizeMb * 1024 * 1024) {
      error = `File exceeds maximum limit of ${maxFileSizeMb}MB`;
    } else if (allowedExtensions.length > 0 && !allowedExtensions.includes(ext)) {
      error = `Unsupported format (.${ext}). Allowed: ${allowedExtensions.slice(0, 8).join(', ')}...`;
    }

    let previewUrl: string | undefined;
    if (category === 'image' && !error) {
      previewUrl = URL.createObjectURL(file);
    }

    // Read base64 data for upload payload
    let base64Data: string | undefined;
    let textSnippet: string | undefined;
    let sha256Hash: string | undefined;

    try {
      sha256Hash = await computeClientHash(file);
      if (file.size < 15 * 1024 * 1024) {
        const reader = new FileReader();
        base64Data = await new Promise((resolve) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => resolve('');
          reader.readAsDataURL(file);
        });

        if (category === 'document' || category === 'data' || ext === 'csv' || ext === 'txt') {
          const textReader = new FileReader();
          textSnippet = await new Promise((resolve) => {
            textReader.onload = () => resolve((textReader.result as string).slice(0, 1500));
            textReader.onerror = () => resolve('');
            textReader.readAsText(file.slice(0, 4000));
          });
        }
      }
    } catch {
      // Non-fatal
    }

    return {
      id,
      file,
      originalName: file.name,
      displayName: file.name,
      folderPath,
      size: file.size,
      mimeType: file.type || 'application/octet-stream',
      extension: ext,
      category,
      previewUrl,
      textSnippet,
      base64Data,
      sha256Hash,
      status: error ? 'ERROR' : 'PARSED',
      progress: 100,
      error,
    };
  };

  // Add files to state
  const addFilesToState = useCallback(async (newRawFiles: { file: File; folderPath?: string }[]) => {
    const processed: UploadedFileItem[] = [];

    for (const item of newRawFiles) {
      const processedItem = await processRawFile(item.file, item.folderPath);
      processed.push(processedItem);
    }

    setFiles((prev) => {
      // Prevent duplicates by name and size
      const filtered = singleFile ? processed.slice(0, 1) : [
        ...prev,
        ...processed.filter((p) => !prev.some((exist) => exist.originalName === p.originalName && exist.size === p.size)),
      ].slice(0, maxFiles);

      if (onFilesChange) onFilesChange(filtered);
      if (filtered.length > 0 && onSingleFileParsed) {
        onSingleFileParsed(filtered[0]);
      }
      return filtered;
    });
  }, [singleFile, maxFiles, onFilesChange, onSingleFileParsed]);

  // Handle standard File Picker
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    const items = fileList.map((f) => ({ file: f }));
    addFilesToState(items);
    e.target.value = '';
  };

  // Handle Folder Picker (webkitdirectory)
  const handleFolderSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);
    const items = fileList.map((f) => {
      // webkitRelativePath contains "foldername/subfolder/file.ext"
      const pathParts = f.webkitRelativePath.split('/');
      const folderPath = pathParts.length > 1 ? pathParts.slice(0, -1).join('/') : undefined;
      return { file: f, folderPath };
    });
    addFilesToState(items);
    e.target.value = '';
  };

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items: { file: File; folderPath?: string }[] = [];

    // Traverse DataTransferItemList if directory entry supported
    if (e.dataTransfer.items) {
      const entries = Array.from(e.dataTransfer.items);
      for (const item of entries) {
        const entry = item.webkitGetAsEntry ? item.webkitGetAsEntry() : null;
        if (entry) {
          await traverseFileTree(entry, '', items);
        } else {
          const file = item.getAsFile();
          if (file) items.push({ file });
        }
      }
    } else if (e.dataTransfer.files) {
      const fileList = Array.from(e.dataTransfer.files);
      items.push(...fileList.map((f) => ({ file: f })));
    }

    if (items.length > 0) {
      addFilesToState(items);
    }
  };

  // Directory entry traversal
  const traverseFileTree = async (item: any, path: string, result: { file: File; folderPath?: string }[]) => {
    path = path || '';
    if (item.isFile) {
      const file: File = await new Promise((resolve) => item.file(resolve));
      result.push({ file, folderPath: path ? path.replace(/\/$/, '') : undefined });
    } else if (item.isDirectory) {
      const dirReader = item.createReader();
      const entries: any[] = await new Promise((resolve) => dirReader.readEntries(resolve));
      for (const child of entries) {
        await traverseFileTree(child, `${path}${item.name}/`, result);
      }
    }
  };

  // Remove single file
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const next = prev.filter((f) => f.id !== id);
      if (onFilesChange) onFilesChange(next);
      return next;
    });
  };

  // Clear all files
  const handleClearAll = () => {
    setFiles([]);
    if (onFilesChange) onFilesChange([]);
  };

  // Rename file display title
  const handleSaveRename = (id: string) => {
    if (!editName.trim()) return;
    setFiles((prev) => {
      const next = prev.map((f) => (f.id === id ? { ...f, displayName: editName.trim() } : f));
      if (onFilesChange) onFilesChange(next);
      return next;
    });
    setEditingId(null);
  };

  // Render appropriate category icon
  const renderIcon = (cat: UploadedFileItem['category']) => {
    switch (cat) {
      case 'document': return <FileText className="w-5 h-5 text-indigo-400" />;
      case 'spreadsheet': return <FileSpreadsheet className="w-5 h-5 text-emerald-400" />;
      case 'presentation': return <File className="w-5 h-5 text-amber-400" />;
      case 'image': return <ImageIcon className="w-5 h-5 text-cyan-400" />;
      case 'audio': return <Music className="w-5 h-5 text-purple-400" />;
      case 'video': return <Film className="w-5 h-5 text-rose-400" />;
      case 'archive': return <Archive className="w-5 h-5 text-sky-400" />;
      default: return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Hidden file & folder inputs */}
      <input
        ref={fileInputRef}
        type="file"
        multiple={!singleFile}
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={folderInputRef}
        type="file"
        // @ts-expect-error - webkitdirectory standard on modern browsers
        webkitdirectory=""
        directory=""
        multiple
        onChange={handleFolderSelect}
        className="hidden"
      />

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative p-8 rounded-2xl border-2 border-dashed transition flex flex-col items-center justify-center text-center space-y-4 cursor-pointer select-none ${
          isDragging
            ? 'border-cyan-400 bg-cyan-950/40 shadow-2xl shadow-cyan-500/20 scale-[1.01]'
            : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-900/40'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="w-14 h-14 rounded-2xl bg-cyan-950/80 border border-cyan-800/60 text-cyan-400 flex items-center justify-center shadow-lg shadow-cyan-950/50">
          <Upload className="w-7 h-7" />
        </div>

        <div className="space-y-1">
          <h3 className="text-sm font-bold text-white">{title}</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
            {description}
          </p>
        </div>

        {/* Buttons: Browse Files vs Browse Folders */}
        <div className="flex flex-wrap items-center justify-center gap-2 pt-2" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow"
          >
            <File className="w-3.5 h-3.5 text-cyan-400" />
            <span>Browse Files</span>
          </button>

          {!singleFile && (
            <button
              type="button"
              onClick={() => folderInputRef.current?.click()}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition flex items-center gap-1.5 shadow"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" />
              <span>Browse Folder</span>
            </button>
          )}
        </div>

        {/* Security & Malware Notice Badge */}
        <div className="pt-2 flex items-center gap-2 text-[10px] font-mono text-slate-500">
          <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
          <span>Malware Scanning: Provider not configured in environment (Skipped)</span>
          <span>&bull;</span>
          <span>Client SHA-256 Calculated</span>
        </div>
      </div>

      {/* Selected Files Manifest List */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span>
              Selected Content ({files.length} {files.length === 1 ? 'item' : 'items'}) &bull;{' '}
              {formatSize(files.reduce((acc, f) => acc + f.size, 0))}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="hover:text-cyan-400 flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Files
              </button>
              {!singleFile && (
                <button
                  type="button"
                  onClick={() => folderInputRef.current?.click()}
                  className="hover:text-amber-400 flex items-center gap-1"
                >
                  <Plus className="w-3 h-3" /> Add Folder
                </button>
              )}
              <button
                type="button"
                onClick={handleClearAll}
                className="hover:text-rose-400 text-slate-500 transition pl-2 border-l border-slate-800"
              >
                Clear All
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
            {files.map((item) => (
              <div
                key={item.id}
                className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 text-xs ${
                  item.status === 'ERROR'
                    ? 'bg-rose-950/30 border-rose-800/60'
                    : 'bg-slate-900/90 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Thumbnail / Category Icon */}
                  {item.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.previewUrl}
                      alt={item.displayName}
                      className="w-8 h-8 rounded object-cover flex-shrink-0 border border-slate-800"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded bg-slate-950 flex items-center justify-center flex-shrink-0 border border-slate-800">
                      {renderIcon(item.category)}
                    </div>
                  )}

                  <div className="min-w-0 flex-1 space-y-0.5">
                    {/* Inline Rename Editor */}
                    {editingId === item.id ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="px-2 py-0.5 rounded bg-slate-950 border border-cyan-500 text-slate-100 font-mono text-xs focus:outline-none"
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleSaveRename(item.id);
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveRename(item.id)}
                          className="p-1 text-emerald-400 hover:text-emerald-300"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingId(null)}
                          className="p-1 text-slate-400 hover:text-slate-300"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-200 truncate">{item.displayName}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditName(item.displayName);
                          }}
                          className="text-slate-500 hover:text-slate-300 p-0.5 transition"
                          title="Rename display title"
                        >
                          <Edit2 className="w-3 h-3" />
                        </button>
                      </div>
                    )}

                    <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono">
                      <span>{formatSize(item.size)}</span>
                      <span>&bull;</span>
                      <span>.{item.extension.toUpperCase()}</span>
                      {item.folderPath && (
                        <>
                          <span>&bull;</span>
                          <span className="text-amber-400">Path: /{item.folderPath}</span>
                        </>
                      )}
                      {item.sha256Hash && (
                        <>
                          <span>&bull;</span>
                          <span className="text-slate-500 truncate max-w-[120px]">SHA: {item.sha256Hash.slice(0, 10)}...</span>
                        </>
                      )}
                    </div>

                    {item.error && (
                      <div className="text-[10px] text-rose-400 flex items-center gap-1 font-mono pt-0.5">
                        <AlertCircle className="w-3 h-3 flex-shrink-0" />
                        <span>{item.error}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Right Action Icons */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                  {item.textSnippet && (
                    <button
                      type="button"
                      onClick={() => setPreviewItem(item)}
                      className="p-1 text-slate-400 hover:text-cyan-300 rounded transition"
                      title="Inspect extracted text snippet"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleRemoveFile(item.id)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition"
                    title="Remove item"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Snippet Preview Modal */}
      {previewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
          <div className="glass-panel p-6 max-w-lg w-full border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h4 className="text-sm font-bold text-white">{previewItem.displayName}</h4>
                <span className="text-[10px] font-mono text-slate-400">Client-Side Extracted Text Preview</span>
              </div>
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 max-h-60 overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-line custom-scrollbar">
              {previewItem.textSnippet || 'No text snippet available.'}
            </div>

            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => setPreviewItem(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 text-xs font-mono"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
