// SecureSense / VaultX - Unified Binary-Safe File Transfer & Blob Utilities
// Handles Base64/DataURL conversions, binary buffer decoding, and safe file downloads without byte corruption.

export interface SecureFileAttachment {
  name: string;
  mimeType: string;
  size: number;
  hash?: string;
  data: string; // Data URL or Base64 string
  folderPath?: string;
}

export interface SecureFilePackage {
  __vaultType: 'SECURE_FILE_PACKAGE';
  version: '2.0';
  text?: string;
  file?: SecureFileAttachment;
  files?: SecureFileAttachment[];
}

/**
 * Validates if a string is a standard Data URL (RFC 2397)
 */
export function isDataUrl(str: string): boolean {
  if (typeof str !== 'string') return false;
  return str.startsWith('data:') && str.includes(';base64,');
}

/**
 * Extracts raw Base64 from a Data URL or returns raw base64 string
 */
export function extractRawBase64(str: string): string {
  if (!str) return '';
  const commaIndex = str.indexOf(',');
  if (str.startsWith('data:') && commaIndex !== -1) {
    return str.slice(commaIndex + 1);
  }
  return str;
}

/**
 * Extracts MIME type from a Data URL or provides fallback
 */
export function extractMimeType(str: string, fallback: string = 'application/octet-stream'): string {
  if (!str || !str.startsWith('data:')) return fallback;
  const match = str.match(/^data:([^;]+);/);
  return match ? match[1] : fallback;
}

/**
 * Decodes a Data URL or Base64 string into a binary Uint8Array in browser or node
 */
export function base64ToUint8Array(base64OrDataUrl: string): Uint8Array {
  const clean = extractRawBase64(base64OrDataUrl);
  if (typeof window !== 'undefined') {
    const binaryString = window.atob(clean);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  } else {
    const buffer = Buffer.from(clean, 'base64');
    return new Uint8Array(buffer.buffer, buffer.byteOffset, buffer.length);
  }
}

/**
 * Converts a Data URL or Base64 string into a binary-safe browser Blob
 */
export function dataUrlToBlob(dataUrlOrBase64: string, fallbackMime: string = 'application/octet-stream'): Blob {
  const mime = extractMimeType(dataUrlOrBase64, fallbackMime);
  const u8Array = base64ToUint8Array(dataUrlOrBase64);
  return new Blob([u8Array as BlobPart], { type: mime });
}

/**
 * Triggers safe browser download of a Blob with correct Content-Disposition
 */
export function downloadBlob(blob: Blob, fileName: string): void {
  if (typeof window === 'undefined') return;
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 2000);
}

/**
 * Downloads a file directly from a Data URL or Base64 string without data corruption
 */
export function downloadFileFromData(
  data: string,
  fileName: string,
  mimeType: string = 'application/octet-stream'
): void {
  const blob = dataUrlToBlob(data, mimeType);
  downloadBlob(blob, fileName);
}

/**
 * Formats byte size into human readable string
 */
export function formatBytes(bytes: number): string {
  if (!bytes || bytes <= 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/**
 * Determines file icon/category
 */
export function getFileTypeInfo(mimeType: string = '', fileName: string = ''): {
  category: 'pdf' | 'image' | 'word' | 'excel' | 'powerpoint' | 'archive' | 'text' | 'generic';
  label: string;
  canPreview: boolean;
} {
  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const mime = mimeType.toLowerCase();

  if (mime === 'application/pdf' || ext === 'pdf') {
    return { category: 'pdf', label: 'PDF Document', canPreview: true };
  }
  if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg', 'bmp'].includes(ext)) {
    return { category: 'image', label: 'Image', canPreview: true };
  }
  if (
    mime.includes('word') ||
    mime.includes('officedocument.wordprocessing') ||
    ['doc', 'docx', 'rtf'].includes(ext)
  ) {
    return { category: 'word', label: 'Microsoft Word Document', canPreview: false };
  }
  if (
    mime.includes('spreadsheet') ||
    mime.includes('excel') ||
    mime.includes('sheet') ||
    ['xls', 'xlsx'].includes(ext)
  ) {
    return { category: 'excel', label: 'Microsoft Excel Spreadsheet', canPreview: false };
  }
  if (
    mime.includes('presentation') ||
    mime.includes('powerpoint') ||
    ['ppt', 'pptx'].includes(ext)
  ) {
    return { category: 'powerpoint', label: 'PowerPoint Presentation', canPreview: false };
  }
  if (
    mime.includes('zip') ||
    mime.includes('compressed') ||
    mime.includes('tar') ||
    ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)
  ) {
    return { category: 'archive', label: 'Compressed Archive', canPreview: false };
  }
  if (
    mime.startsWith('text/') ||
    mime === 'application/json' ||
    ['txt', 'csv', 'json', 'md', 'xml', 'log'].includes(ext)
  ) {
    return { category: 'text', label: 'Text Document', canPreview: true };
  }

  return { category: 'generic', label: 'Encrypted Binary File', canPreview: false };
}
