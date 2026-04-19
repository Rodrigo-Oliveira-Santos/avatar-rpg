/**
 * API Client
 * Fetch wrapper with auth headers and error handling
 */

const BASE_URL = '';

/**
 * Get auth token from storage
 */
function getToken() {
  return localStorage.getItem('avatar_rpg_token');
}

/**
 * Build request headers
 */
function buildHeaders(extra = {}) {
  const headers = { 'Content-Type': 'application/json', ...extra };
  const token = getToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

/**
 * Handle API response — throws on error
 */
async function handleResponse(res) {
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({ error: res.statusText }));
  if (!res.ok) {
    const msg = data?.error || `HTTP ${res.status}`;
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }
  return data;
}

/**
 * GET request
 */
export async function get(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'GET',
    headers: buildHeaders(),
  });
  return handleResponse(res);
}

/**
 * POST request
 */
export async function post(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

/**
 * PUT request
 */
export async function put(path, body) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'PUT',
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });
  return handleResponse(res);
}

/**
 * DELETE request
 */
export async function del(path) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'DELETE',
    headers: buildHeaders(),
  });
  return handleResponse(res);
}
