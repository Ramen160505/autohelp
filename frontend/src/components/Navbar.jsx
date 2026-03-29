import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';

export default function Navbar() {
  const { user } = useAuth();
  const { pathname } = useLocation();

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);
  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const bottomLinks = [
    { to: '/', label: 'Карта', icon: '📍' },
    { to: '/create', label: 'Допомога', icon: '🆘' },
    { to: '/history', label: 'Історія', icon: '📋' },
    { to: '/leaderboard', label: 'Топ', icon: '🏆' },
    { to: '/profile', label: 'Профіль', icon: '👤' }
  ];

  if (user?.is_admin) {
    bottomLinks.push({ to: '/admin', label: 'Адмін', icon: '🛡️' });
  }

  return (
    <>
      {/* Top Header Logo Only */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 1000,
        background: 'var(--color-bg)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid var(--color-border)',
        padding: '0 16px',
        height: 60,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 800, fontSize: 18, textDecoration: 'none' }}>
          <span style={{ fontSize: 24 }}>🚗</span>
          <span style={{ background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AutoHelp
          </span>
        </Link>
        <button className="btn btn-ghost p-2" onClick={toggleTheme} style={{ borderRadius: '50%' }}>
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </nav>

      {/* spacer to not overlap content with bottom bar */}
      {user && <div style={{ height: 80 }} className="mobile-spacer" />}

      {/* Bottom Navigation for Logged In User */}
      {user && (
        <div className="bottom-navbar">
          {bottomLinks.map(({ to, label, icon }) => {
            const isActive = pathname === to;
            return (
              <Link key={to} to={to} className={`bottom-nav-item ${isActive ? 'active' : ''}`}>
                <span className="nav-icon" style={{ opacity: isActive ? 1 : 0.4 }}>{icon}</span>
                <span className="nav-label" style={{ fontWeight: isActive ? 700 : 500, color: isActive ? '#f59e0b' : '#64748b' }}>
                  {label}
                </span>
                {isActive && <div className="active-dot" />}
              </Link>
            );
          })}
        </div>
      )}

      <style>{`
        /* Desktop specific */
        @media (min-width: 768px) {
          .bottom-navbar {
            top: 0;
            bottom: auto !important;
            right: 80px;
            width: auto !important;
            height: 60px !important;
            background: transparent !important;
            border-top: none !important;
          }
          .nav-label { font-size: 16px !important; color: var(--color-text) !important; }
          .bottom-nav-item { flex-direction: row !important; gap: 8px; }
          .active-dot { top: auto; bottom: 0; width: 100%; height: 3px; border-radius: 2px; }
          .mobile-spacer { display: none; }
        }

        /* Mobile specific bottom navbar */
        .bottom-navbar {
          position: fixed;
          bottom: 0; left: 0; right: 0;
          height: 85px;
          background: #0f172a;
          border-top: 1px solid #1e293b;
          display: flex;
          justify-content: space-around;
          align-items: center;
          z-index: 1000;
          box-shadow: 0 -4px 12px rgba(0,0,0,0.2);
          padding-bottom: env(safe-area-inset-bottom);
        }
        .bottom-nav-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          flex: 1;
          height: 100%;
          position: relative;
          padding: 8px 0;
        }
        .nav-icon {
          font-size: 28px;
          margin-bottom: 4px;
          transition: all 0.2s;
        }
        .bottom-nav-item.active .nav-icon {
          transform: translateY(-3px) scale(1.1);
        }
        .nav-label {
          font-size: 12px;
          transition: all 0.2s;
        }
        .active-dot {
          position: absolute;
          top: 0;
          width: 36px;
          height: 3px;
          background: #f59e0b;
          border-radius: 0 0 4px 4px;
        }
      `}</style>
    </>
  );
}
