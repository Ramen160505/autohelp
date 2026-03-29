import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import client from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('autohelp_user')); } catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('autohelp_token');
    if (token) {
      client.get('/users/me')
        .then(res => { 
          setUser(res.data); 
          localStorage.setItem('autohelp_user', JSON.stringify(res.data)); 
        })
        .catch((err) => { 
          // Only clear user data from state if it's a 401 (handled by interceptor). 
          // For network timeout/500, we keep whatever is in localStorage so they don't lose session!
          console.warn('Could not verify user at startup:', err.message);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback((token, userData) => {
    localStorage.setItem('autohelp_token', token);
    localStorage.setItem('autohelp_user', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('autohelp_token');
    localStorage.removeItem('autohelp_user');
    setUser(null);
  }, []);

  const updateUser = useCallback((data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    localStorage.setItem('autohelp_user', JSON.stringify(updated));
  }, [user]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
