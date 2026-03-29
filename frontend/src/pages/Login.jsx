import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import client from '../api/client';
import CarSelector from '../components/CarSelector';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState('phone'); // 'phone' | 'code' | 'register'
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [carBrand, setCarBrand] = useState('');
  const [carModel, setCarModel] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState('');

  const handlePhone = async (e) => {
    e.preventDefault(); 
    setError(''); 
    
    const phoneRegex = /^0\d{9}$/;
    if (!phoneRegex.test(phone)) {
      setError('Невірний формат. Використовуйте формат: 0980000000 (10 цифр)');
      return;
    }
    
    setLoading(true);
    try {
      const res = await client.post('/auth/login', { phone });
      if (res.data.dev_code) setDevCode(res.data.dev_code);
      setStep('code');
    } catch (err) {
      if (err.response?.status === 404) setStep('register');
      else setError(err.response?.data?.error || 'Помилка');
    } finally { setLoading(false); }
  };

  const handleRegister = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await client.post('/auth/register', { phone, name, car_brand: carBrand, car_model: carModel });
      if (res.data.dev_code) setDevCode(res.data.dev_code);
      setStep('code');
    } catch (err) {
      setError(err.response?.data?.error || 'Помилка реєстрації');
    } finally { setLoading(false); }
  };

  const handleVerify = async (e) => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await client.post('/auth/verify', { phone, code });
      login(res.data.token, res.data.user);
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Невірний код');
    } finally { setLoading(false); }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'radial-gradient(ellipse at 50% 0%, rgba(245,158,11,0.1) 0%, transparent 60%), var(--color-bg)',
      padding: 20,
    }}>
      {/* Background glow */}
      <div style={{ position: 'fixed', top: -200, left: '50%', transform: 'translateX(-50%)', width: 600, height: 600, background: 'radial-gradient(circle, rgba(245,158,11,0.06), transparent 70%)', pointerEvents: 'none' }} />

      <div className="glass scale-in" style={{ width: '100%', maxWidth: 420, padding: '40px 36px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 52, marginBottom: 12 }}>🚗</div>
          <h1 style={{ fontSize: 28, fontWeight: 800, background: 'linear-gradient(135deg, #f59e0b, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            AutoHelp
          </h1>
          <p style={{ color: 'var(--color-text-2)', marginTop: 6, fontSize: 14 }}>
            P2P допомога водіям на дорозі 🇺🇦
          </p>
        </div>

        {/* Dev code hint */}
        {devCode && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 8, fontSize: 14, textAlign: 'center' }}>
            🔑 Тестовий код: <strong style={{ color: '#f59e0b', fontSize: 18, letterSpacing: 4 }}>{devCode}</strong>
          </div>
        )}

        {error && (
          <div style={{ marginBottom: 16, padding: '10px 14px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 8, fontSize: 14, color: 'var(--color-danger)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* Step: phone */}
        {step === 'phone' && (
          <form onSubmit={handlePhone} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="input-group">
              <label className="input-label">Номер телефону</label>
              <input 
                className="input" 
                type="tel" 
                placeholder="0980000000" 
                maxLength={10}
                value={phone} 
                onChange={e => {
                  const val = e.target.value.replace(/\D/g, '');
                  setPhone(val);
                }} 
                required 
              />
            </div>
            <button className="btn btn-primary btn-full btn-lg" disabled={loading}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Перевіряємо...</> : 'Продовжити →'}
            </button>
            <p style={{ fontSize: 12, color: 'var(--color-text-3)', textAlign: 'center' }}>
              Введіть номер — ми надішлемо SMS-код для входу
            </p>
          </form>
        )}

        {/* Step: register */}
        {step === 'register' && (
          <form onSubmit={handleRegister} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '10px 14px', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', borderRadius: 8, fontSize: 13, color: '#93c5fd' }}>
              ℹ️ Цей номер ще не зареєстрований. Заповніть профіль:
            </div>
            <div className="input-group">
              <label className="input-label">Ваше ім'я</label>
              <input className="input" placeholder="Ім'я та прізвище" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <CarSelector
              brand={carBrand}
              model={carModel}
              onBrandChange={v => { setCarBrand(v); setCarModel(''); }}
              onModelChange={setCarModel}
            />
            <button className="btn btn-primary btn-full btn-lg" disabled={loading || !name}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Надсилаємо...</> : 'Зареєструватись →'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={() => setStep('phone')}>← Назад</button>
          </form>
        )}

        {/* Step: code */}
        {step === 'code' && (
          <form onSubmit={handleVerify} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ textAlign: 'center', color: 'var(--color-text-2)', fontSize: 14 }}>
              SMS-код надіслано на <strong style={{ color: 'var(--color-text)' }}>{phone}</strong>
            </div>
            <div className="input-group">
              <label className="input-label">Код підтвердження</label>
              <input
                className="input" style={{ textAlign: 'center', fontSize: 28, fontWeight: 700, letterSpacing: 12 }}
                type="text" inputMode="numeric" maxLength={4} placeholder="——"
                value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required
              />
            </div>
            <button className="btn btn-primary btn-full btn-lg" disabled={loading || code.length < 4}>
              {loading ? <><div className="spinner" style={{ width: 18, height: 18 }} /> Перевіряємо...</> : '✓ Підтвердити'}
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={() => { setStep('phone'); setCode(''); setDevCode(''); }}>
              ← Змінити номер
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
