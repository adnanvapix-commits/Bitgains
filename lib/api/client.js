import { supabase } from '../supabase.ts';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

// ─── Simple in-memory cache ───────────────────────────────────────────────────
const cache = new Map();

export const CACHE_TTL = {
  DEFAULT: 30 * 1000,
  PROFILE: 60 * 1000,
  WALLET:  30 * 1000,
};

const getFromCache = (key) => {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) { cache.delete(key); return null; }
  return entry.data;
};

const setInCache = (key, data, ttl) => {
  cache.set(key, { data, expiresAt: Date.now() + ttl });
};

const invalidateCache = (key) => cache.delete(key);

export const clearCache = () => cache.clear();

// ─── API Client ───────────────────────────────────────────────────────────────
class ApiClient {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  // Get the current Supabase session token (always fresh)
  async getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async getHeaders() {
    const token = await this.getToken();
    const headers = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();

    const config = {
      headers,
      mode: 'cors',
      cache: 'no-store',
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));

        // Supabase session expired — sign out and redirect
        if (response.status === 401) {
          await supabase.auth.signOut();
          if (typeof window !== 'undefined') window.location.href = '/login';
        }

        throw new Error(data.message || `HTTP Error: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      throw error;
    }
  }

  async get(endpoint, options = {}) {
    const { useCache = false, ttl = CACHE_TTL.DEFAULT } = options;

    if (useCache) {
      const cached = getFromCache(`GET:${endpoint}`);
      if (cached) return cached;
    }

    const result = await this.request(endpoint, { method: 'GET' });

    if (useCache && result.success) {
      setInCache(`GET:${endpoint}`, result, ttl);
    }

    return result;
  }

  async post(endpoint, data) {
    const result = await this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });

    if (endpoint.includes('/wallet') || endpoint.includes('/transaction') || endpoint.includes('/stake') || endpoint.includes('/deposit') || endpoint.includes('/withdraw')) {
      invalidateCache('GET:/users/wallet');
      invalidateCache('GET:/transactions/history');
      invalidateCache('GET:/auth/me');
    }

    return result;
  }

  async put(endpoint, data) {
    const result = await this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    invalidateCache(`GET:${endpoint}`);
    return result;
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  clearCache() {
    clearCache();
  }
}

const apiClient = new ApiClient();
export default apiClient;
