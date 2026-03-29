import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function LoginScreen() {
  const { login } = useAuth();
  const [phone, setPhone] = useState('+380');
  const [code, setCode] = useState('0000');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (phone.length < 10) {
      Alert.alert('Помилка', 'Введіть правильний номер телефону');
      return;
    }
    setLoading(true);
    try {
      await login(phone, code);
    } catch (e) {
      Alert.alert('Помилка авторизації', e.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>🚗 AutoHelp</Text>
      <Text style={styles.subtitle}>Швидка допомога на дорозі</Text>

      <View style={styles.form}>
        <Text style={styles.label}>Ваш номер телефону:</Text>
        <TextInput
          style={styles.input}
          keyboardType="phone-pad"
          value={phone}
          onChangeText={setPhone}
          autoCapitalize="none"
        />

        <Text style={styles.label}>SMS Код (за замовчуванням 0000):</Text>
        <TextInput
          style={styles.input}
          keyboardType="number-pad"
          value={code}
          onChangeText={setCode}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? <ActivityIndicator color="#000" /> : <Text style={styles.buttonText}>Увійти</Text>}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#0f1525', padding: 24, justifyContent: 'center',
  },
  logo: {
    fontSize: 42, fontWeight: '800', color: '#f59e0b', textAlign: 'center', marginBottom: 8,
  },
  subtitle: {
    fontSize: 16, color: '#94a3b8', textAlign: 'center', marginBottom: 40,
  },
  form: {
    backgroundColor: '#141c30', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: '#1e293b',
  },
  label: {
    fontSize: 14, color: '#f1f5f9', marginBottom: 8, fontWeight: '600',
  },
  input: {
    backgroundColor: '#0a0e1a', borderWidth: 1, borderColor: '#1e293b', borderRadius: 8,
    padding: 14, color: '#fff', fontSize: 16, marginBottom: 16,
  },
  button: {
    backgroundColor: '#f59e0b', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 10,
  },
  buttonText: {
    color: '#000', fontSize: 16, fontWeight: '700',
  },
});
