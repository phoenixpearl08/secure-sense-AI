import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { askDocument } from '@/services/documents/docSenseService';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { documentId, question, chunks: directChunks } = body;

    if (!question || (!documentId && !directChunks)) {
      return jsonResponse({ success: false, error: 'Question and either documentId or chunks are required' }, 400);
    }

    let chunks = directChunks;
    if (!chunks && documentId) {
      const document = await db.findDocumentById(documentId);
      if (!document) {
        return jsonResponse({ success: false, error: 'Document not found' }, 404);
      }
      chunks = document.chunks;
    }

    const answer = askDocument(question, chunks);

    return jsonResponse(
      {
        success: true,
        data: answer,
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Q&A query failed';
    return jsonResponse({ success: false, error: msg }, 400);
  }
}
