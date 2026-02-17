const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('accessToken');
}

export async function api<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options.headers,
  };
  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  if (res.status === 401) {
    const refreshed = await refreshToken();
    if (refreshed) {
      return api(path, options);
    }
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      window.location.href = '/login';
    }
    throw new Error('Não autorizado');
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `Erro ${res.status}`);
  }
  return res.json();
}

async function refreshToken(): Promise<boolean> {
  const ref = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
  if (!ref) return false;
  try {
    const res = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken: ref }),
    });
    if (!res.ok) return false;
    const data = await res.json();
    localStorage.setItem('accessToken', data.accessToken);
    return true;
  } catch {
    return false;
  }
}

export const apiGet = <T>(path: string) => api<T>(path, { method: 'GET' });
export const apiPost = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'POST', body: JSON.stringify(body) });
export const apiPut = <T>(path: string, body: unknown) =>
  api<T>(path, { method: 'PUT', body: JSON.stringify(body) });
export const apiPatch = <T>(path: string, body?: unknown) =>
  api<T>(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined });
export const apiDelete = <T>(path: string) => api<T>(path, { method: 'DELETE' });
