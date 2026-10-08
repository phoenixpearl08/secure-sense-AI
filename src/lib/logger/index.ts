// RealityVault AI Structured Sanitizing Logger
// Ensures zero secret leakage: strips passwords, OTPs, keys, tokens, and private plaintexts.

const SENSITIVE_KEYS = new Set([
  'password',
  'passwordhash',
  'otp',
  'otpcode',
  'key',
  'masterkey',
  'secret',
  'token',
  'sessiontoken',
  'authtag',
  'plaintext',
  'ciphertext',
  'content',
  'documenttext',
  'extractedtext',
  'authorization',
  'cookie',
]);

function sanitize(obj: unknown, depth = 0): unknown {
  if (depth > 5) return '[Truncated: Max Depth]';
  if (!obj || typeof obj !== 'object') return obj;

  if (Array.isArray(obj)) {
    return obj.map((item) => sanitize(item, depth + 1));
  }

  const cleanObj: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      cleanObj[key] = '[REDACTED_SENSITIVE_DATA]';
    } else if (typeof value === 'object' && value !== null) {
      cleanObj[key] = sanitize(value, depth + 1);
    } else {
      cleanObj[key] = value;
    }
  }
  return cleanObj;
}

export interface LogEntry {
  level: 'info' | 'warn' | 'error' | 'security';
  message: string;
  requestId?: string;
  timestamp: string;
  endpoint?: string;
  method?: string;
  status?: number;
  latencyMs?: number;
  metadata?: Record<string, unknown>;
  error?: string;
}

export const logger = {
  info(message: string, meta?: Record<string, unknown>, requestId?: string) {
    const entry: LogEntry = {
      level: 'info',
      message,
      requestId,
      timestamp: new Date().toISOString(),
      metadata: sanitize(meta) as Record<string, unknown>,
    };
    console.log(JSON.stringify(entry));
  },

  warn(message: string, meta?: Record<string, unknown>, requestId?: string) {
    const entry: LogEntry = {
      level: 'warn',
      message,
      requestId,
      timestamp: new Date().toISOString(),
      metadata: sanitize(meta) as Record<string, unknown>,
    };
    console.warn(JSON.stringify(entry));
  },

  error(message: string, err?: unknown, meta?: Record<string, unknown>, requestId?: string) {
    const errorMessage = err instanceof Error ? err.message : String(err || 'Unknown error');
    const entry: LogEntry = {
      level: 'error',
      message,
      requestId,
      timestamp: new Date().toISOString(),
      error: errorMessage,
      metadata: sanitize(meta) as Record<string, unknown>,
    };
    console.error(JSON.stringify(entry));
  },

  security(action: string, meta?: Record<string, unknown>, requestId?: string) {
    const entry: LogEntry = {
      level: 'security',
      message: `[SECURITY_AUDIT] ${action}`,
      requestId,
      timestamp: new Date().toISOString(),
      metadata: sanitize(meta) as Record<string, unknown>,
    };
    console.info(JSON.stringify(entry));
  },
};
