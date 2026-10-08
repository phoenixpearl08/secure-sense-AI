import { NextRequest } from 'next/server';
import crypto from 'crypto';
import { db } from '@/lib/db';
import { authService } from '@/services/auth/authService';
import { chunkDocumentText, analyzeDocumentContent, classifyDocumentSecurity } from '@/services/documents/docSenseService';
import { DocumentData } from '@/types';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const token = req.cookies.get('rv_session')?.value;
    const user = await authService.getCurrentUser(token);

    const body = await req.json();
    const { title, fileName, textContent, mimeType } = body;

    if (!textContent || !title) {
      return jsonResponse({ success: false, error: 'Document title and text content are required' }, 400);
    }

    const docId = crypto.randomUUID();
    const chunks = chunkDocumentText(textContent).map((c) => ({
      ...c,
      documentId: docId,
    }));

    const insights = analyzeDocumentContent(chunks).map((i) => ({
      ...i,
      documentId: docId,
    }));

    const classification = classifyDocumentSecurity(chunks, insights);
    const pageCount = Math.max(...chunks.map((c) => c.pageNumber), 1);

    const document: DocumentData = {
      id: docId,
      title,
      fileName: fileName || `${title.replace(/\s+/g, '_')}.pdf`,
      fileSize: Buffer.byteLength(textContent, 'utf8'),
      mimeType: mimeType || 'application/pdf',
      extractedText: textContent,
      pageCount,
      userId: user ? user.id : 'demo-user',
      chunks,
      insights,
      classification,
      createdAt: new Date().toISOString(),
    };

    await db.saveDocument(document);

    await db.recordAuditLog({
      id: crypto.randomUUID(),
      userId: user?.id,
      action: 'DOCUMENT_ANALYZED',
      entityType: 'Document',
      entityId: docId,
      metadata: {
        pageCount,
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
