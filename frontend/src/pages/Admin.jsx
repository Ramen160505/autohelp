import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import { formatDistanceToNow } from 'date-fns';
import { uk } from 'date-fns/locale';

const TYPE_LABELS = { battery: '🔋 Акумулятор', fuel: '⛽ Пальне', tire: '🔧 Колесо', tow: '⛓️ Буксир', other: '❓ Інше' };
const STATUS_LABELS = { active: '🟢 Активна', taken: '🟡 В процесі', completed: '✅ Завершена', cancelled: '🔴 Скасована' };

export default function Admin() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.is_admin) { navigate('/'); return; }
    Promise.all([
      client.get('/admin/users'),
      client.get('/admin/requests'),
      client.get('/admin/complaints'),
    ]).then(([u, r, c]) => {
      setUsers(u.data); setRequests(r.data); setComplaints(c.data);
    }).finally(() => setLoading(false));
  }, []);

  const resolveComplaint = async (id, status) => {
    await client.put(`/admin/complaints/${id}`, { status });
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status } : c));
  };

  if (loading) return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><div className="spinner" style={{ width: 40, height: 40 }} /></div>;

  const pendingComplaints = complaints.filter(c => c.status === 'pending').length;

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 24, fontWeight: 800 }}>🛡️ Адмін-панель</h1>
        <p style={{ color: 'var(--color-text-2)', marginTop: 4 }}>Управління платформою AutoHelp</p>
      </div>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Користувачів', value: users.length, icon: '👥', color: '#6366f1' },
          { label: 'Всього заявок', value: requests.length, icon: '📋', color: '#f59e0b' },
          { label: 'Активних', value: requests.filter(r => r.status === 'active').length, icon: '🟢', color: '#10b981' },
          { label: 'Скарг', value: pendingComplaints, icon: '⚑', color: pendingComplaints > 0 ? '#ef4444' : '#64748b' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 26, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'var(--color-surface)', padding: 4, borderRadius: 12, border: '1px solid var(--color-border)', width: 'fit-content' }}>
        {[
          { key: 'users', label: `👥 Користувачі` },
          { key: 'requests', label: `📋 Заявки` },
          { key: 'complaints', label: `⚑ Скарги ${pendingComplaints > 0 ? `(${pendingComplaints})` : ''}` },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className="btn btn-sm"
            style={{ background: tab === t.key ? 'var(--color-primary)' : 'transparent', color: tab === t.key ? '#000' : 'var(--color-text-2)', border: 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Users */}
      {tab === 'users' && (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                {['Ім\'я', 'Телефон', 'Авто', 'Рейтинг', 'Допомог', 'Рег.'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <div className="avatar avatar-sm">{u.name?.[0]}</div>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14 }}>{u.name}</div>
                        {u.is_admin && <span style={{ fontSize: 10, background: 'rgba(245,158,11,0.15)', color: 'var(--color-primary)', padding: '1px 6px', borderRadius: 4 }}>ADMIN</span>}
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-2)' }}>{u.phone}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-2)' }}>{u.car_brand} {u.car_model}</td>
                  <td style={{ padding: '12px 16px' }}><span style={{ color: '#f59e0b', fontWeight: 700 }}>⭐ {u.rating?.toFixed(1) || '—'}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 14, fontWeight: 600, color: 'var(--color-success)' }}>{u.help_count}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)' }}>
                    {formatDistanceToNow(new Date(u.created_at), { addSuffix: true, locale: uk })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Requests */}
      {tab === 'requests' && (
        <div className="glass" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-surface)' }}>
                {['Тип', 'Статус', 'Винагорода', 'Координати', 'Дата', 'Дії'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--color-text-2)', textTransform: 'uppercase', letterSpacing: 0.5 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {requests.map((r, i) => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--color-border)', background: i % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{TYPE_LABELS[r.type]}</td>
                  <td style={{ padding: '12px 16px' }}><span className={`badge badge-${r.status}`}>{STATUS_LABELS[r.status]}</span></td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: 'var(--color-text-2)' }}>
                    {r.reward_type === 'free' ? '🎁 Безкоштовно' : r.reward_type === 'fixed' ? `💰 ${r.reward_amount} грн` : '🤝 Домовленість'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)' }}>{r.latitude?.toFixed(4)}, {r.longitude?.toFixed(4)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 12, color: 'var(--color-text-3)' }}>
                    {formatDistanceToNow(new Date(r.created_at), { addSuffix: true, locale: uk })}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => navigate(`/request/${r.id}`)}>→ Переглянути</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Complaints */}
      {tab === 'complaints' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {complaints.length === 0 && (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--color-text-3)' }}>✅ Скарг немає</div>
          )}
          {complaints.map(c => (
            <div key={c.id} className="glass" style={{ padding: 16, borderLeft: `3px solid ${c.status === 'pending' ? '#ef4444' : '#64748b'}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                <div>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                    <span className={`badge badge-${c.status === 'pending' ? 'active' : c.status === 'resolved' ? 'completed' : 'cancelled'}`}>
                      {c.status === 'pending' ? '⏳ Нова' : c.status === 'resolved' ? '✅ Вирішена' : '✗ Відхилена'}
                    </span>
                    <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>
                      {formatDistanceToNow(new Date(c.created_at), { addSuffix: true, locale: uk })}
                    </span>
                  </div>
                  <p style={{ fontSize: 14, lineHeight: 1.5 }}>{c.reason}</p>
                  <div style={{ fontSize: 12, color: 'var(--color-text-3)', marginTop: 6 }}>ID заявки: {c.request_id || '—'}</div>
                </div>
                {c.status === 'pending' && (
                  <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-success btn-sm" onClick={() => resolveComplaint(c.id, 'resolved')}>✓ Вирішити</button>
                    <button className="btn btn-danger btn-sm" onClick={() => resolveComplaint(c.id, 'rejected')}>✗ Відхилити</button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
