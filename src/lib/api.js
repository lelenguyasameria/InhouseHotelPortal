/**
 * Backend integration touchpoints.
 *
 * Modules currently keep their data in localStorage (see useStoredState) and
 * seed it from their own data.js. When the real backend exists, replace the
 * bodies below. Each module lists the endpoints it expects in its data.js.
 */
export const API_BASE = import.meta.env?.VITE_API_BASE ?? '/api';

export async function apiRequest(method, path, body) {
  // TODO: wire to the hotel's backend (auth header, error handling, retries).
  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  if (!res.ok) throw new Error(`${method} ${path} failed with ${res.status}`);
  return res.status === 204 ? null : res.json();
}
