import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { 
  chunkDocumentText, 
  analyzeDocumentContent, 
  classifyDocumentSecurity,
  extractDeadlines,
  extractObligations,
  extractFinancialBreakdown,
  extractInconsistencies,
  extractMissingInformation,
  detectDocumentDomain
} from '@/services/documents/docSenseService';
import { DocumentData } from '@/types';
import { jsonResponse, checkRateLimit } from '@/lib/security/headers';
import { extractDocumentContent, calculateFileHash, measureExtractionQuality } from '@/services/documents/fileExtractor';
import { validateFileBuffer, scanFileForThreats } from '@/lib/files/fileSecurity';

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1';
    if (!checkRateLimit(`upload:${ip}`, 60, 60)) {
      return jsonResponse({ success: false, error: 'Upload rate limit exceeded. Please wait 1 minute.' }, 429);
    }

    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const { title, fileName, textContent, mimeType, fileBufferBase64, folderPath } = body;

    let resolvedText = textContent || '';
    let resolvedPageCount = 1;
    let resolvedMime = mimeType || 'application/pdf';
    let resolvedFileSize = 0;
    let resolvedHash = '';
    let isOcrApplied = false;
    let extractionWarnings: string[] | undefined;

    const safeFileName = fileName || `${(title || 'Document').replace(/\s+/g, '_')}.pdf`;

    if (fileBufferBase64) {
      // Decode base64 payload
      const base64Clean = fileBufferBase64.replace(/^data:[^;]+;base64,/, '');
      const buffer = Buffer.from(base64Clean, 'base64');

      // Security validation: magic-byte signature check & size verification
      const fileValidation = validateFileBuffer(buffer, safeFileName, resolvedMime);
      if (!fileValidation.valid) {
        return jsonResponse({ success: false, error: fileValidation.error || 'File validation failed' }, 400);
      }

      // Advanced File Threat Scanner: heuristic malware & active script smuggling analysis
      const threatScan = scanFileForThreats(buffer, safeFileName);
      if (!threatScan.clean) {
        return jsonResponse({
          success: false,
          error: `Security threat detected: ${threatScan.scanDetails}`,
          threats: threatScan.threats,
          riskScore: threatScan.riskScore,
        }, 400);
      }

      resolvedFileSize = buffer.length;
      resolvedHash = fileValidation.sha256Hash || calculateFileHash(buffer);
      resolvedMime = fileValidation.detectedMimeType || resolvedMime;

      // Extract multi-format text & OCR
      const extraction = await extractDocumentContent(buffer, safeFileName, resolvedMime);
      resolvedText = extraction.text || resolvedText || '[Extracted Content]';
      resolvedPageCount = extraction.pageCount || 1;
      resolvedMime = extraction.mimeType || resolvedMime;
      isOcrApplied = extraction.isOcrApplied;
      extractionWarnings = extraction.warnings;
    } else if (textContent) {
      resolvedFileSize = Buffer.byteLength(textContent, 'utf8');
      resolvedHash = crypto.createHash('sha256').update(textContent).digest('hex');
      resolvedPageCount = Math.max(1, Math.ceil(textContent.length / 2500));
    } else {
      return jsonResponse({ success: false, error: 'Document payload (either textContent or fileBufferBase64) is required' }, 400);
    }

    if (!title && !fileName) {
      return jsonResponse({ success: false, error: 'Document title or fileName is required' }, 400);
    }

    const docTitle = title || safeFileName;
    const docId = crypto.randomUUID();

    const chunks = chunkDocumentText(resolvedText).map((c) => ({
      ...c,
      documentId: docId,
    }));

    const insights = analyzeDocumentContent(chunks).map((i) => ({
      ...i,
      documentId: docId,
    }));

    const classification = classifyDocumentSecurity(chunks, insights);
    const deadlines = extractDeadlines(chunks);
    const obligations = extractObligations(chunks);
    const financialBreakdown = extractFinancialBreakdown(chunks);
    const inconsistencies = extractInconsistencies(chunks);
    const missingInformation = extractMissingInformation(chunks);
    const documentType = detectDocumentDomain(chunks);
    const extractionQuality = measureExtractionQuality(resolvedText);
    const allWarnings = [
      ...(extractionWarnings || []),
      ...(extractionQuality.warnings || [])
    ];

    const finalPageCount = Math.max(resolvedPageCount, ...chunks.map((c) => c.pageNumber), 1);

    const document: DocumentData = {
      id: docId,
      title: docTitle,
      fileName: safeFileName,
      fileSize: resolvedFileSize,
      mimeType: resolvedMime,
      extractedText: resolvedText,
      pageCount: finalPageCount,
      userId: user ? user.id : 'demo-user',
      chunks,
      insights,
      classification,
      deadlines,
      obligations,
      financialBreakdown,
      inconsistencies,
      missingInformation,
      createdAt: new Date().toISOString(),
      fileBufferBase64: fileBufferBase64 || undefined,
      documentType,
      extractionWarnings: allWarnings.length > 0 ? allWarnings : undefined,
      extractionQualityScore: extractionQuality.qualityScore,
    };

    await db.saveDocument(document);

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: user?.id,
      action: 'DOCUMENT_ANALYZED',
      entityType: 'Document',
      entityId: docId,
      metadata: {
        pageCount: finalPageCount,
        insightCount: insights.length,
        fileName: document.fileName,
      },
      timestamp: new Date().toISOString(),
    });

    return jsonResponse(
      {
        success: true,
        data: document,
      },
      201
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Upload failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
