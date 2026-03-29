import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import client from '../api/client';
import { useSocket } from '../context/SocketContext';

const PROBLEM_TYPES = {
  battery: '🔋', fuel: '⛽', tire: '🔧', tow: '⛓️', other: '❓'
};

export default function MapScreen() {
  const [location, setLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      try {
        const res = await client.get('/requests', {
          params: { lat: loc.coords.latitude, lng: loc.coords.longitude, radius: 20 }
        });
        setRequests(res.data);
      } catch (e) {}
    })();
  }, []);

  useEffect(() => {
    if (!socket) return;
    socket.on('new_request', (req) => {
      setRequests((prev) => [req, ...prev]);
    });
    return () => socket.off('new_request');
  }, [socket]);

  return (
    <View style={styles.container}>
      {location ? (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude: location.latitude,
            longitude: location.longitude,
            latitudeDelta: 0.05,
            longitudeDelta: 0.05,
          }}
          showsUserLocation={true}
        >
          {requests.map((r) => (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              title={PROBLEM_TYPES[r.type] || '❓'}
              description={r.description || 'Потрібна допомога'}
            />
          ))}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Отримання геолокації...</Text>
        </View>
      )}

      <TouchableOpacity style={styles.fab} onPress={() => alert('Створення заявки в розробці (наступний крок MVP)')}>
        <Text style={styles.fabIcon}>🆘</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1525' },
  loadingText: { color: '#f59e0b', fontSize: 16 },
  fab: {
    position: 'absolute', bottom: 30, right: 30, backgroundColor: '#ef4444',
    width: 64, height: 64, borderRadius: 32, justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ef4444', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 8, elevation: 10,
  },
  fabIcon: { fontSize: 32 },
});
