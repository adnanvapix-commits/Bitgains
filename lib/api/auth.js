import { supabase } from '../supabase.ts';
import apiClient, { CACHE_TTL, clearCache } from './client.js';

export const authApi = {

  // ─── Register ───────────────────────────────────────────────────────────────
  async register(userData) {
    // Use backend for registration (handles referral chain, wallet creation)
    const response = await apiClient.post('/auth/register', userData);
    return response;
  },

  // ─── Login ────────────────────────────────────────────────────────────────
  // Sign in directly with Supabase — no backend round-trip needed for auth itself.
  // The session token is stored by Supabase SSR client automatically.
  async login({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      return { success: false, message: error.message || 'Invalid credentials' };
    }

    // Fetch profile from backend (validates is_active etc.)
    const profileRes = await apiClient.get('/auth/me', { useCache: false });

    if (!profileRes.success) {
      await supabase.auth.signOut();
      return { success: false, message: profileRes.message || 'Login failed' };
    }

    return {
      success: true,
      data: {
        user: profileRes.data.user,
        wallet: profileRes.data.wallet,
        token: data.session.access_token,
        refreshToken: data.session.refresh_token,
      },
    };
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  async logout() {
    // Tell backend (invalidates session server-side)
    await apiClient.post('/auth/logout', {}).catch(() => {});
    // Sign out from Supabase client (clears local session)
    await supabase.auth.signOut();
    clearCache();
    return { success: true, message: 'Logged out successfully' };
  },

  // ─── Get current profile ──────────────────────────────────────────────────
  async getProfile() {
    return apiClient.get('/auth/me', { useCache: true, ttl: CACHE_TTL.PROFILE });
  },

  // ─── Update profile ───────────────────────────────────────────────────────
  async updateProfile(userData) {
    return apiClient.put('/auth/profile', userData);
  },

  // ─── Change password ──────────────────────────────────────────────────────
  async changePassword(passwordData) {
    return apiClient.put('/auth/change-password', passwordData);
  },

  // ─── Forgot password ──────────────────────────────────────────────────────
  async forgotPassword(email) {
    const sanitized = typeof email === 'string' ? email.trim().toLowerCase() : '';
    return apiClient.post('/auth/forgot-password', { email: sanitized });
  },

  // ─── Reset password ───────────────────────────────────────────────────────
  async resetPassword(token, newPassword) {
    return apiClient.post('/auth/reset-password', { token, password: newPassword });
  },

  // ─── Verify email ─────────────────────────────────────────────────────────
  async verifyEmail(token) {
    return apiClient.post('/auth/verify-email', { token });
  },

  // ─── Resend verification ──────────────────────────────────────────────────
  async resendVerification() {
    return apiClient.post('/auth/resend-verification', {});
  },

  // ─── Referral data ────────────────────────────────────────────────────────
  async getReferralData() {
    return apiClient.get('/auth/referral-data');
  },

  // ─── Check if authenticated ───────────────────────────────────────────────
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // ─── Get current session token ────────────────────────────────────────────
  async getToken() {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  },
};

export const {
  register, login, logout, getProfile, updateProfile,
  changePassword, forgotPassword, resetPassword,
  verifyEmail, resendVerification,
} = authApi;
