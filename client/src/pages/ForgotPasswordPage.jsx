import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, Mail, MailCheck } from 'lucide-react';
import StarBackground from '../components/StarBackground';

const ForgotPasswordPage = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [generalMessage, setGeneralMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = 'Введіть електронну пошту.';
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Невірний формат запису пошти.';
    }

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }

    setIsLoading(true);
    setErrors({});
    setGeneralMessage({ type: '', text: '' });

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Сталася помилка. Спробуйте пізніше.');
      }

      setGeneralMessage({ type: 'success', text: data.message });
      setEmail('');
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
        
        {generalMessage.type === 'success' ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1.5rem', padding: '1rem 0' }}>
            
            <div style={{
               width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(16, 185, 129, 0.1)',
               display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(16, 185, 129, 0.3)'
            }}>
              <MailCheck size={40} color="#10b981" />
            </div>
            
            <h2 className="auth-title" style={{ fontSize: '1.8rem', margin: 0 }}>
              Лист надіслано успішно!
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5', textAlign: 'center', margin: 0 }}>
                {generalMessage.text} <br />Якщо листа довго немає, перевірте папку "Спам" або "Реклама".
              </p>
            </div>
            
            <Link to="/login" 
              className="cta-button" 
              style={{ 
                width: '100%', 
                justifyContent: 'center', 
                textDecoration: 'none', 
                marginTop: '0.5rem', 
                marginBottom: '0' }}>
              Повернутися до входу
            </Link>

          </div>
        ) : (
          <>
            <h2 className="auth-title" style={{ 
              fontSize: '1.8rem', 
              lineHeight: '1.3',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              gap: '0.5rem'
            }}>
                <Sparkles className="logo-icon" size={24}/>
                <span>
                Відновлення доступу
                </span>
                <Sparkles className="logo-icon" size={24} style={{ transform: 'scaleX(-1)' }}/>
            </h2>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem', lineHeight: '1.5', marginTop: '0', marginBottom: '-0.3rem' }}>
              Введіть електронну пошту,<br /> яку Ви використовували при реєстрації.<br />
              На неї буде надіслано інструкції відновлення паролю.
            </p>

            <div className="auth-divider" style={{ marginBottom: '-1rem' }}></div>

            <div className="general-error">
              {generalMessage.text}
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="input-group" style={{ marginTop: '-1rem' }}>
                <label>Електронна пошта</label>
                <div style={{ position: 'relative', width: '100%' }}>
                  <Mail size={18} style={{ 
                    position: 'absolute', 
                    left: '1rem', 
                    top: '50%', 
                    transform: 'translateY(-50%)', 
                    color: 'var(--text-muted)' 
                  }} />
                  <input 
                    type="email" 
                    className="glass-input" 
                    placeholder="example@gmail.com" 
                    value={email} 
                    onChange={(e) => { 
                      setEmail(e.target.value); 
                      setErrors({ ...errors, email: '' });
                      setGeneralMessage({ type: '', text: '' });
                    }} 
                    style={{ paddingLeft: '2.8rem' }}
                    disabled={isLoading}
                  />
                </div>
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>

              <button 
                type="submit" 
                className="cta-button" 
                style={{ width: '100%', justifyContent: 'center', marginTop: '0.7rem' }} 
                disabled={isLoading}
              > 
                {isLoading ? 'Відправка...' : 'Надіслати листа'}
              </button>
            </form>

            <div className="auth-divider">або</div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0', marginBottom: '0' }}>
              Згадали пароль? <Link to="/login" className="auth-link">Увійти</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;