import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles, LogOut, Users } from 'lucide-react';

const Header = ({ pageType, onLogout }) => {
  const navigate = useNavigate();

  return (
    <header className="glass-header">
        
      <div className="logo-container">
        <span>Starlace</span>
        <Sparkles className="logo-icon" size={32} />
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

export default Header;