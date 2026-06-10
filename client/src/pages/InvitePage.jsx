import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Sparkles, CheckCircle, XCircle, ArrowRight, MailOpen, Users } from 'lucide-react';
import StarBackground from '../components/layout/StarBackground';
import MainHeader from '../components/layout/MainHeader';
import { getUserFriendlyError } from '../utils/errorUtils';

const InvitePage = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const [status, setStatus] = useState('loading');
  const [messageKey, setMessageKey] = useState('invite.status.checking');
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
        setMessageKey(verifyData.error || 'invite.status.invalid_default');
        localStorage.removeItem('pendingInviteToken');
        return;
      }

      setGroupName(verifyData.group_name);

      const authToken = localStorage.getItem('token');
      if (!authToken || authToken === 'undefined' || authToken === 'null') {
        setStatus('unauthorized');
        setMessageKey('invite.status.invited');
        localStorage.setItem('pendingInviteToken', token);
        return;
      }

      setStatus('loading');
      setMessageKey('invite.status.joining');

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
        setMessageKey('invite.status.server_error', { status: acceptRes.status });
        localStorage.removeItem('pendingInviteToken');
        return;
      }

      const acceptData = await acceptRes.json();
      localStorage.removeItem('pendingInviteToken');

      if (acceptRes.ok) {
        setStatus('success');
        setMessageKey(`server_success.${acceptData.message}`);
        setGroupId(acceptData.groupId);
      } else {
        setStatus('error');
        setMessageKey(acceptData.error || 'invite.status.accept_error');
      }
    } catch (err) {
      setStatus('error');
      setMessageKey('invite.status.network_error');
      localStorage.removeItem('pendingInviteToken');
    }
  };

  const renderMessage = () => {
    if (messageKey.startsWith('invite.') || messageKey.startsWith('server_success.') || messageKey.startsWith('client_errors.')) {
        return t(messageKey);
    }
    return getUserFriendlyError(messageKey);
  };

  return (
    <div className="landing-container">
      <StarBackground />
      <MainHeader pageType="invite" />
      
      <div className="hero-section">
        <div className="glass-panel invite-hero-panel">
          
          {status === 'loading' && (
            <>
              <div className="invite-icon-wrapper loading">
                <Sparkles size={40} className="logo-icon spin" color="var(--accent-silver)" />
              </div>
              <h2 className="invite-status-title smaller">{renderMessage()}</h2>
            </>
          )}

          {/* СТАН: УСПІХ */}
          {status === 'success' && (
            <>
              <div className="invite-icon-wrapper success">
                <CheckCircle size={56} color="var(--color-success)" />
              </div>
              <h2 className="invite-status-title">{t('invite.success.title')}</h2>
              <div className="invite-group-card">
                <p className="invite-status-message">{renderMessage()}</p>
                {groupName && <h3 className="invite-group-name">{groupName}</h3>}
              </div>
              <button className="cta-button" onClick={() => navigate(`/groups/${groupId}`)} style={{ marginTop: '1rem', width: 'auto', justifyContent: 'center' }}>
                {t('invite.success.go_to_group')} <ArrowRight size={20} />
              </button>
            </>
          )}

          {/* СТАН: ЗАПРОШЕННЯ НЕДІЙСНЕ */}
          {status === 'invalid' && (
            <>
              <div className="invite-icon-wrapper error">
                <XCircle size={56} color="var(--color-danger)" />
              </div>
              <h2 className="invite-status-title small">{t('invite.invalid.title')}</h2>
              <p className="invite-status-message">{renderMessage()}</p>
              
              {localStorage.getItem('token') && localStorage.getItem('token') !== 'undefined' && localStorage.getItem('token') !== 'null' ? (
                <button className="invite-action-btn" onClick={() => navigate('/profile')}>
                  {t('invite.error.back_to_profile')}
                </button>
              ) : (
                <button className="invite-action-btn" onClick={() => navigate('/')}>
                  {t('invite.invalid.go_to_main')}
                </button>
              )}
            </>
          )}

          {/* СТАН: ПОМИЛКА МЕРЕЖІ */}
          {status === 'error' && (
            <>
              <div className="invite-icon-wrapper error">
                <XCircle size={56} color="var(--color-danger)" />
              </div>
              <h2 className="invite-status-title smaller">{t('invite.error.title')}</h2>
              <p className="invite-status-message">{renderMessage()}</p>
              <button className="invite-action-btn" onClick={() => navigate('/profile')}>
                {t('invite.error.back_to_profile')}
              </button>
            </>
          )}

          {/* СТАН: НЕАВТОРИЗОВАНИЙ (АЛЕ ЗАПРОШЕННЯ ДІЙСНЕ) */}
          {status === 'unauthorized' && (
            <>
              <div className="invite-icon-wrapper unauthorized">
                <MailOpen size={48} color="var(--accent-silver)" />
              </div>
              
              <div>
                <h2 className="invite-status-title small" style={{ marginBottom: '0.5rem' }}>{renderMessage()}</h2>
                {groupName && (
                  <div className="invite-group-badge">
                    <Users size={18} color="var(--text-muted)"/>
                    <span className="invite-group-badge-text">{groupName}</span>
                  </div>
                )}
              </div>
              
              <p className="invite-status-message" style={{ margin: '1rem 0' }}>
                {t('invite.unauthorized.subtitle')}
              </p>
              
              <div className="invite-action-buttons">
                <button className="invite-action-btn half" onClick={() => navigate('/login')}>
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