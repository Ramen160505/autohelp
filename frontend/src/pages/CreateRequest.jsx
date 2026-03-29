import { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import client from '../api/client';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const PROBLEM_TYPES = [
  { value: 'battery', icon: '🔋', label: 'Акумулятор', desc: 'Сів акумулятор, потрібно прикурити' },
  { value: 'fuel',    icon: '⛽', label: 'Пальне',     desc: 'Закінчився бензин або дизель' },
  { value: 'tire',    icon: '🔧', label: 'Колесо',     desc: 'Прокол або спущене колесо' },
  { value: 'tow',     icon: '⛓️', label: 'Буксир',     desc: 'Потрібен буксир до 5 км' },
  { value: 'other',   icon: '❓', label: 'Інше',       desc: 'Інша проблема' },
];

function DraggableMarker({ position, setPosition }) {
  useMapEvents({
    click(e) { setPosition([e.latlng.lat, e.latlng.lng]); },
  });
  return position ? (
    <Marker
      position={position}
      draggable={true}
      eventHandlers={{ dragend: (e) => setPosition([e.target.getLatLng().lat, e.target.getLatLng().lng]) }}
    />
  ) : null;
}

// Address search with Nominatim
function AddressSearch({ onSelect }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const timerRef = useRef(null);

  const search = (q) => {
    if (!q || q.length < 3) { setResults([]); setOpen(false); return; }
    setLoading(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=5&countrycodes=ua&addressdetails=1`, {
          headers: { 'Accept-Language': 'uk' },
        });
        const data = await res.json();
        setResults(data);
        setOpen(true);
      } catch { }
      finally { setLoading(false); }
    }, 500);
  };

  return (
    <div style={{ position: 'relative', width: '100%', marginBottom: 12, zIndex: 1000 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          className="input"
          style={{ width: '100%', padding: '12px 14px', fontSize: 14 }}
          placeholder="🔍 Введіть адресу (наприклад: Хрещатик, Київ)"
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onFocus={() => results.length && setOpen(true)}
        />
        {loading && <div className="spinner" style={{ width: 24, height: 24, alignSelf: 'center', position: 'absolute', right: 12, top: 12 }} />}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: '100%', background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 10, marginTop: 4, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)' }}>
          {results.map((r, i) => (
            <button key={i} onMouseDown={() => { onSelect([parseFloat(r.lat), parseFloat(r.lon)]); setQuery(r.display_name.split(',').slice(0, 2).join(',')); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '12px 14px', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', lineHeight: 1.4 }}>
              📍 {r.display_name.split(',').slice(0, 3).join(', ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function FlyToLocation({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 16, { duration: 1.2 });
  }, [pos]);
  return null;
}


export default function CreateRequest() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [type, setType] = useState('');
  const [position, setPosition] = useState(null);
  const [description, setDescription] = useState('');
  const [rewardType, setRewardType] = useState('negotiable');
  const [rewardAmount, setRewardAmount] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Try get geolocation
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
        () => setPosition([50.4501, 30.5234])
      );
    } else {
      setPosition([50.4501, 30.5234]);
    }
  }, []);

  const handleSubmit = async () => {
    if (!type || !position) return;
    setLoading(true); setError('');
    try {
      let photoUrl = null;
      if (photo) {
        const formData = new FormData();
        formData.append('photo', photo);
        const uploadRes = await client.post('/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
        photoUrl = uploadRes.data.url;
      }

      const res = await client.post('/requests', {
        type, latitude: position[0], longitude: position[1],
        description, reward_type: rewardType,
        reward_amount: rewardType === 'fixed' ? parseInt(rewardAmount) : null,
        photo_url: photoUrl
      });
      navigate(`/request/${res.data.id}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка');
      setLoading(false);
    }
  };

  const canContinue = step === 1 ? !!type : step === 2 ? !!position : true;

  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '24px 20px' }}>
      <div style={{ marginBottom: 24 }}>
        <button className="btn btn-ghost btn-sm" onClick={() => navigate(-1)}>← Назад</button>
        <h1 style={{ fontSize: 24, fontWeight: 800, marginTop: 12 }}>🆘 Потрібна допомога</h1>
        <p style={{ color: 'var(--color-text-2)', marginTop: 4 }}>Заповніть форму — інші водії побачать вашу заявку на карті</p>
      </div>

      {/* Progress */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 28, alignItems: 'center' }}>
        {[1, 2, 3].map(s => (
          <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
            <div style={{
              width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontWeight: 700, fontSize: 14, flexShrink: 0,
              background: s <= step ? 'var(--color-primary)' : 'var(--color-surface)',
              color: s <= step ? '#000' : 'var(--color-text-3)',
              border: `2px solid ${s <= step ? 'var(--color-primary)' : 'var(--color-border)'}`,
              transition: 'all 0.3s',
            }}>{s < step ? '✓' : s}</div>
            <span style={{ fontSize: 13, color: s === step ? 'var(--color-text)' : 'var(--color-text-3)' }}>
              {s === 1 ? 'Тип проблеми' : s === 2 ? 'Місцезнаходження' : 'Деталі'}
            </span>
            {s < 3 && <div style={{ flex: 1, height: 2, background: s < step ? 'var(--color-primary)' : 'var(--color-border)', borderRadius: 1, transition: 'all 0.3s' }} />}
          </div>
        ))}
      </div>

      {error && <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, color: 'var(--color-danger)', fontSize: 14 }}>⚠️ {error}</div>}

      {/* Step 1 — Type */}
      {step === 1 && (
        <div className="fade-in">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
            {PROBLEM_TYPES.map(pt => (
              <div key={pt.value} className="glass" onClick={() => setType(pt.value)}
                style={{
                  padding: 20, cursor: 'pointer', textAlign: 'center', transition: 'all 0.2s',
                  border: type === pt.value ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                  background: type === pt.value ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                  transform: type === pt.value ? 'scale(1.03)' : 'scale(1)',
                }}
                onMouseEnter={e => { if (type !== pt.value) e.currentTarget.style.transform = 'scale(1.02)'; }}
                onMouseLeave={e => { if (type !== pt.value) e.currentTarget.style.transform = 'scale(1)'; }}
              >
                <div style={{ fontSize: 40, marginBottom: 10 }}>{pt.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 4 }}>{pt.label}</div>
                <div style={{ fontSize: 12, color: 'var(--color-text-2)' }}>{pt.desc}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2 — Location */}
      {step === 2 && (
        <div className="fade-in">
          <AddressSearch onSelect={setPosition} />
          
          <div className="glass" style={{ padding: 0, overflow: 'hidden', marginBottom: 12, position: 'relative', zIndex: 1 }}>
            {position ? (
              <MapContainer center={position} zoom={15} style={{ height: 360 }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='© OSM' />
                <DraggableMarker position={position} setPosition={setPosition} />
                <FlyToLocation pos={position} />
              </MapContainer>
            ) : <div style={{ height: 360, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div className="spinner" /></div>}
            
            <button
              className="glass btn btn-sm"
              onClick={() => {
                if (!navigator.geolocation) return alert('Ваш браузер не підтримує геолокацію.');
                navigator.geolocation.getCurrentPosition(
                  pos => setPosition([pos.coords.latitude, pos.coords.longitude]),
                  err => console.warn('Локацію не визначено автоматично:', err.message),
                  { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                );
              }}
              style={{ position: 'absolute', bottom: 20, right: 16, zIndex: 1000, fontSize: 18, width: 40, height: 40, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              title="Моє місцезнаходження"
            >📍</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13, color: 'var(--color-text-2)', padding: '10px 14px', background: 'var(--color-surface)', borderRadius: 8, border: '1px solid var(--color-border)' }}>
            <span>📍</span>
            <span>Натисніть на карту або перетягніть маркер для точного місця</span>
          </div>
          {position && (
            <div style={{ marginTop: 8, fontSize: 12, color: 'var(--color-text-3)', textAlign: 'center' }}>
              {position[0].toFixed(5)}, {position[1].toFixed(5)}
            </div>
          )}
        </div>
      )}

      {/* Step 3 — Details */}
      {step === 3 && (
        <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          <div className="input-group">
            <label className="input-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>Фото поломки (необов'язково)</span>
            </label>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <button 
                type="button" 
                className="btn btn-sm" 
                style={{ flex: 1, padding: '14px', border: '1px dashed var(--color-border)', background: 'transparent', color: 'var(--color-text-2)' }}
                onClick={() => document.getElementById('photo-upload').click()}
              >
                {photo ? '📸 Змінити фото' : '📸 Додати фото'}
              </button>
              <input 
                id="photo-upload" 
                type="file" 
                accept="image/*" 
                style={{ display: 'none' }} 
                onChange={e => {
                  const file = e.target.files[0];
                  if (file) {
                    setPhoto(file);
                    setPhotoPreview(URL.createObjectURL(file));
                  }
                }} 
              />
              {photoPreview && (
                <div style={{ width: 48, height: 48, borderRadius: 8, overflow: 'hidden', border: '1px solid var(--color-border)', flexShrink: 0 }}>
                  <img src={photoPreview} alt="Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                </div>
              )}
            </div>
          </div>

          <div className="input-group">
            <label className="input-label">Коментар (необов'язково)</label>
            <textarea className="input" style={{ minHeight: 90, resize: 'vertical' }}
              placeholder="Наприклад: Стою на узбіччі, сіра Mazda, аварійка включена"
              value={description} onChange={e => setDescription(e.target.value)} />
          </div>

          <div>
            <label className="input-label" style={{ display: 'block', marginBottom: 10 }}>Тип винагороди</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { v: 'free', icon: '🎁', l: 'Безкоштовно' },
                { v: 'fixed', icon: '💰', l: 'Фікс. сума' },
                { v: 'negotiable', icon: '🤝', l: 'За домовл.' },
              ].map(({ v, icon, l }) => (
                <button key={v} type="button" onClick={() => setRewardType(v)}
                  className="btn btn-sm"
                  style={{ flex: 1, flexDirection: 'column', gap: 4, padding: '12px 8px',
                    background: rewardType === v ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                    border: rewardType === v ? '2px solid var(--color-primary)' : '1px solid var(--color-border)',
                    color: rewardType === v ? 'var(--color-primary)' : 'var(--color-text-2)',
                  }}>
                  <span style={{ fontSize: 20 }}>{icon}</span>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>{l}</span>
                </button>
              ))}
            </div>
          </div>

          {rewardType === 'fixed' && (
            <div className="input-group">
              <label className="input-label">Сума (грн)</label>
              <input className="input" type="number" placeholder="150" value={rewardAmount} onChange={e => setRewardAmount(e.target.value)} min={1} />
            </div>
          )}

          {/* Summary */}
          <div className="glass" style={{ padding: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
              {PROBLEM_TYPES.find(t => t.value === type)?.icon} Підсумок заявки
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, fontSize: 14 }}>
              <div style={{ color: 'var(--color-text-2)' }}>Тип:</div>
              <div>{PROBLEM_TYPES.find(t => t.value === type)?.label}</div>
              <div style={{ color: 'var(--color-text-2)' }}>Місце:</div>
              <div>{position ? `${position[0].toFixed(4)}, ${position[1].toFixed(4)}` : '—'}</div>
              <div style={{ color: 'var(--color-text-2)' }}>Винагорода:</div>
              <div>{rewardType === 'free' ? 'Безкоштовно' : rewardType === 'fixed' ? `${rewardAmount} грн` : 'За домовленістю'}</div>
            </div>
          </div>
        </div>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        {step > 1 && <button className="btn btn-ghost" style={{ flex: 1 }} onClick={() => setStep(s => s - 1)}>← Назад</button>}
        {step < 3 ? (
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={!canContinue} onClick={() => setStep(s => s + 1)}>
            Далі →
          </button>
        ) : (
          <button className="btn btn-primary" style={{ flex: 2 }} disabled={loading} onClick={handleSubmit}>
            {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Публікуємо...</> : '🆘 Опублікувати заявку'}
          </button>
        )}
      </div>
    </div>
  );
}
