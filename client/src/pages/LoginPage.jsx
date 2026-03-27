import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles} from 'lucide-react';
import StarBackground from '../components/StarBackground';
import GoogleAuthButton from '../components/GoogleAuthButton';

const LoginPage = () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;
        
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '', general: '' });
    };

  // Стандартний вхід з email та паролем
  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.email) newErrors.email = 'Введіть електронну пошту.';
    if (!formData.password) newErrors.password = 'Введіть пароль.';

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }
    
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка авторизації');
      }

      localStorage.setItem('token', data.token);
      const pendingToken = localStorage.getItem('pendingInviteToken');
      if (pendingToken) {
        navigate(`/invite/${pendingToken}`);
      } else {
        navigate('/profile');
      }

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <StarBackground />
      <div className="glass-panel auth-glass-card">
        <h2 className="auth-title">
          <Sparkles className="logo-icon" size={28} />
          З поверненням 
          <Sparkles className="logo-icon" size={28} style={{ transform: "scaleX(-1)" }} /> 
        </h2>
        
        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="general-error">{errors.general}</div>

          <div className="input-group">
            <label>Електронна пошта</label>
            <input type="email" name="email" className="glass-input" placeholder="example@gmail.com" value={formData.email} onChange={handleChange} />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input type="password" name="password" className="glass-input" value={formData.password} onChange={handleChange} />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <button type="submit" className="cta-button" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
            {isLoading ? 'Завантаження...' : 'Увійти'}
          </button>
        </form>

        <div className="auth-divider">або</div>
        
        <GoogleAuthButton onError={(msg) => setErrors({ general: msg })} />

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
          Ще не маєте власного профілю? <Link to="/register" className="auth-link">Зареєструватися</Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;