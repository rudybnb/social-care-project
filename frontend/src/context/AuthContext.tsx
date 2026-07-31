import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authAPI } from '../services/api';

export type Role = 'admin' | 'worker' | null;

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
}

interface StoredAuth {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  expiresAt: string | null;
  login: (user: User, token: string | null, expiresAt: string | null) => void;
  logout: () => Promise<void>;
  clearSession: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const STORAGE_KEY = 'auth';

function isExpired(expiresAt: string | null | undefined): boolean {
  if (!expiresAt) return false;
  const expiryTime = new Date(expiresAt).getTime();
  return Number.isFinite(expiryTime) && expiryTime <= Date.now();
}

function readStoredAuth(): StoredAuth {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) return { user: null, token: null, expiresAt: null };
  try {
    const parsed = JSON.parse(saved);
    return {
      user: parsed?.user ?? null,
      token: parsed?.token ?? null,
      expiresAt: parsed?.expiresAt ?? null,
    };
  } catch (e) {
    localStorage.removeItem(STORAGE_KEY);
    return { user: null, token: null, expiresAt: null };
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    setExpiresAt(null);
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  // Restore any stored session on mount and validate it against the server.
  useEffect(() => {
    let active = true;
    const stored = readStoredAuth();

    const restore = (next: StoredAuth) => {
      if (!active) return;
      setUser(next.user);
      setToken(next.token);
      setExpiresAt(next.expiresAt);
      setIsLoading(false);
    };

    if (!stored.token || isExpired(stored.expiresAt)) {
      localStorage.removeItem(STORAGE_KEY);
      restore({ user: null, token: null, expiresAt: null });
      return;
    }

    authAPI
      .me(stored.token)
      .then((sessionUser) => {
        if (!active) return;
        if (!sessionUser) {
          // The server no longer recognises the token (expired/revoked) — clear it.
          localStorage.removeItem(STORAGE_KEY);
          restore({ user: null, token: null, expiresAt: null });
          return;
        }
        restore(stored);
      })
      .catch(() => {
        // Backend unreachable — keep the stored session optimistically.
        if (active) restore(stored);
      });

    return () => {
      active = false;
    };
  }, []);

  // Clear the session once it expires while the app is open.
  useEffect(() => {
    const checkExpiry = () => {
      if (isExpired(expiresAt)) clearSession();
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 30_000);
    return () => clearInterval(interval);
  }, [expiresAt, clearSession]);

  const login = (nextUser: User, nextToken: string | null, nextExpiresAt: string | null) => {
    setUser(nextUser);
    setToken(nextToken);
    setExpiresAt(nextExpiresAt);
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: nextUser, token: nextToken, expiresAt: nextExpiresAt }));
  };

  const logout = async () => {
    const currentToken = token;
    try {
      await authAPI.logout(currentToken);
    } catch (error) {
      console.error('Logout request failed:', error);
    } finally {
      clearSession();
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, expiresAt, login, logout, clearSession, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
