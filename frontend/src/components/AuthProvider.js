'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api, { APIError, getStoredToken, setStoredToken } from '@/lib/api';

const AuthContext = createContext(null);

const PUBLIC_PATHS = new Set(['/login']);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    let active = true;

    async function loadUser() {
      const token = getStoredToken();
      if (!token) {
        if (active) {
          setUser(null);
          setLoading(false);
        }
        return;
      }

      try {
        const response = await api.me();
        if (active) {
          setUser(response.data.user);
        }
      } catch (error) {
        setStoredToken(null);
        if (active) {
          setUser(null);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    loadUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (loading) {
      return;
    }

    if (!user && !PUBLIC_PATHS.has(pathname)) {
      router.replace('/login');
      return;
    }

    if (user && pathname === '/login') {
      router.replace('/');
    }
  }, [loading, pathname, router, user]);

  async function authenticate(method, payload) {
    const response = method === 'register' ? await api.register(payload) : await api.login(payload);
    setStoredToken(response.data.token);
    setUser(response.data.user);
    router.replace('/');
    return response.data.user;
  }

  async function logout() {
    try {
      await api.logout();
    } catch (error) {
      if (!(error instanceof APIError) || error.status !== 401) {
        throw error;
      }
    } finally {
      setStoredToken(null);
      setUser(null);
      router.replace('/login');
    }
  }

  const value = useMemo(() => ({
    user,
    loading,
    isAuthenticated: Boolean(user),
    login: (payload) => authenticate('login', payload),
    register: (payload) => authenticate('register', payload),
    logout,
  }), [loading, user]);

  const showLoadingState = loading || (!user && !PUBLIC_PATHS.has(pathname));

  return (
    <AuthContext.Provider value={value}>
      {showLoadingState ? (
        <div style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', color: 'var(--muted)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem' }}>Expense Tracker</div>
            <div style={{ marginTop: '0.35rem' }}>Loading your workspace...</div>
          </div>
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
