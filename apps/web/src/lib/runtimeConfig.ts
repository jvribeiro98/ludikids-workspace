/**
 * URL da API em runtime. No browser usa window.__RUNTIME_CONFIG__ (gerado no start do container).
 * Fallback: NEXT_PUBLIC_API_URL (build) e, em dev, http://localhost:4000.
 */
export function getApiUrl(): string {
  if (typeof window !== 'undefined' && (window as unknown as { __RUNTIME_CONFIG__?: { API_URL?: string } }).__RUNTIME_CONFIG__?.API_URL) {
    return (window as unknown as { __RUNTIME_CONFIG__: { API_URL: string } }).__RUNTIME_CONFIG__.API_URL;
  }
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  return 'http://localhost:4000';
}
