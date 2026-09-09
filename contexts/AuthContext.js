"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import { supabase } from "../lib/supabase.ts";
import { authApi } from "../lib/api/auth.js";

// ─── Initial state ────────────────────────────────────────────────────────────
const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,
};

// ─── Action types ─────────────────────────────────────────────────────────────
const ActionTypes = {
  SET_LOADING:   "SET_LOADING",
  SET_USER:      "SET_USER",
  SET_ERROR:     "SET_ERROR",
  LOGIN_SUCCESS: "LOGIN_SUCCESS",
  LOGOUT:        "LOGOUT",
  CLEAR_ERROR:   "CLEAR_ERROR",
};

// ─── Reducer ──────────────────────────────────────────────────────────────────
const authReducer = (state, action) => {
  switch (action.type) {
    case ActionTypes.SET_LOADING:
      return { ...state, isLoading: action.payload };

    case ActionTypes.SET_USER:
      return { ...state, user: action.payload, isAuthenticated: !!action.payload, isLoading: false, error: null };

    case ActionTypes.SET_ERROR:
      return { ...state, error: action.payload, isLoading: false };

    case ActionTypes.LOGIN_SUCCESS:
      return { ...state, user: action.payload.user, isAuthenticated: true, isLoading: false, error: null };

    case ActionTypes.LOGOUT:
      return { ...initialState, isLoading: false };

    case ActionTypes.CLEAR_ERROR:
      return { ...state, error: null };

    default:
      return state;
  }
};

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // ─── On mount: listen to Supabase auth state changes ─────────────────────
  useEffect(() => {
    // getSession() is instant — reads from localStorage/cookie set by Supabase
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        await loadProfile();
      } else {
        dispatch({ type: ActionTypes.SET_LOADING, payload: false });
      }
    });

    // onAuthStateChange fires on login, logout, token refresh
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session) {
        await loadProfile();
      } else if (event === "SIGNED_OUT" || event === "USER_DELETED") {
        dispatch({ type: ActionTypes.LOGOUT });
      } else if (event === "TOKEN_REFRESHED" && session) {
        // Token silently refreshed — no UI change needed
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // ─── Load profile from backend ────────────────────────────────────────────
  const loadProfile = async () => {
    try {
      const response = await authApi.getProfile();
      if (response.success) {
        dispatch({ type: ActionTypes.SET_USER, payload: response.data.user });
      } else {
        await supabase.auth.signOut();
        dispatch({ type: ActionTypes.LOGOUT });
      }
    } catch {
      await supabase.auth.signOut();
      dispatch({ type: ActionTypes.LOGOUT });
    }
  };

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = useCallback(async (credentials) => {
    try {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const response = await authApi.login(credentials);

      if (response.success) {
        dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: response.data.user } });
        return { success: true, user: response.data.user };
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: response.message || "Login failed" });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const msg = error.message || "Login failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: msg });
      return { success: false, message: msg };
    }
  }, []);

  // ─── Register ─────────────────────────────────────────────────────────────
  const register = useCallback(async (userData) => {
    try {
      dispatch({ type: ActionTypes.CLEAR_ERROR });
      const response = await authApi.register(userData);

      if (response.success) {
        // After register, sign in directly
        const loginRes = await authApi.login({ email: userData.email, password: userData.password });
        if (loginRes.success) {
          dispatch({ type: ActionTypes.LOGIN_SUCCESS, payload: { user: loginRes.data.user } });
        }
        return { success: true };
      } else {
        dispatch({ type: ActionTypes.SET_ERROR, payload: response.message || "Registration failed" });
        return { success: false, message: response.message };
      }
    } catch (error) {
      const msg = error.message || "Registration failed";
      dispatch({ type: ActionTypes.SET_ERROR, payload: msg });
      return { success: false, message: msg };
    }
  }, []);

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await authApi.logout();
      dispatch({ type: ActionTypes.LOGOUT });
      return { success: true };
    } catch {
      dispatch({ type: ActionTypes.LOGOUT });
      return { success: true };
    }
  }, []);

  // ─── Clear error ──────────────────────────────────────────────────────────
  const clearError = useCallback(() => {
    dispatch({ type: ActionTypes.CLEAR_ERROR });
  }, []);

  // ─── Update user in state ─────────────────────────────────────────────────
  const updateUser = useCallback((userData) => {
    dispatch({ type: ActionTypes.SET_USER, payload: { ...state.user, ...userData } });
  }, [state.user]);

  const value = useMemo(() => ({
    ...state,
    login,
    register,
    logout,
    clearError,
    updateUser,
  }), [state, login, register, logout, clearError, updateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
};

export default AuthContext;
