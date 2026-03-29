import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import * as Location from 'expo-location';
import client from '../api/client';

const PROBLEM_TYPES = [
  { value: 'battery', icon: '🔋', label: 'Акумулятор' },
  { value: 'fuel', icon: '⛽', label: 'Пальне' },
  { value: 'tire', icon: '🔧', label: 'Колесо' },
  { value: 'tow', icon: '⛓️', label: 'Евакуатор' },
  { value: 'other', icon: '❓', label: 'Інше' },
];

export default function CreateRequestScreen({ navigation }) {
  const [type, setType] = useState('');
  const [rewardType, setRewardType] = useState('negotiable');
  const [rewardAmount, setRewardAmount] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!type) {
      Alert.alert('Помилка', 'Оберіть тип проблеми');
      return;
    }

    setLoading(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Помилка геолокації', 'Потрібен доступ до геолокації');
        setLoading(false);
        return;
      }

      let loc = await Location.getCurrentPositionAsync({});
      
      const res = await client.post('/requests', {
        type,
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        description,
        reward_type: rewardType,
        reward_amount: rewardType === 'fixed' ? parseInt(rewardAmount) : null,
      });

      // Clear form
      setType('');
      setDescription('');
      setRewardAmount('');
      setRewardType('negotiable');

      // Navigate to detail
      navigation.navigate('RequestDetail', { id: res.data.id });
    } catch (e) {
      Alert.alert('Помилка', e.response?.data?.error || 'Не вдалося створити заявку');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: 20 }}>
      <Text style={styles.title}>🆘 Створити заявку</Text>

      <Text style={styles.label}>Що сталося?</Text>
      <View style={styles.grid}>
        {PROBLEM_TYPES.map(pt => (
          <TouchableOpacity 
            key={pt.value} 
            style={[styles.typeBtn, type === pt.value && styles.typeBtnActive]}
            onPress={() => setType(pt.value)}
          >
            <Text style={styles.typeIcon}>{pt.icon}</Text>
            <Text style={[styles.typeLabel, type === pt.value && styles.typeLabelActive]}>{pt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Винагорода</Text>
      <View style={{ flexDirection: 'row', gap: 10, marginBottom: 16 }}>
        {['free', 'fixed', 'negotiable'].map(rt => {
          const l = rt === 'free' ? '🎁 Безкоштовно' : rt === 'fixed' ? '💰 Фікс.' : '🤝 Договірна';
          return (
            <TouchableOpacity 
              key={rt} 
              style={[styles.rewardBtn, rewardType === rt && styles.rewardBtnActive]}
              onPress={() => setRewardType(rt)}
            >
              <Text style={[styles.rewardLabel, rewardType === rt && styles.rewardLabelActive]}>{l}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {rewardType === 'fixed' && (
        <TextInput 
          style={styles.input} 
          placeholder="Сума (грн)" 
          placeholderTextColor="#64748b"
          keyboardType="numeric"
          value={rewardAmount}
          onChangeText={setRewardAmount}
        />
      )}

      <Text style={styles.label}>Коментар (необов'язково)</Text>
      <TextInput 
        style={[styles.input, { height: 80, textAlignVertical: 'top' }]} 
        placeholder="Опишіть деталі..." 
        placeholderTextColor="#64748b"
        multiline
        value={description}
        onChangeText={setDescription}
      />

      <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#0f172a" /> : <Text style={styles.submitText}>Опублікувати</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#fff', marginBottom: 24, marginTop: 40 },
  label: { fontSize: 16, fontWeight: '600', color: '#cbd5e1', marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
  typeBtn: { 
    width: '47%', backgroundColor: '#1e293b', padding: 16, borderRadius: 12, 
    borderWidth: 2, borderColor: '#334155', alignItems: 'center' 
  },
  typeBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  typeIcon: { fontSize: 32, marginBottom: 8 },
  typeLabel: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold' },
  typeLabelActive: { color: '#f59e0b' },
  rewardBtn: { flex: 1, padding: 12, backgroundColor: '#1e293b', borderRadius: 8, borderWidth: 1, borderColor: '#334155', alignItems: 'center' },
  rewardBtnActive: { borderColor: '#f59e0b', backgroundColor: 'rgba(245, 158, 11, 0.1)' },
  rewardLabel: { color: '#94a3b8', fontSize: 12, fontWeight: 'bold' },
  rewardLabelActive: { color: '#f59e0b' },
  input: { backgroundColor: '#1e293b', borderRadius: 8, padding: 14, color: '#fff', fontSize: 16, marginBottom: 24, borderWidth: 1, borderColor: '#334155' },
  submitBtn: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  submitText: { color: '#000', fontSize: 16, fontWeight: 'bold' }
});
