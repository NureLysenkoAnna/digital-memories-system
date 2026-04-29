import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle, XCircle, ArrowRight, MailOpen, Users } from 'lucide-react';
import StarBackground from '../components/layout/StarBackground';
import MainHeader from '../components/layout/MainHeader';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [status, setStatus] = useState('loading');
  const [message, setMessage] = useState(t('invite.status.checking'));
  const [groupId, setGroupId] = useState(null);
  const [groupName, setGroupName] = useState('');

  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      hasFetched.current = true;
      processInvite();
    }
  }, [token]);

  const processInvite = async () => {
    try {
      const verifyRes = await fetch(`${API_URL}/groups/invite/${token}/verify`);
      const verifyData = await verifyRes.json();

      if (!verifyRes.ok) {
        setStatus('invalid');
        setMessage(verifyData.error || t('invite.status.invalid_default'));
        localStorage.removeItem('pendingInviteToken');
        return;
      }

      setGroupName(verifyData.group_name);

      const authToken = localStorage.getItem('token');
      if (!authToken || authToken === 'undefined' || authToken === 'null') {
        setStatus('unauthorized');
        setMessage(t('invite.status.invited'));
        localStorage.setItem('pendingInviteToken', token);
        return;
      }

      setStatus('loading');
      setMessage(t('invite.status.joining'));

      const acceptRes = await fetch(`${API_URL}/groups/invite/${token}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });

      const contentType = acceptRes.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        setStatus('error');
        setMessage(t('invite.status.server_error', { status: acceptRes.status }));
        localStorage.removeItem('pendingInviteToken');
        return;
      }

      const acceptData = await acceptRes.json();
      localStorage.removeItem('pendingInviteToken');

      if (acceptRes.ok) {
        setStatus('success');
        setMessage(acceptData.message);
        setGroupId(acceptData.groupId);
      } else {
        setStatus('error');
        setMessage(acceptData.error || t('invite.status.accept_error'));
      }
    } catch (err) {
      setStatus('error');
      setMessage(t('invite.status.network_error'));
      localStorage.removeItem('pendingInviteToken');
    }
  };

  return (
    <div className="landing-container">
      <StarBackground />
      <MainHeader />
      
      <div className="hero-section">
        <div className="glass-panel" style={{ maxWidth: '550px', width: '100%', padding: '3.5rem 2.5rem', textAlign: 'center', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'center' }}>
          
          {status === 'loading' && (
            <>
              <div style={{ position: 'relative', display: 'inline-flex', justifyContent: 'center', alignItems: 'center', width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)' }}>
                <Sparkles size={40} className="logo-icon spin" color="var(--accent-silver)" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{message}</h2>
            </>
          )}

          {/* СТАН: УСПІХ */}
          {status === 'success' && (
            <>
              <div style={{ background: 'rgba(16, 185, 129, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <CheckCircle size={56} color="#10b981" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.8rem' }}>{t('invite.success.title')}</h2>
              <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid var(--glass-border)', borderRadius: '12px', padding: '1.5rem', width: '100%' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>{message}</p>
                {groupName && <h3 style={{ margin: '0.8rem 0 0 0', color: 'var(--text-main)' }}>{groupName}</h3>}
              </div>
              <button className="cta-button" onClick={() => navigate(`/groups/${groupId}`)} style={{ marginTop: '1rem', width: 'auto', justifyContent: 'center' }}>
                {t('invite.success.go_to_group')} <ArrowRight size={20} />
              </button>
            </>
          )}

          {/* СТАН: ЗАПРОШЕННЯ НЕДІЙСНЕ */}
          {status === 'invalid' && (
            <>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <XCircle size={56} color="#ef4444" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.6rem' }}>{t('invite.invalid.title')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>{message}</p>
              <button className="btn-modal-cancel" onClick={() => navigate('/')}
              style={{ flex: 1, padding: '0.8rem', marginTop:'1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-silver)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                {t('invite.invalid.go_to_main')}
              </button>
            </>
          )}

          {/* СТАН: ПОМИЛКА МЕРЕЖІ */}
          {status === 'error' && (
            <>
              <div style={{ background: 'rgba(239, 68, 68, 0.1)', padding: '1rem', borderRadius: '50%' }}>
                <XCircle size={56} color="#ef4444" />
              </div>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>{t('invite.error.title')}</h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.1rem', margin: 0 }}>{message}</p>
              <button className="btn-modal-cancel"
                onClick={() => navigate('/profile')}
                style={{ flex: 1, padding: '0.8rem', marginTop:'1rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}
                onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-silver)'; }}
                onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}>
                {t('invite.error.back_to_profile')}
              </button>
            </>
          )}

          {/* СТАН: НЕАВТОРИЗОВАНИЙ (АЛЕ ЗАПРОШЕННЯ ДІЙСНЕ) */}
          {status === 'unauthorized' && (
            <>
              <div style={{ background: 'rgba(255,255,255,0.05)', padding: '1.2rem', borderRadius: '50%', border: '1px solid var(--glass-border)' }}>
                <MailOpen size={48} color="var(--accent-silver)" />
              </div>
              
              <div>
                <h2 style={{ margin: '0 0 0.5rem 0', fontSize: '1.6rem' }}>{message}</h2>
                {groupName && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255,255,255,0.05)', padding: '0.5rem 1rem', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
                    <Users size={18} color="var(--text-muted)"/>
                    <span style={{ fontWeight: 'bold', color: 'var(--text-main)', fontSize: '1.1rem' }}>{groupName}</span>
                  </div>
                )}
              </div>
              
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', margin: '1rem 0' }}>
                {t('invite.unauthorized.subtitle')}
              </p>
              
              <div style={{ display: 'flex', gap: '1rem', width: '100%', marginTop: '0.5rem' }}>
                {/* ОНОВЛЕНА КНОПКА ЛОГІНУ */}
                <button 
                  onClick={() => navigate('/login')}
                  style={{ flex: 1, padding: '0.8rem', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--glass-border)', borderRadius: '14px', color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: '600', cursor: 'pointer', transition: 'all 0.3s ease' }}
                  onMouseOver={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.1)'; e.currentTarget.style.borderColor = 'var(--accent-silver)'; }}
                  onMouseOut={(e) => { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                >
                  {t('invite.unauthorized.login_btn')}
                </button>
                <button 
                  className="cta-button" 
                  onClick={() => navigate('/register')}
                  style={{ flex: 1, margin: 0, padding: '0.8rem', display: 'flex', justifyContent: 'center' }}
                >
                  {t('invite.unauthorized.register_btn')}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default InvitePage;