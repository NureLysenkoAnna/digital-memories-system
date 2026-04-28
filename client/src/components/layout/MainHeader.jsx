import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogOut, Users } from 'lucide-react';
import customLogo from '../../assets/starlace-logo.png';

const MainHeader = ({ pageType, onLogout }) => {
  const navigate = useNavigate();

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

      {pageType === 'main' && (
        <nav className="auth-buttons">
          <Link to="/login" className="btn-login">Увійти</Link>
          <Link to="/register" className="btn-register">Зареєструватися</Link>
        </nav>
      )}

      {pageType === 'profile' && (
        <button className="btn-logout" onClick={onLogout}>
          <LogOut size={22} />
          <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>Вийти</span>
        </button>
      )}

      {pageType === 'group' && (
        <button className="btn-profile" onClick={() => navigate('/profile')}>
          <Users size={22} />
          <span style={{ fontSize: '1.1rem', fontWeight: '500' }}>Мій Профіль</span>
        </button>
      )}
    </header>
  );
};

export default MainHeader;