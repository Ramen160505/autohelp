import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import StarRating from '../components/StarRating';
import CarSelector from '../components/CarSelector';

const SERVICES = [
  { key: 'battery', icon: '🔋', label: 'Прикурювання' },
  { key: 'fuel', icon: '⛽', label: 'Долив пального' },
  { key: 'tire_pump', icon: '💨', label: 'Підкачка колеса' },
  { key: 'tire_change', icon: '🔧', label: 'Заміна колеса' },
  { key: 'tow', icon: '⛓️', label: 'Буксирування (до 5 км)' },
  { key: 'repair', icon: '🛠️', label: 'Дрібний ремонт' },
  { key: 'tools', icon: '🧰', label: 'Інструменти' },
];

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: '', car_brand: '', car_model: '', has_tow_hook: false });
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [stats, setStats] = useState({ as_requester: [], as_helper: [] });

  useEffect(() => {
    if (user) {
      setForm({ 
        name: user.name || '', 
        car_brand: user.car_brand || '', 
        car_model: user.car_model || '', 
        car_color: user.car_color || '',
        car_plate: user.car_plate || '',
        has_tow_hook: user.has_tow_hook || false 
      });
      setServices(user.services_offered || []);
    }
  }, [user]);

  useEffect(() => {
    client.get('/requests/my').then(res => setStats(res.data)).catch(() => {});
  }, []);

  const toggleService = (key) => {
    setServices(prev => prev.includes(key) ? prev.filter(s => s !== key) : [...prev, key]);
  };

  const handleSave = async (e) => {
    e.preventDefault(); setLoading(true); setError(''); setSuccess('');
    try {
      const res = await client.put('/users/me', { ...form, services_offered: services });
      updateUser(res.data);
      setSuccess('Профіль збережено ✓');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
    } finally { setLoading(false); }
  };

  const totalHelps = stats.as_helper?.filter(r => r.status === 'completed').length || 0;
  const totalRequests = stats.as_requester?.length || 0;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      <h1 style={{ fontSize: 24, fontWeight: 800, marginBottom: 24 }}>👤 Мій профіль</h1>

      {/* Stats row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Рейтинг', value: user?.rating?.toFixed(1) || '—', icon: '⭐', color: '#f59e0b' },
          { label: 'Допоміг разів', value: totalHelps, icon: '🤝', color: '#10b981' },
          { label: 'Моїх заявок', value: totalRequests, icon: '📋', color: '#6366f1' },
        ].map(s => (
          <div key={s.label} className="glass" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 28, marginBottom: 4 }}>{s.icon}</div>
            <div style={{ fontSize: 26, fontWeight: 800, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <form onSubmit={handleSave}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Avatar & name */}
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center', marginBottom: 16 }}>
              <div className="avatar avatar-lg">{user?.name?.[0]?.toUpperCase()}</div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 18 }}>{user?.name}</div>
                <div style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{user?.phone}</div>
                <div style={{ display: 'flex', gap: 6, marginTop: 6, alignItems: 'center' }}>
                  <StarRating value={Math.round(user?.rating || 0)} readonly size={16} />
                  <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{user?.rating?.toFixed(1) || '—'}</span>
                </div>
              </div>
            </div>

              <div className="input-group">
                <label className="input-label">Ім'я</label>
                <input className="input" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>
            </div>
            
            <div style={{ padding: '16px 0', borderTop: '1px solid var(--color-border)', borderBottom: '1px solid var(--color-border)', margin: '16px 0' }}>
              <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 16 }}>🚘 Мій Гараж</div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <CarSelector
                  brand={form.car_brand}
                  model={form.car_model}
                  onBrandChange={v => setForm(f => ({ ...f, car_brand: v, car_model: '' }))}
                  onModelChange={v => setForm(f => ({ ...f, car_model: v }))}
                />
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>Колір авто</label>
                    <input className="input" placeholder="Напр. Сріблястий" value={form.car_color || ''} onChange={e => setForm(f => ({ ...f, car_color: e.target.value }))} />
                  </div>
                  <div className="input-group">
                    <label className="input-label" style={{ fontSize: 11 }}>Держ. номер</label>
                    <input className="input" placeholder="AA1234PA" value={form.car_plate || ''} onChange={e => setForm(f => ({ ...f, car_plate: e.target.value.toUpperCase() }))} />
                  </div>
                </div>

                <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginTop: 8 }}>
                  <input type="checkbox" checked={form.has_tow_hook} onChange={e => setForm(f => ({ ...f, has_tow_hook: e.target.checked }))}
                    style={{ width: 18, height: 18, accentColor: 'var(--color-primary)' }} />
                  <span style={{ fontSize: 14 }}>⛓️ Є фаркоп (можу буксирувати)</span>
                </label>
              </div>
            </div>

          {/* Services */}
          <div className="glass" style={{ padding: 20 }}>
            <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 15 }}>🛠️ Які послуги надаю</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {SERVICES.map(s => (
                <button key={s.key} type="button" onClick={() => toggleService(s.key)}
                  className="btn btn-sm"
                  style={{
                    background: services.includes(s.key) ? 'rgba(245,158,11,0.15)' : 'var(--color-surface)',
                    border: services.includes(s.key) ? '1px solid var(--color-primary)' : '1px solid var(--color-border)',
                    color: services.includes(s.key) ? 'var(--color-primary)' : 'var(--color-text-2)',
                  }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
          </div>

          {success && <div style={{ padding: '10px 14px', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', borderRadius: 8, color: 'var(--color-success)', fontSize: 14 }}>{success}</div>}
          {error && <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--color-danger)', fontSize: 14 }}>{error}</div>}

          <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Зберігаємо...</> : '💾 Зберегти профіль'}
          </button>
        </div>
      </form>

      {/* Telegram Link */}
      <div className="glass" style={{ padding: 20, marginTop: 24 }}>
        <div style={{ fontWeight: 700, marginBottom: 14, fontSize: 18, display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: '#0088cc', fontSize: 24 }}>✈️</span> Сповіщення Telegram
        </div>
        
        {user?.telegram_id ? (
          <div style={{ padding: 16, background: 'rgba(16,185,129,0.1)', borderRadius: 12, border: '1px solid rgba(16,185,129,0.3)' }}>
            <div style={{ color: '#10b981', fontWeight: 600, marginBottom: 8 }}>✅ Telegram підключено!</div>
            <div style={{ fontSize: 14, color: 'var(--color-text-2)', marginBottom: 16 }}>Ви отримуєте сповіщення про нові поломки поруч з вами у свій месенджер.</div>
            <button onClick={async () => {
              if (window.confirm('Ви впевнені, що хочете відключити сповіщення?')) {
                await client.delete('/users/telegram-link');
                updateUser({ ...user, telegram_id: null });
              }
            }} className="btn btn-ghost btn-sm">Відключити</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p style={{ fontSize: 14, color: 'var(--color-text-2)', margin: 0 }}>Підключіть Telegram бота, щоб миттєво отримувати сповіщення, коли комусь знадобиться ваша допомога поруч.</p>
            <button onClick={async () => {
              const res = await client.post('/users/telegram-link');
              const link = `https://t.me/${res.data.bot_username}?start=${res.data.token}`;
              window.open(link, '_blank');
              setTimeout(() => window.location.reload(), 5000); // Reload after some time to see connected state
            }} className="btn" style={{ background: '#0088cc', color: '#fff' }}>
              Відкрити бота та підключити
            </button>
          </div>
        )}
      </div>

    </div>
  );
}
