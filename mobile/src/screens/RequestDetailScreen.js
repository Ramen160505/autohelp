import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform, Alert, Image } from 'react-native';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';

export default function RequestDetailScreen({ route, navigation }) {
  const { id } = route.params;
  const { user } = useAuth();
  const socket = useSocket();
  
  const [request, setRequest] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  useEffect(() => {
    if (!socket) return;
    socket.emit('join_request', id);

    socket.on('request_updated', req => {
      if (req.id === id) setRequest(req);
    });
    
    socket.on('new_message', msg => {
      if (msg.request_id === id) {
        setMessages(prev => [...prev, msg]);
      }
    });

    return () => {
      socket.off('request_updated');
      socket.off('new_message');
    };
  }, [socket, id]);

  const fetchData = async () => {
    try {
      const [{ data: reqData }, { data: chatData }] = await Promise.all([
        client.get(`/requests/${id}`),
        client.get(`/chats/${id}`)
      ]);
      setRequest(reqData);
      setMessages(chatData);
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося завантажити деталі');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    try {
      if (newStatus === 'accepted') {
        const res = await client.put(`/requests/${id}/take`);
        setRequest(res.data);
      } else {
        const res = await client.put(`/requests/${id}/status`, { status: newStatus });
        setRequest(res.data);
      }
    } catch (e) {
      Alert.alert('Помилка', e.response?.data?.error || 'Помилка');
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    try {
      await client.post(`/chats/${id}`, { message: newMessage });
      setNewMessage('');
    } catch (e) {
      Alert.alert('Помилка', 'Не вдалося надіслати повідомлення');
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#f59e0b" />
      </View>
    );
  }

  if (!request) return null;

  const isOwner = request.user_id === user?.id;
  const isHelper = request.helper_id === user?.id;

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backText}>← Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Деталі заявки</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.card}>
          <Text style={styles.type}>Тип: {request.type.toUpperCase()}</Text>
          <Text style={styles.status}>Статус: {request.status}</Text>
          <Text style={styles.reward}>Винагорода: {request.reward_type === 'free' ? 'Безкоштовно' : request.reward_type === 'fixed' ? `${request.reward_amount} грн` : 'За домовленістю'}</Text>
          {request.description ? <Text style={styles.desc}>{request.description}</Text> : null}
          {request.photo_url && (
            <Image 
              source={{ uri: `http://192.168.0.101:3001${request.photo_url}` }} 
              style={{ width: '100%', height: 200, borderRadius: 12, marginTop: 12 }} 
            />
          )}
        </View>

        <View style={styles.actions}>
          {!isOwner && request.status === 'pending' && (
            <TouchableOpacity style={styles.btnPrimary} onPress={() => handleStatusChange('accepted')}>
              <Text style={styles.btnText}>Беру заявку</Text>
            </TouchableOpacity>
          )}

          {isOwner && request.status === 'pending' && (
            <TouchableOpacity style={styles.btnDanger} onPress={() => handleStatusChange('cancelled')}>
              <Text style={styles.btnText}>Скасувати</Text>
            </TouchableOpacity>
          )}

          {(isOwner || isHelper) && request.status === 'accepted' && (
            <TouchableOpacity style={styles.btnSuccess} onPress={() => handleStatusChange('completed')}>
              <Text style={styles.btnText}>Завершити успішно</Text>
            </TouchableOpacity>
          )}
        </View>

        {(isOwner || isHelper) && (
          <View style={styles.chatSection}>
            <Text style={styles.chatTitle}>💬 Чат</Text>
            {messages.map((m, i) => {
              const mine = m.sender_id === user.id;
              return (
                <View key={i} style={[styles.msgWrapper, mine ? styles.msgMine : styles.msgTheirs]}>
                  <Text style={styles.msgText}>{m.message}</Text>
                </View>
              );
            })}
          </View>
        )}
      </ScrollView>

      {(isOwner || isHelper) && request.status !== 'completed' && request.status !== 'cancelled' && (
        <View style={styles.inputArea}>
          <TextInput
            style={styles.chatInput}
            value={newMessage}
            onChangeText={setNewMessage}
            placeholder="Написати повідомлення..."
            placeholderTextColor="#64748b"
          />
          <TouchableOpacity style={styles.sendBtn} onPress={sendMessage}>
            <Text style={styles.sendText}>➤</Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a' },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 50, paddingBottom: 15, paddingHorizontal: 20, backgroundColor: '#1e293b' },
  backBtn: { marginRight: 15 },
  backText: { color: '#f59e0b', fontSize: 16, fontWeight: 'bold' },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  scroll: { flex: 1, padding: 20 },
  card: { backgroundColor: '#1e293b', padding: 20, borderRadius: 16, marginBottom: 20 },
  type: { color: '#f59e0b', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  status: { color: '#94a3b8', fontSize: 14, marginBottom: 8 },
  reward: { color: '#10b981', fontSize: 16, fontWeight: 'bold', marginBottom: 12 },
  desc: { color: '#cbd5e1', fontSize: 14, fontStyle: 'italic' },
  actions: { marginBottom: 30, gap: 10 },
  btnPrimary: { backgroundColor: '#f59e0b', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnDanger: { backgroundColor: '#ef4444', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnSuccess: { backgroundColor: '#10b981', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#000', fontSize: 16, fontWeight: 'bold' },
  chatSection: { marginBottom: 40 },
  chatTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold', marginBottom: 15 },
  msgWrapper: { maxWidth: '80%', padding: 12, borderRadius: 16, marginBottom: 10 },
  msgMine: { alignSelf: 'flex-end', backgroundColor: '#f59e0b', borderBottomRightRadius: 4 },
  msgTheirs: { alignSelf: 'flex-start', backgroundColor: '#334155', borderBottomLeftRadius: 4 },
  msgText: { color: '#fff', fontSize: 15 },
  inputArea: { flexDirection: 'row', padding: 15, backgroundColor: '#1e293b', paddingBottom: Platform.OS === 'ios' ? 30 : 15 },
  chatInput: { flex: 1, backgroundColor: '#0f172a', color: '#fff', paddingHorizontal: 15, paddingVertical: 12, borderRadius: 20, marginRight: 10 },
  sendBtn: { width: 50, height: 50, backgroundColor: '#f59e0b', borderRadius: 25, justifyContent: 'center', alignItems: 'center' },
  sendText: { fontSize: 20, color: '#000' }
});
