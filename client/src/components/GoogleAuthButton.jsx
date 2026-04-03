import React from 'react';
import { useNavigate } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';

const GoogleAuthButton = ({ onError }) => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const response = await fetch(`${API_URL}/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ googleToken: credentialResponse.credential }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Помилка авторизації через Google');
      }

      localStorage.setItem('token', data.token);
      navigate('/profile');

    } catch (err) {
      onError(err.message);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '0.1rem' }}>
      <GoogleLogin 
        onSuccess={handleGoogleSuccess} 
        onError={() => onError('Помилка зв\'язку з Google')}
        theme="filled_black"
        shape="pill"
        text="continue_with"
      />
    </div>
  );
};

export default GoogleAuthButton;