import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Component } from 'react';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Landing from './pages/Landing';
import CreateRequest from './pages/CreateRequest';
import RequestDetail from './pages/RequestDetail';
import Profile from './pages/Profile';
import History from './pages/History';
import Admin from './pages/Admin';

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, info) { console.error('AutoHelp Error:', error, info); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 16, padding: 24 }}>
          <div style={{ fontSize: 48 }}>⚠️</div>
          <h2 style={{ fontSize: 20, fontWeight: 700 }}>Сталася помилка</h2>
          <p style={{ color: 'var(--color-text-2)', fontSize: 14, textAlign: 'center', maxWidth: 400 }}>
            {this.state.error?.message || 'Невідома помилка'}
          </p>
          <button className="btn btn-primary" onClick={() => { this.setState({ hasError: false, error: null }); window.history.back(); }}>
            ← Назад
          </button>
          <button className="btn btn-ghost" onClick={() => window.location.href = '/'}>
            🏠 На головну
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <SocketProvider>
          <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
            <Navbar />
            <ErrorBoundary>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/" element={<ProtectedRoute><Landing /></ProtectedRoute>} />
                <Route path="/create" element={<ProtectedRoute><CreateRequest /></ProtectedRoute>} />
                <Route path="/request/:id" element={<ProtectedRoute><RequestDetail /></ProtectedRoute>} />
                <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
                <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ErrorBoundary>
          </div>
        </SocketProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
