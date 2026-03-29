import { useState, useEffect } from 'react';
import client from '../api/client';
import { useNavigate } from 'react-router-dom';

export default function Leaderboard() {
  const [leaders, setLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    client.get('/users/leaderboard')
      .then(res => setLeaders(res.data))
      .catch(err => console.error('Failed to load leaderboard', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="container page fade-in">
      <div style={{ display: 'flex', gap: 10, marginBottom: 20, alignItems: 'center' }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Назад</button>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800 }}>🏆 Зал Слави</h1>
      </div>

      <div className="glass" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '20px', background: 'var(--color-bg-2)', borderBottom: '1px solid var(--color-border)' }}>
          <h2 style={{ fontSize: 16, margin: 0, color: 'var(--color-text-2)' }}>ТОП-10 Водіїв Міста за Кармою</h2>
        </div>
        
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center' }}>Завантаження...</div>
        ) : leaders.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--color-text-3)' }}>Ще немає даних.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {leaders.map((user, index) => {
              let badge = null;
              if (index === 0) badge = <span style={{ fontSize: 24 }} title="1 місце">🥇</span>;
              else if (index === 1) badge = <span style={{ fontSize: 24 }} title="2 місце">🥈</span>;
              else if (index === 2) badge = <span style={{ fontSize: 24 }} title="3 місце">🥉</span>;
              else badge = <span style={{ fontSize: 18, width: 32, textAlign: 'center', color: 'var(--color-text-3)', fontWeight: 'bold' }}>#{index + 1}</span>;

              return (
                <div key={user.id} 
                  onClick={() => navigate(`/u/${user.id}`)}
                  style={{ 
                  display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px', 
                  borderBottom: '1px solid var(--color-border)',
                  background: index === 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent',
                  cursor: 'pointer', transition: 'background 0.2s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = index === 0 ? 'rgba(245, 158, 11, 0.1)' : 'var(--color-surface)'}
                  onMouseLeave={e => e.currentTarget.style.background = index === 0 ? 'rgba(245, 158, 11, 0.05)' : 'transparent'}
                >
                  <div style={{ width: 40, display: 'flex', justifyContent: 'center' }}>{badge}</div>
                  
                  <div className="avatar" style={{ width: 48, height: 48, fontSize: 18 }}>
                    {user.name?.[0] || '?'}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 700, fontSize: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                      {user.name}
                      {user.car_brand && (
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--color-text-3)', background: 'var(--color-surface)', padding: '2px 8px', borderRadius: 4 }}>
                          {user.car_brand} {user.car_model}
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 4 }}>
                      <span className="text-primary">⭐ {Number(user.rating).toFixed(1)}</span>
                      <span style={{ margin: '0 8px' }}>•</span>
                      <span>🤝 Допоміг {user.help_count} разів</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
