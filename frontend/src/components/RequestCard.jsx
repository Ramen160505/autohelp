import { useNavigate } from 'react-router-dom';

const TYPE_CONFIG = {
  battery: { icon: '🔋', label: 'Акумулятор', color: '#f59e0b' },
  fuel:    { icon: '⛽', label: 'Пальне',     color: '#3b82f6' },
  tire:    { icon: '🔧', label: 'Колесо',     color: '#8b5cf6' },
  tow:     { icon: '⛓️', label: 'Буксир',     color: '#ef4444' },
  other:   { icon: '❓', label: 'Інше',       color: '#64748b' },
};

const REWARD_LABELS = {
  free: '🎁 Безкоштовно',
  fixed: '💰 Фікс. сума',
  negotiable: '🤝 За домовленістю',
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

export default function RequestCard({ request, showDistance }) {
  const navigate = useNavigate();
  const cfg = TYPE_CONFIG[request.type] || TYPE_CONFIG.other;

  return (
    <div
      className="glass fade-in"
      onClick={() => navigate(`/request/${request.id}`)}
      style={{ padding: 16, cursor: 'pointer', transition: 'all 0.2s', borderLeft: `3px solid ${cfg.color}` }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-card)'; }}
      onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {/* Type icon */}
        <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: `${cfg.color}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
          {cfg.icon}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <span style={{ fontWeight: 700, fontSize: 15, color: cfg.color }}>{cfg.label}</span>
            <span className={`badge badge-${request.status}`}>
              {request.status === 'active' ? '● Активна' : request.status === 'taken' ? '⏳ В процесі' : request.status === 'completed' ? '✓ Завершена' : '✗ Скасована'}
            </span>
          </div>

          {/* User */}
          {request.user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
              <div className="avatar" style={{ width: 22, height: 22, fontSize: 10 }}>{request.user.name?.[0] || '?'}</div>
              <span style={{ fontSize: 13, color: 'var(--color-text-2)' }}>{request.user.name}</span>
              <span style={{ fontSize: 12, color: 'var(--color-primary)' }}>⭐ {request.user.rating != null ? Number(request.user.rating).toFixed(1) : '—'}</span>
            </div>
          )}

          {/* Description */}
          {request.description && (
            <p style={{ fontSize: 13, color: 'var(--color-text-2)', marginTop: 6, lineHeight: 1.4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {request.description}
            </p>
          )}

          {/* Footer */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginTop: 8, flexWrap: 'wrap' }}>
            <span className={`badge badge-${request.reward_type}`} style={{ fontSize: 11 }}>
              {REWARD_LABELS[request.reward_type] || '🤝'}
              {request.reward_type === 'fixed' && request.reward_amount ? ` ${request.reward_amount} грн` : ''}
            </span>
            {showDistance && <span style={{ fontSize: 12, color: 'var(--color-text-3)' }}>📍 {showDistance} км</span>}
            <span style={{ fontSize: 12, color: 'var(--color-text-3)', marginLeft: 'auto' }}>⏰ {timeAgo(request.created_at || request.createdAt)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
