import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function ProfileScreen() {
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
  };

  if (!user) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профіль</Text>
      </View>

      <View style={styles.card}>
        <View style={styles.avatarPlaceholder}>
          <Text style={styles.avatarText}>{user.name?.charAt(0) || '👤'}</Text>
        </View>
        <Text style={styles.name}>{user.name}</Text>
        <Text style={styles.phone}>{user.phone}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>⭐ {user.rating?.toFixed(1) || '0.0'}</Text>
            <Text style={styles.statLabel}>Рейтинг</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statValue}>🤝 {user.help_count || 0}</Text>
            <Text style={styles.statLabel}>Допоміг</Text>
          </View>
        </View>
      </View>

      {user.car_brand && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>🚗 Ваше авто</Text>
          <Text style={styles.carText}>{user.car_brand} {user.car_model}</Text>
          <Text style={styles.smallText}>Колір: {user.car_color}</Text>
          <Text style={styles.smallText}>Номер: {user.car_plate}</Text>
        </View>
      )}

      {user.is_business && (
        <View style={[styles.card, { borderColor: '#f59e0b', borderWidth: 1 }]}>
          <Text style={styles.sectionTitle}>🚜 Бізнес Акаунт</Text>
          <Text style={styles.carText}>{user.business_name}</Text>
          <Text style={styles.smallText}>Ваш бізнес відображається на карті для всіх користувачів.</Text>
        </View>
      )}

      {/* Placeholder for Wallet - hidden per user request */}

      <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
        <Text style={styles.logoutText}>Вийти з акаунту</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', padding: 20, paddingTop: 60 },
  header: { marginBottom: 20 },
  headerTitle: { color: '#fff', fontSize: 24, fontWeight: 'bold' },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 15 },
  avatarPlaceholder: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#334155', alignSelf: 'center', justifyContent: 'center', alignItems: 'center', marginBottom: 15 },
  avatarText: { fontSize: 40, color: '#fff' },
  name: { color: '#fff', fontSize: 22, fontWeight: 'bold', textAlign: 'center', marginBottom: 5 },
  phone: { color: '#94a3b8', fontSize: 16, textAlign: 'center', marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#334155', paddingTop: 15 },
  statBox: { alignItems: 'center', flex: 1 },
  statValue: { color: '#f59e0b', fontSize: 20, fontWeight: 'bold' },
  statLabel: { color: '#94a3b8', fontSize: 12, marginTop: 4 },
  sectionTitle: { color: '#94a3b8', fontSize: 14, fontWeight: 'bold', marginBottom: 10, textTransform: 'uppercase' },
  carText: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 5 },
  smallText: { color: '#cbd5e1', fontSize: 14 },
  logoutBtn: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 30 },
  logoutText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});
