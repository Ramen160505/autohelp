import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const [deferredPrompt, setDeferredPrompt] = useState(null);
  useEffect(() => {
    const handler = (e) => { e.preventDefault(); setDeferredPrompt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setDeferredPrompt(null);
  };

  const handleLogout = () => { logout(); navigate('/login'); setMenuOpen(false); };

  const navLinks = [
    { to: '/', label: '🗺️ Карта' },
    { to: '/create', label: '＋ Допомога' },
    { to: '/history', label: '📋 Історія' },
    { to: '/leaderboard', label: '🏆 Зал Слави' },
    { to: '/profile', label: '👤 Профіль' },
    ...(user?.is_admin ? [{ to: '/admin', label: '🛡️ Адмін' }] : []),
  ];

  return (
    <>
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'var(--color-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 16px',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18 }}>
            <span style={{ fontSize: 24 }}>🚗</span>
            <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              AutoHelp
            </span>
          </Link>

          {/* Desktop nav (hidden on mobile) */}
          <div className="desktop-nav" style={{ display: 'none', gap: 4, alignItems: 'center' }}>
            {user && navLinks.map(({ to, label }) => (
              <Link key={to} to={to} style={{
                padding: '8px 14px', borderRadius: 'var(--radius-md)',
                fontSize: 14, fontWeight: 500,
                background: pathname === to ? 'var(--color-primary-glow)' : 'transparent',
                color: pathname === to ? 'var(--color-primary)' : 'var(--color-text-2)',
                transition: 'all 0.2s',
                border: pathname === to ? '1px solid rgba(245,158,11,0.3)' : '1px solid transparent',
              }}>
                {label}
              </Link>
            ))}
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            {deferredPrompt && (
              <button onClick={handleInstallClick} className="btn-primary" style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, fontWeight: 700 }}>
                ⬇️ Встановити
              </button>
            )}

            <button onClick={toggleTheme} className="btn-ghost" style={{ padding: '8px', borderRadius: '50%', display: 'flex', background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

            {user ? (
              <>
                <div className="desktop-user" style={{ display: 'none', alignItems: 'center', gap: 8 }}>
                  <div className="avatar avatar-sm">
                    {user.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div style={{ lineHeight: 1.2 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>{user.name}</div>
                    <div style={{ fontSize: 11, color: 'var(--color-primary)' }}>
                      ⭐ {user.rating ? user.rating.toFixed(1) : '—'}
                    </div>
                  </div>
                </div>
                {/* Mobile menu toggle */}
                <button onClick={() => setMenuOpen(!menuOpen)} className="mobile-menu-btn" style={{ fontSize: 24, background: 'none', border: 'none', color: 'var(--color-text)', display: 'block', padding: '4px' }}>
                  {menuOpen ? '✕' : '☰'}
                </button>
              </>
            ) : (
              <Link to="/login" className="btn btn-primary btn-sm">Увійти</Link>
            )}
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {user && menuOpen && (
        <div style={{
          position: 'fixed', top: 64, left: 0, right: 0, bottom: 0,
          background: 'var(--color-bg)', zIndex: 999,
          padding: 24, display: 'flex', flexDirection: 'column', gap: 16
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--color-border)' }}>
            <div className="avatar avatar-lg">
              {user.name?.[0]?.toUpperCase() || '?'}
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{user.name}</div>
              <div style={{ fontSize: 14, color: 'var(--color-primary)' }}>⭐ Рейтинг: {user.rating ? user.rating.toFixed(1) : '—'}</div>
              <div style={{ fontSize: 12, color: 'var(--color-text-3)' }}>{user.phone}</div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {navLinks.map(({ to, label }) => (
              <Link key={to} to={to} onClick={() => setMenuOpen(false)} style={{
                padding: '16px', borderRadius: 'var(--radius-md)',
                fontSize: 16, fontWeight: 600,
                background: pathname === to ? 'var(--color-primary-glow)' : 'var(--color-surface)',
                color: pathname === to ? 'var(--color-primary)' : 'var(--color-text)',
                border: '1px solid var(--color-border)'
              }}>
                {label}
              </Link>
            ))}
          </div>
          <button onClick={handleLogout} className="btn btn-danger btn-lg" style={{ marginTop: 'auto' }}>
            🚪 Вийти з акаунту
          </button>
        </div>
      )}

      {/* Adding a quick inline style for media queries logic without breaking CSS-in-JS constraints */}
      <style>{`
        @media (min-width: 768px) {
          .desktop-nav { display: flex !important; }
          .desktop-user { display: flex !important; }
          .mobile-menu-btn { display: none !important; }
        }
      `}</style>
    </>
  );
}
