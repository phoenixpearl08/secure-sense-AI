import { NextRequest } from 'next/server';
import { db } from '@/lib/db';
import { jsonResponse } from '@/lib/security/headers';
import { chunkDocumentText, analyzeDocumentContent } from '@/services/documents/docSenseService';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (id) {
    const document = await db.findDocumentById(id);
    if (!document) {
      return jsonResponse({ success: false, error: 'Document not found' }, 404);
    }
    return jsonResponse({ success: true, data: document }, 200);
  }

  const documents = await db.listDocuments();
  return jsonResponse({ success: true, data: documents }, 200);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, content } = body;

    if (!content) {
      return jsonResponse({ success: false, error: 'Document content is required' }, 400);
    }

    const chunks = chunkDocumentText(content);
    const insights = analyzeDocumentContent(chunks);

    return jsonResponse(
      {
        success: true,
        data: {
          title: title || 'Untitled Document',
          chunks,
          insights,
          pageCount: Math.max(...chunks.map((c) => c.pageNumber), 1),
        },
      },
      200
    );
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Analysis failed';
    return jsonResponse({ success: false, error: msg }, 500);
  }
}
