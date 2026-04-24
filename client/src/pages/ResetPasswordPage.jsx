import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Sparkles, CheckCircle, AlertCircle } from 'lucide-react';
import StarBackground from '../components/StarBackground';

const ResetPasswordPage = () => {
  const { token } = useParams();
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [isVerifying, setIsVerifying] = useState(true);
  const [tokenError, setTokenError] = useState('');

  const [formData, setFormData] = useState({ password: '', confirmPassword: '' });
  const [errors, setErrors] = useState({});
  const [generalMessage, setGeneralMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  // Перевірка токена при завантаженні сторінки
  useEffect(() => {
    const verifyToken = async () => {
      try {
        const response = await fetch(`${API_URL}/auth/reset-password/${token}`);
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || 'Посилання недійсне або його час дії вичерпано.');
        }
      } catch (err) {
        setTokenError(err.message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, [token, API_URL]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setErrors({ ...errors, [name]: '' });
    if (generalMessage.type === 'error') {
      setGeneralMessage({ type: '', text: '' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.password) {
      newErrors.password = 'Введіть новий пароль.';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Пароль має містити мінімум 6 символів.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Повторіть пароль.';
    } else if (formData.password && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Паролі не співпадають.';
    }

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }

    setIsLoading(true);
    setErrors({});
    setGeneralMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: formData.password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка відновлення. Можливо, посилання застаріло.');
      }

      setGeneralMessage({ type: 'success', text: data.message });
      setFormData({ password: '', confirmPassword: '' });
    } catch (err) {
      setGeneralMessage({ type: 'error', text: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <StarBackground />
      <div className="glass-panel auth-glass-card">
        
        {isVerifying ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', padding: '2rem 0' }}>
            <Sparkles className="logo-icon spin" size={32} />
            <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>Перевірка зоряної карти...</p>
          </div>
        ) : tokenError ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
            <div style={{
               width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(239, 68, 68, 0.3)'
            }}>
              <AlertCircle size={40} color="#ef4444" />
            </div>
            
            <h2 className="auth-title" style={{ fontSize: '1.7rem', margin: 0 }}>
              Посилання на відновлення недійсне
            </h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5', textAlign: 'center', margin: 0 }}>
              {tokenError}
            </p>
            
            <Link to="/forgot-password" className="cta-button" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', marginTop: '1rem' }}>
              Отримати нове посилання
            </Link>
          </div>
        ) : generalMessage.type === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
            <div style={{
               width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <CheckCircle size={40} color="#10b981" />
            </div>
            
            <h2 className="auth-title" style={{ fontSize: '1.8rem', margin: 0 }}>
              Пароль оновлено!
            </h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5', textAlign: 'center', margin: 0 }}>
              {generalMessage.text}
            </p>
            
            <Link to="/login" className="cta-button" style={{ width: '100%', justifyContent: 'center', textDecoration: 'none', marginTop: '1rem' }}>
              Перейти до входу
            </Link>
          </div>
        ) : (
          <>
            <h2 className="auth-title" style={{ 
              fontSize: '1.8rem', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem' 
            }}>
              <span>Створення нового паролю</span>
            </h2>

            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginTop: '0', marginBottom: '-1rem'}}>
              Придумайте надійний пароль довжиною не менше 6 символів, щоб захистити свої спогади!
            </p>

            <div className={`general-error`}>
              {generalMessage.text}
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              
              <div className="input-group" style={{ marginTop: '-1rem' }}>
                <label>Новий пароль</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="password" 
                    name="password"
                    className="glass-input" 
                    value={formData.password} 
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.password && <span className="error-message">{errors.password}</span>}
              </div>

              <div className="input-group">
                <label>Повторіть пароль</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <input 
                    type="password" 
                    name="confirmPassword"
                    className="glass-input" 
                    value={formData.confirmPassword} 
                    onChange={handleChange}
                    disabled={isLoading}
                  />
                </div>
                {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
              </div>

              <button 
                type="submit" 
                className="cta-button" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.5rem' }} 
                disabled={isLoading}
              > 
                {isLoading ? 'Збереження...' : 'Зберегти пароль'}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
};

export default ResetPasswordPage;