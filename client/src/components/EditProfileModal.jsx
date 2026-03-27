import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, UploadCloud, User, Trash2 } from 'lucide-react';

const EditProfileModal = ({ isOpen, onClose, currentUserData, onProfileUpdated }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [formData, setFormData] = useState({ username: '', bio: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isAvatarRemoved, setIsAvatarRemoved] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && currentUserData) {
      setFormData({
        username: currentUserData.username || '',
        bio: currentUserData.bio || ''
      });
      setPreviewUrl(currentUserData.avatarUrl || '');
      setSelectedFile(null);
      setIsAvatarRemoved(false);
      setErrors({});
    }
  }, [isOpen, currentUserData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        return setErrors({ ...errors, avatar: 'Файл занадто великий. Максимум 10 МБ.' });
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setIsAvatarRemoved(false);
      setErrors({ ...errors, avatar: '', general: '' });
    }
  };

  const handleRemoveAvatar = () => {
    setPreviewUrl('');
    setSelectedFile(null);
    setIsAvatarRemoved(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.username.trim()) {
      newErrors.username = "Ім'я користувача не може бути порожнім";
    }

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let finalAvatarUrl = currentUserData.avatarUrl; 

      if (isAvatarRemoved) {
        finalAvatarUrl = '';
      }

      if (selectedFile) {
        const imageFormData = new FormData();
        imageFormData.append('image', selectedFile);

        const uploadRes = await fetch(`${API_URL}/upload`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData
        });

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Помилка завантаження фото');
        
        finalAvatarUrl = uploadData.imageUrl;
      }

      if (currentUserData.avatarUrl && (selectedFile || isAvatarRemoved)) {
        fetch(`${API_URL}/upload`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl: currentUserData.avatarUrl })
        }).catch(err => console.error('Не вдалося видалити старе фото з хмари', err));
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          username: formData.username,
          bio: formData.bio,
          avatarUrl: finalAvatarUrl
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Помилка оновлення профілю');

      onProfileUpdated(); 
      onClose();

    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content">
        
        <button className="btn-close-modal" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title">
          <Sparkles size={24} className="logo-icon" />
          Оновлення профілю
        </h2>

        <form className="auth-form" onSubmit={handleSubmit}>
          {errors.general && <div className="general-error">{errors.general}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div className="avatar-upload-container" onClick={() => fileInputRef.current.click()}>
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Аватар" className="image-preview" />
                  <div className="image-upload-overlay">
                    <UploadCloud size={24} />
                  </div>
                </>
              ) : (
                <>
                  <User size={36} opacity={0.6} />
                  <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>Додати</span>
                </>
              )}
              <input 
                type="file" 
                ref={fileInputRef}
                className="hidden-file-input"
                accept="image/jpeg, image/png, image/webp"
                onChange={handleFileChange}
                onClick={(e) => { e.target.value = null }}
              />
            </div>

            {previewUrl && (
              <button 
                type="button" 
                onClick={handleRemoveAvatar}
                style={{ 
                  background: 'transparent', border: 'none', color: '#ef4444', 
                  cursor: 'pointer', display: 'flex', alignItems: 'center', 
                  gap: '0.4rem', fontSize: '0.85rem', fontWeight: '500',
                  padding: '0.3rem 0.6rem', borderRadius: '6px', transition: 'all 0.2s'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <Trash2 size={16} /> Видалити поточне фото
              </button>
            )}
            
            {errors.avatar && <span className="error-message" style={{ textAlign: 'center', position: 'relative' }}>{errors.avatar}</span>}
          </div>

          <div className="input-group">
            <label>Ваше ім'я (Нікнейм)</label>
            <input 
              type="text" 
              name="username" 
              className="glass-input" 
              value={formData.username} 
              onChange={handleChange} 
              maxLength={50}
            />
            {errors.username && <span className="error-message">{errors.username}</span>}
          </div>

          <div className="modal-quote-box">
            <p className="profile-quote" style={{ fontSize: '0.9rem', margin: 0 }}>
              «Дивлячись на зоряне небо, який спогад засяяв би найяскравіше у вашій свідомості?»
            </p>
          </div>

          <div className="input-group">
            <textarea 
              name="bio" 
              className="glass-textarea" 
              value={formData.bio} 
              onChange={handleChange}
              placeholder="Залиште цей спогад тут..."
              maxLength={500}
              style={{ minHeight: '80px' }}
            />
          </div>

          <button type="submit" className="cta-button" style={{ width: '100%', justifyContent: 'center' }} disabled={isLoading}>
            {isLoading ? 'Збереження змін...' : 'Зберегти зміни'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;