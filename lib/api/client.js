'use client';
import { supabase } from '../supabase.ts';

const cache = new Map();
export const CACHE_TTL = { DEFAULT: 30000, PROFILE: 60000, WALLET: 30000 };

const cacheGet = (key) => { const e = cache.get(key); if (!e) return null; if (Date.now() > e.expiresAt) { cache.delete(key); return null; } return e.data; };
const cacheSet = (key, data, ttl = CACHE_TTL.DEFAULT) => cache.set(key, { data, expiresAt: Date.now() + ttl });

export const clearCache = () => cache.clear();

class ApiClient {
  constructor() { this.baseURL = '/api'; }

  async getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  }

  async getHeaders() {
    const token = await this.getToken();
    const h = { 'Content-Type': 'application/json' };
    if (token) h['Authorization'] = `Bearer ${token}`;
    return h;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const headers = await this.getHeaders();
    try {
      const res = await fetch(url, { headers, ...options });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        if (res.status === 401) { await supabase.auth.signOut(); if (typeof window !== 'undefined') window.location.href = '/login'; }
        throw new Error(data.message || `HTTP ${res.status}`);
      }
      return await res.json();
    } catch (err) { throw err; }
  }

  async get(endpoint, options = {}) {
    const { useCache = false, ttl = CACHE_TTL.DEFAULT } = options;
    if (useCache) { const c = cacheGet(`GET:${endpoint}`); if (c) return c; }
    const result = await this.request(endpoint, { method: 'GET' });
    if (useCache && result?.success) cacheSet(`GET:${endpoint}`, result, ttl);
    return result;
  }

  async post(endpoint, data) {
    const result = await this.request(endpoint, { method: 'POST', body: JSON.stringify(data) });
    if (/wallet|transaction|stake|deposit|withdraw/i.test(endpoint)) { cache.delete('GET:/users/wallet'); cache.delete('GET:/transactions/history'); }
    return result;
  }

  async put(endpoint, data) {
    cache.delete(`GET:${endpoint}`);
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(data) });
  }

  async patch(endpoint, data) {
    return this.request(endpoint, { method: 'PATCH', body: JSON.stringify(data) });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  // Cache helpers used by transactions.js
  getCached(key, ttl) { return cacheGet(key); }
  setCached(key, data, ttl) { cacheSet(key, data, ttl); }
  clearCache() { clearCache(); }
}

const apiClient = new ApiClient();
export default apiClient;
