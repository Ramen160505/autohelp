import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import ChatPanel from '../components/ChatPanel';
import StarRating from '../components/StarRating';

const TYPE_CONFIG = {
  battery: { icon: '🔋', label: 'Акумулятор', color: '#f59e0b' },
  fuel:    { icon: '⛽', label: 'Пальне',     color: '#3b82f6' },
  tire:    { icon: '🔧', label: 'Колесо',     color: '#8b5cf6' },
  tow:     { icon: '⛓️', label: 'Буксир',     color: '#ef4444' },
  other:   { icon: '❓', label: 'Інше',       color: '#64748b' },
};

const REWARD_LABELS = { free: '🎁 Безкоштовно', fixed: '💰 Фіксована сума', negotiable: '🤝 За домовленістю' };
const STATUS_LABELS = { active: '🟢 Активна', taken: '🟡 В процесі', completed: '✅ Завершена', cancelled: '🔴 Скасована' };

function timeAgo(dateStr) {
  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const diff = Math.floor((Date.now() - date.getTime()) / 1000);
    if (diff < 60) return 'щойно';
    if (diff < 3600) return `${Math.floor(diff / 60)} хв тому`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} год тому`;
    return `${Math.floor(diff / 86400)} дн тому`;
  } catch { return ''; }
}

export default function RequestDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [request, setRequest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showRating, setShowRating] = useState(false);
  const [ratingScore, setRatingScore] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);
  const [showComplaint, setShowComplaint] = useState(false);
  const [complaintReason, setComplaintReason] = useState('');
  const [notification, setNotification] = useState('');

  const fetchRequest = async () => {
    try {
      const res = await client.get(`/requests/${id}`);
      setRequest(res.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Заявку не знайдено');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRequest(); }, [id]);

  // ✅ Real-time socket listeners for status changes
  useEffect(() => {
    if (!socket || !id) return;

    const onRequestTaken = ({ request_id, helper_name }) => {
      if (request_id !== id) return;
      setNotification(`🤝 ${helper_name || 'Помічник'} відгукнувся на вашу заявку!`);
      fetchRequest(); // Refresh to show helper + open chat
    };

    const onCompleted = ({ request_id }) => {
      if (request_id !== id) return;
      fetchRequest();
    };

    socket.on('request_taken', onRequestTaken);
    socket.on('completed', onCompleted);

    return () => {
      socket.off('request_taken', onRequestTaken);
      socket.off('completed', onCompleted);
    };
  }, [socket, id]);

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 12 }}>⚠️</div>
        <div style={{ color: 'var(--color-danger)', fontSize: 16 }}>{error}</div>
        <button className="btn btn-ghost btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/')}>← На головну</button>
      </div>
    );
  }

  if (!request) return null;

  const cfg = TYPE_CONFIG[request.type] || TYPE_CONFIG.other;
  const isOwner = request.user_id === user?.id;
  const isHelper = request.helper_id === user?.id;

  const canTake = request.status === 'active' && !isOwner;
  const canComplete = request.status === 'taken' && (isOwner || isHelper);
  const canCancel = request.status === 'active' && isOwner;
  const canRate = request.status === 'completed' && (isOwner || isHelper) && !ratingDone;
  const rateTarget = isOwner ? request.helper : request.user;

  const mapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${request.latitude},${request.longitude}`;
  const wazeUrl = `https://waze.com/ul?ll=${request.latitude},${request.longitude}&navigate=yes`;

  const handleTake = async () => {
    setActionLoading(true);
    try {
      await client.put(`/requests/${id}/take`);
      await fetchRequest();
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally { setActionLoading(false); }
  };

  const handleComplete = async () => {
    setActionLoading(true);
    try {
      await client.put(`/requests/${id}/complete`);
      await fetchRequest();
      setShowRating(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally { setActionLoading(false); }
  };

  const handleCancel = async () => {
    if (!window.confirm('Скасувати заявку?')) return;
    setActionLoading(true);
    try {
      await client.put(`/requests/${id}/cancel`);
      navigate('/');
    } catch { setActionLoading(false); }
  };

  const handleRate = async () => {
    if (!ratingScore || !rateTarget) return;
    try {
      await client.post('/ratings', { request_id: id, to_user_id: rateTarget.id, score: ratingScore, comment: ratingComment });
      setRatingDone(true);
      setShowRating(false);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка оцінки');
    }
  };

  const handleComplaint = async () => {
    if (!complaintReason) return;
    const targetUser = isOwner ? request.helper : request.user;
    try {
      await client.post('/complaints', { reported_user_id: targetUser?.id, request_id: id, reason: complaintReason });
      setShowComplaint(false);
      alert('Скаргу подано. Дякуємо!');
    } catch {}
  };

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '20px' }}>
      {/* Notification banner */}
      {notification && (
        <div style={{ marginBottom: 12, padding: '12px 16px', background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 10, color: 'var(--color-success)', fontWeight: 600, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {notification}
          <button onClick={() => setNotification('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: 18 }}>✕</button>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, marginBottom: 16, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Назад</button>
        <button className="btn btn-ghost btn-sm" onClick={fetchRequest} title="Оновити">🔄 Оновити</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, alignItems: 'start' }}>

        {/* ===== Left column ===== */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Header */}
          <div className="glass" style={{ padding: 20, borderLeft: `4px solid ${cfg.color}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center' }}>
                <div style={{ width: 56, height: 56, borderRadius: 14, background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>
                  {cfg.icon}
                </div>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 800 }}>{cfg.label}</h1>
                  <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 2 }}>{timeAgo(request.created_at)}</div>
                </div>
              </div>
              <span className={`badge badge-${request.status}`}>{STATUS_LABELS[request.status] || request.status}</span>
            </div>

            {request.description && (
              <p style={{ marginTop: 14, fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.6, padding: 12, background: 'var(--color-surface)', borderRadius: 8 }}>
                💬 {request.description}
              </p>
            )}

            <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
              <span className={`badge badge-${request.reward_type}`}>
                {REWARD_LABELS[request.reward_type]}
                {request.reward_type === 'fixed' && request.reward_amount ? ` — ${request.reward_amount} грн` : ''}
              </span>
            </div>
          </div>

          {/* Requester */}
          <div className="glass" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>Заявник</div>
            <UserWidget user={request.user} isMe={isOwner} />
          </div>

          {/* Helper */}
          {request.helper ? (
            <div className="glass" style={{ padding: 16, borderLeft: '3px solid var(--color-success)' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>🤝 Помічник</div>
              <UserWidget user={request.helper} isMe={isHelper} />
            </div>
          ) : request.status === 'active' && (
            <div className="glass" style={{ padding: 16, textAlign: 'center', color: 'var(--color-text-3)', fontSize: 13 }}>
              ⏳ Очікуємо помічника...
            </div>
          )}

          {/* Location */}
          <div className="glass" style={{ padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-3)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>📍 Місце поломки (Координати)</div>
            
            <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ flex: 1, background: '#1fb5cf', color: '#fff', border: 'none' }}>
                Поїхали з Waze 🚗
              </a>
              <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="btn btn-sm" style={{ flex: 1, background: '#4285F4', color: '#fff', border: 'none' }}>
                Google Maps 🗺️
              </a>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {error && (
              <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--color-danger)', fontSize: 14 }}>
                ⚠️ {error}
              </div>
            )}

            {canTake && (
              <button className="btn btn-success btn-full" disabled={actionLoading} onClick={handleTake}>
                {actionLoading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Беремо заявку...</> : '🤝 Готовий допомогти!'}
              </button>
            )}
            {canComplete && (
              <button className="btn btn-primary btn-full" disabled={actionLoading} onClick={handleComplete}>
                {actionLoading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Завершуємо...</> : '✅ Завершити допомогу'}
              </button>
            )}
            {canCancel && (
              <button className="btn btn-danger btn-full" disabled={actionLoading} onClick={handleCancel}>
                ✗ Скасувати заявку
              </button>
            )}
            {canRate && (
              <button className="btn btn-primary btn-full" onClick={() => setShowRating(true)}>
                ⭐ Оцінити {isOwner ? 'помічника' : 'заявника'}
              </button>
            )}
            {ratingDone && <div style={{ textAlign: 'center', color: 'var(--color-success)', fontWeight: 600 }}>✅ Дякуємо за оцінку!</div>}
            {(isOwner || isHelper) && request.status !== 'cancelled' && (
              <button className="btn btn-ghost btn-sm" style={{ color: 'var(--color-danger)', fontSize: 12 }} onClick={() => setShowComplaint(true)}>
                ⚑ Поскаржитись
              </button>
            )}
          </div>
        </div>

        {/* ===== Right column — Chat ===== */}
        <div className="glass" style={{ height: 560, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--color-border)', fontWeight: 700, fontSize: 15 }}>
            💬 Чат
          </div>
          {(request.status === 'taken' || request.status === 'completed') ? (
            <ChatPanel
              requestId={id}
              otherUser={isOwner ? request.helper : request.user}
              status={request.status}
            />
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12, color: 'var(--color-text-3)' }}>
              <div style={{ fontSize: 40 }}>💬</div>
              <div style={{ fontSize: 14, textAlign: 'center', maxWidth: 220, lineHeight: 1.6 }}>
                {request.status === 'active'
                  ? 'Чат відкриється після того, як хтось відгукнеться'
                  : 'Заявка скасована'}
              </div>
              {canTake && (
                <button className="btn btn-success" onClick={handleTake} disabled={actionLoading} style={{ marginTop: 8 }}>
                  🤝 Відгукнутися першим!
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showRating && (
        <Modal title="⭐ Оцінити допомогу" onClose={() => setShowRating(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {rateTarget && <UserWidget user={rateTarget} />}
            <div>
              <div style={{ marginBottom: 8, fontSize: 14, color: 'var(--color-text-2)' }}>Ваша оцінка:</div>
              <StarRating value={ratingScore} onChange={setRatingScore} size={32} />
            </div>
            <textarea className="input" style={{ minHeight: 70 }} placeholder="Коментар (необов'язково)" value={ratingComment} onChange={e => setRatingComment(e.target.value)} />
            <button className="btn btn-primary btn-full" disabled={!ratingScore} onClick={handleRate}>Відправити оцінку</button>
          </div>
        </Modal>
      )}

      {/* Complaint Modal */}
      {showComplaint && (
        <Modal title="⚑ Подати скаргу" onClose={() => setShowComplaint(false)}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <textarea className="input" style={{ minHeight: 90 }} placeholder="Опишіть причину скарги..." value={complaintReason} onChange={e => setComplaintReason(e.target.value)} />
            <button className="btn btn-danger btn-full" disabled={!complaintReason} onClick={handleComplaint}>Надіслати скаргу</button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function UserWidget({ user, isMe }) {
  if (!user) return <div style={{ color: 'var(--color-text-3)', fontSize: 14 }}>Не призначено</div>;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <div className="avatar" style={{ width: 46, height: 46, fontSize: 18 }}>{user.name?.[0] || '?'}</div>
      <div>
        <div style={{ fontWeight: 700, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
          {user.name}
          {isMe && <span style={{ fontSize: 11, background: 'rgba(245,158,11,0.15)', color: 'var(--color-primary)', padding: '2px 8px', borderRadius: 4 }}>Ви</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 4, fontSize: 13, color: 'var(--color-text-2)', flexWrap: 'wrap' }}>
          <span>⭐ {user.rating != null ? Number(user.rating).toFixed(1) : '—'}</span>
          {user.car_brand && (
            <span>
              🚘 {user.car_color ? `${user.car_color} ` : ''}{user.car_brand} {user.car_model}
              {user.car_plate ? ` [${user.car_plate}]` : ''}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999, padding: 20 }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="glass scale-in" style={{ width: '100%', maxWidth: 420, padding: 28 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 700 }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)', width: 32, height: 32, borderRadius: 8, cursor: 'pointer', fontSize: 16 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}
