import { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';

// Simple Ukrainian time formatter — no date-fns dependency
function timeAgo(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'щойно';
    if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
    return `${Math.floor(diff / 86400)} дн тому`;
  } catch {
    return '';
  }
}

export default function ChatPanel({ requestId, otherUser, status }) {
  const { user } = useAuth();
  const socket = useSocket();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [joined, setJoined] = useState(false); // ✅ prevent race condition
  const endRef = useRef(null);

  useEffect(() => {
    if (!socket || !requestId || !user) return;
    setJoined(false);

    socket.emit('join_chat', { request_id: requestId, user_id: user.id });

    const onHistory = (history) => {
      setMessages(Array.isArray(history) ? history : []);
      setJoined(true); // ✅ room confirmed, safe to send
    };
    const onNewMessage = (msg) => setMessages(prev => [...prev, msg]);
    const onArrived = () => {
      setMessages(prev => [...prev, {
        id: 'arrived-' + Date.now(), type: 'system',
        content: `🚗 ${otherUser?.name || 'Помічник'} прибув на місце!`,
        created_at: new Date().toISOString(),
      }]);
    };
    const onCompleted = () => {
      setMessages(prev => [...prev, {
        id: 'done-' + Date.now(), type: 'system',
        content: '✅ Допомогу завершено!',
        created_at: new Date().toISOString(),
      }]);
    };

    socket.on('message_history', onHistory);
    socket.on('new_message', onNewMessage);
    socket.on('helper_arrived', onArrived);
    socket.on('completed', onCompleted);

    return () => {
      socket.off('message_history', onHistory);
      socket.off('new_message', onNewMessage);
      socket.off('helper_arrived', onArrived);
      socket.off('completed', onCompleted);
    };
  }, [socket, requestId, user?.id]);


  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!text.trim() || !socket || !user) return;
    socket.emit('send_message', {
      request_id: requestId,
      sender_id: user.id,
      content: text.trim(),
      type: 'text',
    });
    setText('');
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const renderMessage = (msg) => {
    try {
      // System message
      if (msg.type === 'system') {
        return (
          <div key={msg.id} style={{ textAlign: 'center', fontSize: 13, color: 'var(--color-success)', padding: '8px 16px', background: 'rgba(16,185,129,0.08)', borderRadius: 8 }}>
            {msg.content}
          </div>
        );
      }

      const isMe = msg.sender_id === user?.id;
      const senderName = msg.sender?.name || otherUser?.name || '?';
      const dateStr = msg.created_at || msg.createdAt || '';

      return (
        <div key={msg.id} style={{ display: 'flex', justifyContent: isMe ? 'flex-end' : 'flex-start', gap: 8, animation: 'fadeIn 0.2s ease' }}>
          {!isMe && (
            <div className="avatar avatar-sm" style={{ flexShrink: 0, alignSelf: 'flex-end' }}>
              {senderName[0] || '?'}
            </div>
          )}
          <div style={{ maxWidth: '72%' }}>
            {!isMe && (
              <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginBottom: 3, marginLeft: 2 }}>
                {senderName}
              </div>
            )}
            <div style={{
              padding: '10px 14px',
              borderRadius: isMe ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
              background: isMe ? 'linear-gradient(135deg, #f59e0b, #d97706)' : 'var(--color-bg-3)',
              color: isMe ? '#000' : 'var(--color-text)',
              fontSize: 14, lineHeight: 1.5,
              border: isMe ? 'none' : '1px solid var(--color-border)',
              wordBreak: 'break-word',
            }}>
              {msg.content}
            </div>
            <div style={{ fontSize: 11, color: 'var(--color-text-3)', marginTop: 3, textAlign: isMe ? 'right' : 'left', marginRight: isMe ? 2 : 0, marginLeft: isMe ? 0 : 2 }}>
              {timeAgo(dateStr)}
            </div>
          </div>
        </div>
      );
    } catch (err) {
      console.error('Message render error:', err, msg);
      return null;
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', color: 'var(--color-text-3)', padding: '32px 0', fontSize: 14 }}>
            💬 Напишіть першим — домовтесь про деталі
          </div>
        )}
        {messages.map(renderMessage)}
        <div ref={endRef} />
      </div>

      {/* Input */}
      {status === 'taken' && (
        <div style={{ padding: '12px 16px', borderTop: '1px solid var(--color-border)', display: 'flex', gap: 8 }}>
          <input
            className="input"
            style={{ flex: 1, padding: '10px 14px' }}
            placeholder={joined ? 'Напишіть повідомлення... (Enter = надіслати)' : 'Підключення до чату...'}
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={handleKey}
            disabled={!joined}
          />
          <button
            className="btn btn-primary"
            onClick={sendMessage}
            disabled={!text.trim() || !joined}
            style={{ padding: '10px 18px', minWidth: 54, fontSize: 18 }}
          >➤</button>
        </div>
      )}

      {status !== 'taken' && (
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--color-border)', textAlign: 'center', fontSize: 13, color: 'var(--color-text-3)' }}>
          {status === 'completed' ? '✅ Допомогу завершено' : status === 'cancelled' ? '✗ Заявка скасована' : '👋 Очікуємо помічника...'}
        </div>
      )}
    </div>
  );
}
