import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api, { getToken, setToken } from '../api/client';

const AuthContext = createContext(null);

export const ROLE_HOME = {
  STUDENT: '/student/dashboard',
  FACULTY: '/faculty/dashboard',
  RECRUITER: '/recruiter/dashboard',
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const applyUser = useCallback((u) => {
    setUser(u);
    return u;
  }, []);

  const refreshMe = useCallback(async () => {
    const res = await api.get('/auth/me');
    applyUser(res.data.user);
    return res.data.user;
  }, [applyUser]);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      if (!getToken()) {
        setReady(true);
        return;
      }
      try {
        const res = await api.get('/auth/me');
        if (!cancelled) applyUser(res.data.user);
      } catch {
        setToken(null);
      } finally {
        if (!cancelled) setReady(true);
      }
    }
    init();
    return () => {
      cancelled = true;
    };
  }, [applyUser]);

  const login = useCallback(
    async (email, password) => {
      const res = await api.post('/auth/login', { email, password });
      setToken(res.data.token);
      return applyUser(res.data.user);
    },
    [applyUser]
  );

  const signup = useCallback(
    async ({ name, email, password, role }) => {
      const res = await api.post('/auth/signup', { name, email, password, role });
      setToken(res.data.token);
      return applyUser(res.data.user);
    },
    [applyUser]
  );

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const value = {
    user,
    ready,
    isAuthed: Boolean(user),
    login,
    signup,
    logout,
    refreshMe,
    homePath: user ? ROLE_HOME[user.role] : '/',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
