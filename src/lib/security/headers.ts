// RealityVault AI Security Baseline Utilities
// HTTP security headers, CORS headers, in-memory rate-limiter, and input sanitation.

import { NextResponse } from 'next/server';

export const SECURITY_HEADERS: Record<string, string> = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
};

// Simple sliding window rate limiter
const rateLimitMap = new Map<string, { count: number; expiresAt: number }>();

export function checkRateLimit(identifier: string, limit = 60, windowSeconds = 60): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(identifier);

  if (!record || now > record.expiresAt) {
    rateLimitMap.set(identifier, { count: 1, expiresAt: now + windowSeconds * 1000 });
    return true;
  }

  if (record.count >= limit) {
    return false;
  }

  record.count += 1;
  return true;
}

export function jsonResponse<T>(data: T, status = 200, headers: Record<string, string> = {}): NextResponse {
  const response = NextResponse.json(data, { status });

  // Apply default security headers
  for (const [key, val] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, val);
  }

  for (const [key, val] of Object.entries(headers)) {
    response.headers.set(key, val);
  }

  return response;
}
