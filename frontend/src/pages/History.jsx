import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import client from '../api/client';

const TYPE_CONFIG = {
  battery: { icon: '🔋', label: 'Акумулятор', color: '#f59e0b' },
  fuel:    { icon: '⛽', label: 'Пальне',     color: '#3b82f6' },
  tire:    { icon: '🔧', label: 'Колесо',     color: '#8b5cf6' },
  tow:     { icon: '⛓️', label: 'Буксир',     color: '#ef4444' },
  other:   { icon: '❓', label: 'Інше',       color: '#64748b' },
};

const STATUS_LABELS = {
  active: '🟢 Активна',
  taken: '🟡 В процесі',
  completed: '✅ Завершена',
  cancelled: '🔴 Скасована',
};

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

export default function History() {
  const navigate = useNavigate();
  const [tab, setTab] = useState('requester');
  const [data, setData] = useState({ as_requester: [], as_helper: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    client.get('/requests/my')
      .then(res => setData(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const list = tab === 'requester' ? (data.as_requester || []) : (data.as_helper || []);

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 20 }}>📋 Моя історія</h1>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--color-border)' }}>
        {[
          { key: 'requester', label: `🆘 Мої заявки (${data.as_requester?.length || 0})` },
          { key: 'helper', label: `🤝 Де допомагав (${data.as_helper?.length || 0})` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="btn btn-sm"
            style={{ flex: 1, background: tab === t.key ? 'var(--color-primary)' : 'transparent', color: tab === t.key ? '#000' : 'var(--color-text-2)', border: 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>}

      {!loading && list.length === 0 && (
        <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-3)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>{tab === 'requester' ? '📋' : '🤝'}</div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>
            {tab === 'requester' ? 'Заявок ще не було' : 'Ви ще нікому не допомагали'}
          </div>
          <div style={{ fontSize: 13, marginTop: 6 }}>
            {tab === 'requester' ? 'Потрапили в неприємність? Натисніть "+ Потрібна допомога"' : 'Перевірте карту — можливо, хтось поряд потребує допомоги!'}
          </div>
          {tab === 'requester' && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/create')}>
              ＋ Створити заявку
            </button>
          )}
          {tab === 'helper' && (
            <button className="btn btn-primary btn-sm" style={{ marginTop: 16 }} onClick={() => navigate('/')}>
              🗺️ Переглянути карту
            </button>
          )}
        </div>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {list.map(req => {
          const cfg = TYPE_CONFIG[req.type] || TYPE_CONFIG.other;
          const dateStr = req.created_at || req.createdAt;
          const completedStr = req.completed_at || req.completedAt;
          return (
            <div
              key={req.id}
              className="glass"
              style={{ padding: 16, cursor: 'pointer', borderLeft: `3px solid ${cfg.color}`, transition: 'all 0.2s' }}
              onClick={() => navigate(`/request/${req.id}`)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <span style={{ fontSize: 28 }}>{cfg.icon}</span>
                  <div>
                    <div style={{ fontWeight: 700 }}>{cfg.label}</div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 2 }}>{timeAgo(dateStr)}</div>
                    {req.description && (
                      <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 2, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {req.description}
                      </div>
                    )}
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
                  <span className={`badge badge-${req.status}`}>{STATUS_LABELS[req.status] || req.status}</span>
                  {req.status === 'completed' && completedStr && (
                    <span style={{ fontSize: 11, color: 'var(--color-text-3)' }}>✅ {timeAgo(completedStr)}</span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
