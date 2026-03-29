import { useState, useEffect, useCallback, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import L from 'leaflet';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { MarkerClusterGroup } from 'leaflet.markercluster';
import client from '../api/client';
import { useSocket } from '../context/SocketContext';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';

// Fix Leaflet default icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const TYPE_CONFIG = {
  battery: { icon: '🔋', color: '#f59e0b' },
  fuel:    { icon: '⛽', color: '#3b82f6' },
  tire:    { icon: '🔧', color: '#8b5cf6' },
  tow:     { icon: '⛓️', color: '#ef4444' },
  other:   { icon: '❓', color: '#64748b' },
};

function createMarkerIcon(type) {
  const cfg = TYPE_CONFIG[type] || TYPE_CONFIG.other;
  return L.divIcon({
    className: '',
    html: `<div style="width:40px;height:40px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);background:${cfg.color};border:3px solid white;box-shadow:0 4px 12px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:center;">
      <span style="transform:rotate(45deg);font-size:16px;display:block;">${cfg.icon}</span>
    </div>`,
    iconSize: [40, 40], iconAnchor: [20, 40],
  });
}

// Component to detect user location
function LocationMarker({ userPos, setUserPos }) {
  useMapEvents({
    locationfound(e) { setUserPos([e.latlng.lat, e.latlng.lng]); },
  });
  return userPos ? (
    <Marker position={userPos} icon={L.divIcon({ className: '', html: '<div style="width:16px;height:16px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 0 0 4px rgba(59,130,246,0.3)"></div>', iconSize: [16,16], iconAnchor: [8,8] })}>
      <Popup>📍 Ви тут</Popup>
    </Marker>
  ) : null;
}

// Marker cluster wrapper
function ClusteredMarkers({ requests, navigate }) {
  const map = useMap();

  useEffect(() => {
    const group = new MarkerClusterGroup({
      iconCreateFunction: (cluster) => {
        const count = cluster.getChildCount();
        return L.divIcon({
          className: '',
          html: `<div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#f59e0b,#d97706);color:#000;font-weight:800;font-size:14px;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 12px rgba(0,0,0,0.4);border:2px solid white;">${count}</div>`,
          iconSize: [40, 40], iconAnchor: [20, 20],
        });
      },
      maxClusterRadius: 60,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
    });

    requests.forEach(req => {
      const cfg = TYPE_CONFIG[req.type] || TYPE_CONFIG.other;
      const marker = L.marker([req.latitude, req.longitude], { icon: createMarkerIcon(req.type) });
      const popup = L.popup({ minWidth: 200 }).setContent(`
        <div style="font-family:system-ui;padding:4px">
          <div style="font-weight:700;font-size:15px;margin-bottom:6px">${cfg.icon} ${req.user?.name || 'Водій'}</div>
          ${req.description ? `<p style="font-size:13px;margin-bottom:8px;color:#94a3b8">${req.description}</p>` : ''}
          <div style="font-size:13px;margin-bottom:8px;color:#94a3b8">⭐ ${req.user?.rating?.toFixed(1) || '—'}</div>
          <button onclick="window.__navigateToRequest('${req.id}')" style="background:#f59e0b;color:#000;border:none;padding:8px 14px;border-radius:8px;cursor:pointer;font-weight:600;width:100%;font-size:14px">Переглянути →</button>
        </div>
      `);
      marker.bindPopup(popup);
      group.addLayer(marker);
    });

    map.addLayer(group);
    window.__navigateToRequest = (id) => navigate(`/request/${id}`);

    return () => {
      map.removeLayer(group);
      delete window.__navigateToRequest;
    };
  }, [map, requests]);

  return null;
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
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', gap: 4 }}>
        <input
          className="input"
          style={{ padding: '8px 12px', width: 240, fontSize: 13 }}
          placeholder="🔍 Пошук адреси..."
          value={query}
          onChange={e => { setQuery(e.target.value); search(e.target.value); }}
          onBlur={() => setTimeout(() => setOpen(false), 200)}
          onFocus={() => results.length && setOpen(true)}
        />
        {loading && <div className="spinner" style={{ width: 20, height: 20, alignSelf: 'center' }} />}
      </div>
      {open && results.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, width: 320, background: 'var(--color-bg-2)', border: '1px solid var(--color-border)', borderRadius: 10, zIndex: 10000, overflow: 'hidden', boxShadow: '0 8px 24px rgba(0,0,0,0.3)', marginTop: 4 }}>
          {results.map((r, i) => (
            <button key={i} onMouseDown={() => { onSelect([parseFloat(r.lat), parseFloat(r.lon)], r.display_name); setQuery(r.display_name.split(',').slice(0, 2).join(',')); setOpen(false); }}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', background: 'none', border: 'none', borderBottom: i < results.length - 1 ? '1px solid var(--color-border)' : 'none', cursor: 'pointer', fontSize: 13, color: 'var(--color-text)', lineHeight: 1.4 }}>
              📍 {r.display_name.split(',').slice(0, 3).join(', ')}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// FlyTo helper
function FlyToLocation({ pos }) {
  const map = useMap();
  useEffect(() => {
    if (pos) map.flyTo(pos, 15, { duration: 1.2 });
  }, [pos]);
  return null;
}

export default function Landing() {
  const { user } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [userPos, setUserPos] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState({ type: '', radius: 10 });
  const [view, setView] = useState('map');
  const defaultCenter = [50.4501, 30.5234];

  const fetchRequests = useCallback(async () => {
    try {
      const params = { radius: filter.radius };
      if (userPos) { params.lat = userPos[0]; params.lng = userPos[1]; }
      if (filter.type) params.type = filter.type;
      const res = await client.get('/requests', { params });
      setRequests(res.data);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [filter, userPos]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    if (!socket) return;
    const onNew = (req) => setRequests(prev => [req, ...prev.filter(r => r.id !== req.id)]);
    const onTaken = ({ request_id }) => setRequests(prev => prev.map(r => r.id === request_id ? { ...r, status: 'taken' } : r));
    socket.on('new_request', onNew);
    socket.on('request_taken', onTaken);
    return () => { socket.off('new_request', onNew); socket.off('request_taken', onTaken); };
  }, [socket]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => { 
          const p = [pos.coords.latitude, pos.coords.longitude]; 
          setUserPos(p); setFlyTo(p); 
          client.put('/users/me', { last_lat: pos.coords.latitude, last_lng: pos.coords.longitude }).catch(() => {});
        },
        () => {}
      );
    }
  }, []);

  const distanceTo = (lat, lng) => {
    if (!userPos) return null;
    const R = 6371;
    const dLat = (lat - userPos[0]) * Math.PI / 180;
    const dLon = (lng - userPos[1]) * Math.PI / 180;
    const a = Math.sin(dLat/2)**2 + Math.cos(userPos[0]*Math.PI/180) * Math.cos(lat*Math.PI/180) * Math.sin(dLon/2)**2;
    return (R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))).toFixed(1);
  };

  const TYPES = [
    { value: '', label: '🌐 Всі' },
    { value: 'battery', label: '🔋 Акумулятор' },
    { value: 'fuel', label: '⛽ Пальне' },
    { value: 'tire', label: '🔧 Колесо' },
    { value: 'tow', label: '⛓️ Буксир' },
    { value: 'other', label: '❓ Інше' },
  ];

  const handleAddressSelect = (pos) => {
    setFlyTo(pos);
  };

  return (
    <div style={{ height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      {/* Top bar */}
      <div className="landing-top-bar">
        {/* Type filters */}
        <div className="filter-scroll-wrapper">
          {TYPES.map(t => (
            <button key={t.value} onClick={() => setFilter(f => ({ ...f, type: t.value }))}
              className="btn btn-sm"
              style={{ background: filter.type === t.value ? 'var(--color-primary)' : 'var(--color-surface)', color: filter.type === t.value ? '#000' : 'var(--color-text-2)', border: '1px solid var(--color-border)', whiteSpace: 'nowrap' }}>
              {t.label}
            </button>
          ))}
        </div>

        {/* Radius */}
        <select className="input" style={{ width: 'auto', padding: '6px 12px' }}
          value={filter.radius} onChange={e => setFilter(f => ({ ...f, radius: e.target.value }))}>
          {[5, 10, 20, 50].map(r => <option key={r} value={r}>{r} км</option>)}
        </select>

        {/* Address search */}
        {view === 'map' && (
          <div className="mobile-search-wrapper">
            <AddressSearch onSelect={handleAddressSelect} />
          </div>
        )}

        {/* Right side */}
        <div className="landing-right-bar">
          <div style={{display: 'flex', gap: '6px'}}>
            <button className={`btn btn-sm ${view === 'map' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('map')}>🗺️ Карта</button>
            <button className={`btn btn-sm ${view === 'list' ? 'btn-primary' : 'btn-ghost'}`} onClick={() => setView('list')}>📋 Список</button>
          </div>
          <div className="req-count">
            {loading ? '...' : `${requests.length} заявок`}
          </div>
          <button className="btn btn-primary btn-sm btn-create-req" onClick={() => navigate('/create')}>＋ Потрібна допомога</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Map view */}
        {view === 'map' && (
          <div style={{ flex: 1, position: 'relative' }}>
            <MapContainer center={userPos || defaultCenter} zoom={12} style={{ height: '100%', width: '100%' }}>
              {/* Google Maps Streets Tile Layer */}
              <TileLayer 
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
                attribution='© Google Maps' 
                maxZoom={20}
              />
              <LocationMarker userPos={userPos} setUserPos={setUserPos} />
              <ClusteredMarkers requests={requests} navigate={navigate} />
              {flyTo && <FlyToLocation pos={flyTo} />}
            </MapContainer>

            {/* Map controls overlay */}
            <div style={{ position: 'absolute', bottom: 20, left: 16, zIndex: 1000, display: 'flex', gap: 8, flexDirection: 'column' }}>
              <button
                className="glass btn btn-sm"
                onClick={() => {
                  if (!navigator.geolocation) return alert('Ваш браузер не підтримує геолокацію.');
                  navigator.geolocation.getCurrentPosition(
                    pos => { const p = [pos.coords.latitude, pos.coords.longitude]; setUserPos(p); setFlyTo(p); },
                    err => alert('Не вдалося визначити координати. Перевірте дозволи в браузері: ' + err.message),
                    { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                  );
                }}
                style={{ fontSize: 18, width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                title="Визначити моє місцезнаходження"
              >📍</button>
              <button
                className="btn"
                onClick={async () => {
                  if (!user) return alert('Потрібна авторизація.');
                  if (!userPos) return alert('Спочатку визначте локацію (кнопка 📍).');
                  if (confirm('🚨 УВАГА!\nВи впевнені, що хочете створити термінову SOS-заявку?\nЦе розішле миттєвий сигнал усім поблизу.')) {
                    try {
                      const res = await client.post('/requests', {
                        type: 'other', latitude: userPos[0], longitude: userPos[1],
                        description: 'Термінова необхідність (SOS)!',
                        reward_type: 'negotiable', radius_km: 15
                      });
                      navigate(`/request/${res.data.id}`);
                    } catch (e) {
                      alert('Помилка: ' + (e.response?.data?.error || e.message));
                    }
                  }
                }}
                style={{ fontSize: 15, width: 44, height: 44, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '50%', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.4)' }}
                title="Надіслати SOS"
              >🚨</button>
            </div>

            <div style={{ position: 'absolute', bottom: 20, right: 16, zIndex: 1000, display: 'flex', gap: 8 }}>
              <div className="glass" style={{ padding: '8px 14px', fontSize: 13, fontWeight: 600 }}>
                🟢 {requests.filter(r => r.status === 'active').length} активних
              </div>
            </div>
          </div>
        )}

        {/* List view */}
        {view === 'list' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 32 }}><div className="spinner" /></div>}
            {!loading && requests.length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--color-text-3)' }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>🚗</div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Заявок поки немає</div>
                <div style={{ fontSize: 14, marginTop: 6 }}>Будьте першим — допоможіть комусь поблизу!</div>
              </div>
            )}
            {requests.map(req => (
              <RequestCard key={req.id} request={req} showDistance={distanceTo(req.latitude, req.longitude)} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
