import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Account } from '../types';
import { setAuthToken } from '../api/client';

interface AuthContextValue {
  account: Account | null;
  token: string | null;
  isAdmin: boolean;
  signIn: (account: Account, token: string | null) => void;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY_ACCOUNT = 'scemas_account';
const STORAGE_KEY_TOKEN   = 'scemas_token';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [account, setAccount] = useState<Account | null>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_ACCOUNT);
      return raw ? (JSON.parse(raw) as Account) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(STORAGE_KEY_TOKEN),
  );

  // Restore auth header on mount (page refresh)
  useEffect(() => {
    if (token) setAuthToken(token);
  }, [token]);

  const signIn = useCallback((acc: Account, tok: string | null) => {
    setAccount(acc);
    setToken(tok);
    localStorage.setItem(STORAGE_KEY_ACCOUNT, JSON.stringify(acc));
    if (tok) {
      localStorage.setItem(STORAGE_KEY_TOKEN, tok);
      setAuthToken(tok);
    }
  }, []);

  const signOut = useCallback(() => {
    setAccount(null);
    setToken(null);
    localStorage.removeItem(STORAGE_KEY_ACCOUNT);
    localStorage.removeItem(STORAGE_KEY_TOKEN);
    setAuthToken(null);
  }, []);

  const isAdmin = account?.clearance === 'admin';

  return (
    <AuthContext.Provider value={{ account, token, isAdmin, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
