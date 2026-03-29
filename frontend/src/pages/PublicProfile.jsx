import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import client from '../api/client';
import StarRating from '../components/StarRating';

const SERVICES = {
  battery: { icon: '🔋', label: 'Прикурювання' },
  fuel: { icon: '⛽', label: 'Долив пального' },
  tire_pump: { icon: '💨', label: 'Підкачка колеса' },
  tire_change: { icon: '🔧', label: 'Заміна колеса' },
  tow: { icon: '⛓️', label: 'Буксирування' },
  repair: { icon: '🛠️', label: 'Дрібний ремонт' },
  tools: { icon: '🧰', label: 'Інструменти' },
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

export default function PublicProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    client.get(`/users/${id}`)
      .then(res => setProfile(res.data))
      .catch(err => setError(err.response?.data?.error || 'Помилка завантаження профілю'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="container page" style={{ textAlign: 'center', marginTop: 40 }}><div className="spinner" /></div>;
  if (error) return <div className="container page"><div className="glass" style={{ padding: 20, color: 'var(--color-danger)' }}>{error}</div></div>;
  if (!profile) return null;

  const servicesText = (profile.services_offered || []).map(s => SERVICES[s]).filter(Boolean);

  return (
    <div className="container page fade-in" style={{ paddingBottom: 60 }}>
      {/* Top action bar */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Назад</button>
        <div style={{ fontWeight: 800, fontSize: 18, margin: 0 }}>Профіль водія</div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 16 }}>
        
        {/* Main Info */}
        <div className="glass" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div className="avatar" style={{ width: 80, height: 80, fontSize: 32, marginBottom: 12 }}>
            {profile.name?.[0]?.toUpperCase() || '?'}
          </div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>{profile.name}</h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8 }}>
            <span style={{ fontSize: 18, color: 'var(--color-primary)' }}>⭐</span>
            <span style={{ fontSize: 18, fontWeight: 700 }}>{profile.rating != null ? Number(profile.rating).toFixed(1) : '—'}</span>
            <span style={{ color: 'var(--color-text-3)', fontSize: 13 }}>(Рейтинг)</span>
          </div>

          <div style={{ display: 'flex', gap: 16, marginTop: 20, width: '100%', justifyContent: 'center' }}>
            <div style={{ background: 'var(--color-surface)', padding: '12px 20px', borderRadius: 12, flex: 1, maxWidth: 140 }}>
              <div style={{ color: 'var(--color-text-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Допоміг</div>
              <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--color-success)' }}>{profile.help_count}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>разів</div>
            </div>
            {profile.car_brand && (
              <div style={{ background: 'var(--color-surface)', padding: '12px 20px', borderRadius: 12, flex: 1, maxWidth: 140 }}>
                <div style={{ color: 'var(--color-text-3)', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Машина</div>
                <div style={{ fontSize: 24, color: 'var(--color-text)' }}>🚘</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text)' }}>
                   {profile.car_color} {profile.car_brand}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Services */}
        {servicesText.length > 0 && (
          <div className="glass" style={{ padding: '20px' }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>🛠️ Чим може допомогти</h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {servicesText.map(s => (
                <div key={s.label} style={{ background: 'var(--color-surface)', padding: '6px 12px', borderRadius: 20, fontSize: 13, border: '1px solid var(--color-border)' }}>
                  {s.icon} {s.label}
                </div>
              ))}
              {profile.has_tow_hook && (
                <div style={{ background: 'rgba(239,68,68,0.1)', color: '#ef4444', padding: '6px 12px', borderRadius: 20, fontSize: 13, border: '1px solid rgba(239,68,68,0.3)', fontWeight: 600 }}>
                  ⛓️ Є фаркоп
                </div>
              )}
            </div>
          </div>
        )}

        {/* Reviews */}
        <div className="glass" style={{ padding: '20px' }}>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 16 }}>💬 Відгуки ({profile.reviews?.length || 0})</h3>
          
          {profile.reviews?.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {profile.reviews.map(review => (
                <div key={review.id} style={{ background: 'var(--color-surface)', padding: 16, borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div className="avatar" style={{ width: 24, height: 24, fontSize: 10 }}>{review.from_user?.name?.[0] || '?'}</div>
                      <span style={{ fontSize: 14, fontWeight: 600 }}>{review.from_user?.name}</span>
                    </div>
                    <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{timeAgo(review.created_at)}</span>
                  </div>
                  <div>
                    <StarRating value={review.score} readonly size={14} />
                  </div>
                  <div style={{ marginTop: 8, fontSize: 14, color: 'var(--color-text-2)', lineHeight: 1.5, fontStyle: 'italic' }}>
                    "{review.comment}"
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: 20, color: 'var(--color-text-3)', fontSize: 14 }}>
              Поки що немає текстових відгуків.
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
