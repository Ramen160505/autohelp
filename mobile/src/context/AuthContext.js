import React, { createContext, useContext, useState, useEffect } from 'react';
import * as SecureStore from 'expo-secure-store';
import client from '../api/client';

const AuthContext = createContext({});

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadUser() {
      const token = await SecureStore.getItemAsync('token');
      if (token) {
        try {
          const res = await client.get('/users/me');
          setUser(res.data);
        } catch {
          await SecureStore.deleteItemAsync('token');
        }
      }
      setLoading(false);
    }
    loadUser();
  }, []);

  const login = async (phone, code) => {
    // 1. Запит на отримання SMS коду (в MVP він завжди '0000')
    await client.post('/auth/login', { phone });

    // 2. Підтвердження коду
    const verifyRes = await client.post('/auth/verify', { phone, code });
    await SecureStore.setItemAsync('token', verifyRes.data.token);
    setUser(verifyRes.data.user);
  };

  const logout = async () => {
    await SecureStore.deleteItemAsync('token');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
