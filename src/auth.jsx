import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { get, getToken, post, setToken, setUnauthorizedHandler } from './lib/api';
import { navigate } from './lib/router';

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [ready, setReady] = useState(false);

  const logout = useCallback(() => { setToken(null); setUser(null); }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => { setToken(null); setUser(null); navigate('login'); });
    if (!getToken()) { setReady(true); return; }
    get('/me').then(setUser).catch(() => setToken(null)).finally(() => setReady(true));
  }, []);

  const finish = (res) => { setToken(res.access_token); setUser(res.user); return res.user; };
  const login = async (email, password) => finish(await post('/login', { email, password }));
  const register = async (name, email, password) => finish(await post('/register', { name, email, password }));

  return <AuthCtx.Provider value={{ user, setUser, ready, login, register, logout }}>{children}</AuthCtx.Provider>;
}

export const useAuth = () => useContext(AuthCtx);
