import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, Mail, MailCheck } from 'lucide-react';
import StarBackground from '../components/layout/StarBackground';

const ForgotPasswordPage = () => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation();
  
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState({});
  const [generalMessage, setGeneralMessage] = useState({ type: '', text: '' });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      newErrors.email = t('auth.errors.req_email');
    } else if (!emailRegex.test(email)) {
      newErrors.email = t('auth.errors.invalid_email');
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
        throw new Error(data.error || t('auth.errors.generic'));
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
              {t('auth.forgot.sent_title')}
            </h2>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', alignItems: 'center' }}>
              <p style={{ color: 'var(--text-muted)', fontSize: '1rem', lineHeight: '1.5', textAlign: 'center', margin: 0 }}>
                {generalMessage.text} <br />{t('auth.forgot.spam_warning')}
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
              {t('auth.action.back_to_login')}
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
                  {t('auth.forgot.title')}
                </span>
                <Sparkles className="logo-icon" size={24} style={{ transform: 'scaleX(-1)' }}/>
            </h2>
            
            <p style={{ 
                color: 'var(--text-muted)', 
                fontSize: '0.95rem', 
                lineHeight: '1.5', 
                marginTop: '0', 
                marginBottom: '-0.3rem' }}>
              {t('auth.forgot.subtitle_p1')}<br /> {t('auth.forgot.subtitle_p2')}
            </p>

            <div className="auth-divider" style={{ marginBottom: '-1rem' }}></div>

            <div className="general-error">
              {generalMessage.text}
            </div>

            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              <div className="input-group" style={{ marginTop: '-1rem' }}>
                <label>{t('auth.form.email_label')}</label>
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
                    placeholder={t('auth.form.email_placeholder')}
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
                {isLoading ? t('auth.action.sending') : t('auth.action.submit_forgot')}
              </button>
            </form>

            <div className="auth-divider">{t('auth.action.or')}</div>
            
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0', marginBottom: '0' }}>
              {t('auth.forgot.remembered_password')} <Link to="/login" className="auth-link">{t('auth.action.back_to_login')}</Link>
            </p>
          </>
        )}

      </div>
    </div>
  );
};

export default ForgotPasswordPage;