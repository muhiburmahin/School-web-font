'use server';

import { headers } from 'next/headers';

function getBaseApiUrl(): string {
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.BACKEND_ORIGIN ||
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:5000'
  );
}

async function getForwardHeaders(): Promise<Record<string, string>> {
  const headersList = await headers();
  const host =
    headersList.get('x-forwarded-host') ||
    headersList.get('host') ||
    'localhost:3000';
  const devSlug = headersList.get('x-dev-site-slug');

  const reqHeaders: Record<string, string> = { Accept: 'application/json' };
  const proxySecret = process.env.TRUSTED_PROXY_SECRET;
  if (proxySecret) {
    reqHeaders['x-mrm-proxy-secret'] = proxySecret;
    reqHeaders['x-mrm-original-host'] = host;
  } else {
    reqHeaders['Host'] = host;
  }

  if (devSlug) {
    reqHeaders['x-dev-site-slug'] = devSlug;
  }

  return reqHeaders;
}

export async function getPublicTenantProfile() {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const res = await fetch(`${baseUrl}/api/v1/institution-profile`, {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPublicNotices(category?: string) {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const url = new URL(`${baseUrl}/api/v1/notices`);
    if (category) url.searchParams.set('category', category);

    const res = await fetch(url.toString(), {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || data.data || [];
  } catch {
    return [];
  }
}

export async function getPublicNoticeById(id: string) {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const res = await fetch(`${baseUrl}/api/v1/notices/${encodeURIComponent(id)}`, {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPublicStaff() {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const res = await fetch(`${baseUrl}/api/v1/staff`, {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || data.data || [];
  } catch {
    return [];
  }
}

export async function getPublicGallery() {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const res = await fetch(`${baseUrl}/api/v1/gallery`, {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || data.data || [];
  } catch {
    return [];
  }
}

export async function getPublicPageBySlug(slug: string) {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const res = await fetch(`${baseUrl}/api/v1/pages/${encodeURIComponent(slug)}`, {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export async function getPublicExternalLinks() {
  const baseUrl = getBaseApiUrl();
  const reqHeaders = await getForwardHeaders();

  try {
    const res = await fetch(`${baseUrl}/api/v1/external-links`, {
      headers: reqHeaders,
      cache: 'no-store',
    });

    if (!res.ok) return [];
    const data = await res.json();
    return Array.isArray(data) ? data : data.items || data.data || [];
  } catch {
    return [];
  }
}
