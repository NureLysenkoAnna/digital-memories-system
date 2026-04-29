import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Users } from 'lucide-react';
import customLogo from '../../assets/starlace-logo.png';
import { useTranslation } from 'react-i18next';

const MainHeader = ({ pageType, onLogout }) => {
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  // Функція для зміни мови
  const handleLanguageChange = (lang) => {
    i18n.changeLanguage(lang);
  };

  const currentLang = i18n.language || 'uk';

  return (
    <header className="glass-header">
        
      <div className="logo-container">
        <span>Starlace</span>
        <img 
          src={customLogo} 
          alt="Starlace Logo" 
          className="logo-icon" 
          draggable="false" 
          onContextMenu={(e) => e.preventDefault()}
          style={{ 
            width: '55px', 
            height: '55px', 
            userSelect: 'none',
            WebkitUserSelect: 'none',
            pointerEvents: 'none'
          }} 
        />
        <span>Memories</span>
      </div>

      <div className="header-controls">
        {pageType === 'main' && (
          <nav className="auth-buttons">
            <Link to="/login" className="btn-login">{t('header.login')}</Link>
            <Link to="/register" className="btn-register">{t('header.register')}</Link>
          </nav>
        )}

        {pageType === 'group' && (
          <button className="btn-profile" onClick={() => navigate('/profile')}>
            <Users size={22} />
            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{t('header.profile')}</span>
          </button>
        )}
        
        {['main', 'profile', 'invite'].includes(pageType) && (
          <div className="language-switcher">
            <button 
              className={`lang-btn ${currentLang.startsWith('uk') ? 'active' : ''}`}
              onClick={() => handleLanguageChange('uk')}
            >
              {t('header.lang_uk')}
            </button>
            <span className="lang-divider">|</span>
            <button 
              className={`lang-btn ${currentLang.startsWith('en') ? 'active' : ''}`}
              onClick={() => handleLanguageChange('en')}
            >
              {t('header.lang_en')}
            </button>
          </div>
        )}
        
        {pageType === 'profile' && (
          <button className="btn-logout" onClick={onLogout}>
            <LogOut size={22} />
            <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>{t('header.logout')}</span>
          </button>
        )}
      </div>
    </header>
  );
};

export default MainHeader;