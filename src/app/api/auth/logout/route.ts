import { NextRequest } from 'next/server';
import { jsonResponse } from '@/lib/security/headers';

export async function POST(req: NextRequest) {
  const response = jsonResponse({ success: true, message: 'Logged out' }, 200);
  response.cookies.delete('rv_session');
  return response;
}
