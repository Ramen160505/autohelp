import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Для Android Емулятора замість localhost використовується 10.0.2.2, 
// Якщо запускати на реальному пристрої через Expo Go, треба вписати IPv4 комп'ютера (напр. 192.168.1.100)
export const API_URL = 'http://10.0.2.2:3001'; 

const client = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

client.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
