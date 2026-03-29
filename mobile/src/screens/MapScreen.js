import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';
import client from '../api/client';
import { useSocket } from '../context/SocketContext';

const PROBLEM_TYPES = {
  battery: '🔋', fuel: '⛽', tire: '🔧', tow: '⛓️', other: '❓'
};

export default function MapScreen({ navigation }) {
  const [location, setLocation] = useState(null);
  const [requests, setRequests] = useState([]);
  const [businessUsers, setBusinessUsers] = useState([]);
  const socket = useSocket();

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      let loc = await Location.getCurrentPositionAsync({});
      setLocation(loc.coords);

      try {
        const [reqRes, busRes] = await Promise.all([
          client.get('/requests', { params: { lat: loc.coords.latitude, lng: loc.coords.longitude, radius: 20 } }),
          client.get('/users/business')
        ]);
        setRequests(reqRes.data);
        setBusinessUsers(busRes.data);
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
          {/* Requests */}
          {requests.map((r) => (
            <Marker
              key={r.id}
              coordinate={{ latitude: r.latitude, longitude: r.longitude }}
              title={PROBLEM_TYPES[r.type] || '❓'}
              description={r.description || 'Потрібна допомога'}
              onCalloutPress={() => navigation.navigate('RequestDetail', { id: r.id })}
            />
          ))}

          {/* Business Users */}
          {businessUsers.map((u) => {
            if (!u.last_lat || !u.last_lng) return null;
            return (
              <Marker
                key={`bus_${u.id}`}
                coordinate={{ latitude: u.last_lat, longitude: u.last_lng }}
                title={`🚜 ${u.business_name || 'Евакуатор'}`}
                description={`⭐ ${u.rating?.toFixed(1) || 'Новий'} • Натисніть щоб подзвонити`}
              />
            );
          })}
        </MapView>
      ) : (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Отримання геолокації...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { width: '100%', height: '100%' },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f1525' },
  loadingText: { color: '#f59e0b', fontSize: 16 },
});
