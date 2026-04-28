import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Sparkles} from 'lucide-react';
import StarBackground from '../components/layout/StarBackground';
import GoogleAuthButton from '../components/ui/GoogleAuthButton';

const RegisterPage = () => {
    const API_URL = import.meta.env.VITE_API_BASE_URL;

    const [formData, setFormData] = useState({ username: '', email: '', password: '', confirmPassword: '' });
    const [errors, setErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        setErrors({ ...errors, [e.target.name]: '', general: '' });
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (!formData.username) newErrors.username = "Введіть ім'я користувача.";

    if (!formData.email) {
      newErrors.email = "Введіть електронну пошту.";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Невірний формат запису пошти.";
    }

    if (!formData.password) {
      newErrors.password = "Введіть пароль.";
    } else if (formData.password.length < 6) {
      newErrors.password = "Пароль має містити мінімум 6 символів.";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Паролі не співпадають.";
    }

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Щось пішло не так при реєстрації...');
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
        <h2 className="auth-title">Створити свій профіль</h2>
        
        <form className="auth-form" onSubmit={handleSubmit} noValidate>

          <div className="general-error">{errors.general}</div>

          <div className="input-group">
            <label>Ім'я користувача</label>
            <input type="text" name="username" className="glass-input" value={formData.username} onChange={handleChange} />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="input-group">
            <label>Електронна пошта</label>
            <input 
              type="email" 
              name="email" 
              className="glass-input" 
              placeholder="example@gmail.com" 
              value={formData.email} 
              onChange={handleChange} 
            />
            {errors.email && <span className="error-message">{errors.email}</span>}
          </div>

          <div className="input-group">
            <label>Пароль</label>
            <input type="password" name="password" className="glass-input" value={formData.password} onChange={handleChange} />
            {errors.password && <span className="error-message">{errors.password}</span>}
          </div>

          <div className="input-group">
            <label>Підтвердіть пароль</label>
            <input 
              type="password" 
              name="confirmPassword" 
              className="glass-input" 
              value={formData.confirmPassword} 
              onChange={handleChange} 
            />
            {errors.confirmPassword && <span className="error-message">{errors.confirmPassword}</span>}
          </div>

          <button 
            type="submit" 
            className="cta-button" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '1rem'}} disabled={isLoading}>
            {isLoading ? 'Збереження...' : 'Зареєструватися'}
          </button>
        </form>

        <div className="auth-divider">або</div>

        <GoogleAuthButton onError={(msg) => setErrors({ general: msg })} />
        
        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginTop: '0', marginBottom: '0' }}>
          Вже маєте зареєстрований профіль? <Link to="/login" className="auth-link">Увійти</Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;