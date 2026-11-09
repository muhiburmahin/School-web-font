const CSRF_HEADER_NAME = 'x-csrf-token';
const MUTATING_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

export function getBrowserCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
  return match ? decodeURIComponent(match[1]) : null;
}

export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    const base = process.env.NEXT_PUBLIC_API_URL || process.env.NEXT_PUBLIC_API_BASE_URL || '';
    // '/api/v1' means same-origin; callers already pass full /api/v1/... paths.
    return base.replace(/\/$/, '') === '/api/v1' ? '' : base;
  }
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:5000'
  );
}

export class ApiClientError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'ApiClientError';
    this.status = status;
    this.data = data;
  }
}

export async function apiFetch<T = any>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const method = (options.method || 'GET').toUpperCase();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  // Handle client-side CSRF token attachment
  if (MUTATING_METHODS.has(method)) {
    const csrfToken =
      getBrowserCookie('mrm_csrf') ||
      getBrowserCookie('csrf') ||
      getBrowserCookie(process.env.NEXT_PUBLIC_CSRF_COOKIE_NAME || '');

    if (csrfToken && !headers.has(CSRF_HEADER_NAME)) {
      headers.set(CSRF_HEADER_NAME, csrfToken);
    }
  }

  // Handle SSR cookie & host forwarding if executed on server
  if (typeof window === 'undefined') {
    try {
      const { headers: nextHeaders, cookies: nextCookies } = await import('next/headers');
      const h = await nextHeaders();
      const c = await nextCookies();

      if (!headers.has('Cookie')) {
        const cookieStr = c.toString();
        if (cookieStr) headers.set('Cookie', cookieStr);
      }

      const host = h.get('x-forwarded-host') || h.get('host');
      if (host && !headers.has('x-forwarded-host')) {
        headers.set('x-forwarded-host', host);
      }
    } catch {
      // Not in a Next.js server request context (e.g. static generation)
    }
  }

  const baseUrl = getApiBaseUrl();
  const normalizedPath = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = baseUrl
    ? `${baseUrl.replace(/\/$/, '')}${normalizedPath}`
    : normalizedPath;

  const response = await fetch(url, {
    ...options,
    method,
    headers,
    credentials: 'include',
    cache: options.cache ?? 'no-store',
  });

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  let payload: any = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    payload = await response.json().catch(() => null);
  } else {
    payload = await response.text().catch(() => null);
  }

  if (!response.ok) {
    const message =
      (Array.isArray(payload?.message)
        ? payload.message.join(', ')
        : payload?.message) ||
      payload?.error ||
      `Request failed with status ${response.status}`;
    throw new ApiClientError(message, response.status, payload);
  }

  return payload as T;
}

