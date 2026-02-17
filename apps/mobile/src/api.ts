const DEFAULT_BASE_URL = 'http://localhost:3000';

function baseUrl(): string {
  const env = process.env.EXPO_PUBLIC_API_BASE_URL;
  const url = (env || DEFAULT_BASE_URL).replace(/\/+$/, '');
  return url;
}

export async function apiPost<TResponse>(
  path: string,
  body: Record<string, unknown>,
): Promise<TResponse> {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as TResponse;
}

export async function apiGet<TResponse>(path: string): Promise<TResponse> {
  const res = await fetch(`${baseUrl()}${path}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`${res.status} ${res.statusText}: ${text}`);
  }
  return (await res.json()) as TResponse;
}

