import { env } from '../../config/env';

export class UnsafeUrlError extends Error {
  public statusCode = 400;
  constructor(message: string) {
    super(`SSRF Protection: ${message}`);
    this.name = 'UnsafeUrlError';
  }
}

export class FetchTimeoutError extends Error {
  public statusCode = 504;
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);
    this.name = 'FetchTimeoutError';
  }
}

export class ResponseTooLargeError extends Error {
  public statusCode = 413;
  constructor(maxBytes: number) {
    super(`Response exceeded maximum allowed size of ${maxBytes} bytes`);
    this.name = 'ResponseTooLargeError';
  }
}

// IP range patterns for SSRF prevention
const PRIVATE_IP_PATTERNS = [
  /^127\./,
  /^10\./,
  /^192\.168\./,
  /^172\.(1[6-9]|2[0-9]|3[0-1])\./,
  /^169\.254\./,
  /^0\./,
  /^::1$/,
  /^fc00:/,
  /^fe80:/,
];

/**
 * Validates a target URL against SSRF rules.
 */
export function validateUrlForSsrf(rawUrl: string): URL {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new UnsafeUrlError(`Invalid URL string: "${rawUrl}"`);
  }

  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    throw new UnsafeUrlError(`Unsupported protocol "${parsed.protocol}". Only HTTP and HTTPS are permitted.`);
  }

  const hostname = parsed.hostname.toLowerCase();

  // Allow localhost only in test environment if explicitly testing local mock servers
  const isTest = env.NODE_ENV === 'test';
  if ((hostname === 'localhost' || hostname === '127.0.0.1') && !isTest) {
    throw new UnsafeUrlError('Access to localhost or loopback addresses is prohibited.');
  }

  if (!isTest) {
    for (const pattern of PRIVATE_IP_PATTERNS) {
      if (pattern.test(hostname)) {
        throw new UnsafeUrlError(`Access to private IP range (${hostname}) is prohibited.`);
      }
    }
  }

  return parsed;
}

export interface SafeFetchOptions {
  timeoutMs?: number;
  maxSizeBytes?: number;
  headers?: Record<string, string>;
}

/**
 * Executes a protected HTTP fetch with timeout, size limit, and SSRF prevention.
 */
export async function safeFetchText(
  rawUrl: string,
  options: SafeFetchOptions = {}
): Promise<{ text: string; status: number; contentType: string }> {
  const parsedUrl = validateUrlForSsrf(rawUrl);
  const timeoutMs = options.timeoutMs ?? 10000;
  const maxSizeBytes = options.maxSizeBytes ?? 1024 * 1024; // 1MB default

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Hoollow-Industry-Monitor/1.0 (+https://hoollow.ai)',
        Accept: 'application/rss+xml, application/atom+xml, application/json, text/xml, */*',
        ...(options.headers || {}),
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
    }

    const contentType = res.headers.get('content-type') || '';
    const contentLength = res.headers.get('content-length');
    if (contentLength && parseInt(contentLength, 10) > maxSizeBytes) {
      throw new ResponseTooLargeError(maxSizeBytes);
    }

    // Read stream with size limit
    const reader = res.body?.getReader();
    if (!reader) {
      const text = await res.text();
      if (text.length > maxSizeBytes) {
        throw new ResponseTooLargeError(maxSizeBytes);
      }
      return { text, status: res.status, contentType };
    }

    const chunks: Uint8Array[] = [];
    let receivedBytes = 0;

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      if (value) {
        receivedBytes += value.length;
        if (receivedBytes > maxSizeBytes) {
          reader.cancel();
          throw new ResponseTooLargeError(maxSizeBytes);
        }
        chunks.push(value);
      }
    }

    const totalBuffer = new Uint8Array(receivedBytes);
    let offset = 0;
    for (const chunk of chunks) {
      totalBuffer.set(chunk, offset);
      offset += chunk.length;
    }

    const text = new TextDecoder('utf-8').decode(totalBuffer);
    return { text, status: res.status, contentType };
  } catch (err: any) {
    if (err.name === 'AbortError') {
      throw new FetchTimeoutError(timeoutMs);
    }
    throw err;
  } finally {
    clearTimeout(timer);
  }
}
