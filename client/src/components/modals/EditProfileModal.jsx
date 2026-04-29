import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Sparkles, UploadCloud, User, Trash2 } from 'lucide-react';
import { compressSingleImage } from '../../utils/imageUtils';

const EditProfileModal = ({ isOpen, onClose, currentUserData, onProfileUpdated }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation();
  
  const [formData, setFormData] = useState({ username: '', bio: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
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
      setIsCompressing(false);
    }
  }, [isOpen, currentUserData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return setErrors({ ...errors, avatar: t('common.image_upload.err_too_large') });
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsAvatarRemoved(false);
    setErrors({ ...errors, avatar: '', general: '' });

    setIsCompressing(true);
    
    const compressedFile = await compressSingleImage(file, { maxWidthOrHeight: 1024 }); 
    setSelectedFile(compressedFile);
    
    setIsCompressing(false);
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
      newErrors.username = t('profile.edit_modal.err_req_username');
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

        const contentType = uploadRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error(t('common.image_upload.err_unsupported'));
        }

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || t('common.image_upload.err_upload'));
        
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
        }).catch(err => console.error(t('common.image_upload.err_delete_old'), err));
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
      if (!response.ok) throw new Error(data.error || t('profile.edit_modal.err_update'));

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
          {t('profile.edit_modal.title')}
        </h2>

        <form className="auth-form" onSubmit={handleSubmit} spellCheck={false}>
          {errors.general && <div className="general-error">{errors.general}</div>}

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.8rem' }}>
            <div className="avatar-upload-container" onClick={() => fileInputRef.current.click()}>
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt={t('profile.userInfo.avatar_alt')} className="image-preview" />
                  <div className="image-upload-overlay">
                    <UploadCloud size={24} />
                  </div>
                </>
              ) : (
                <>
                  <User size={36} opacity={0.6} />
                  <span style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{t('common.image_upload.add_btn')}</span>
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
                <Trash2 size={16} /> {t('profile.edit_modal.remove_avatar')}
              </button>
            )}
            
            {errors.avatar && <span className="error-message" style={{ textAlign: 'center', position: 'relative' }}>{errors.avatar}</span>}
          </div>

          <div className="input-group">
            <label>{t('profile.edit_modal.username_label')}</label>
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
              {t('profile.userInfo.quote')}
            </p>
          </div>

          <div className="input-group">
            <textarea 
              name="bio" 
              className="glass-textarea" 
              value={formData.bio} 
              onChange={handleChange}
              placeholder={t('profile.edit_modal.bio_placeholder')}
              maxLength={500}
              style={{ minHeight: '80px' }}
            />
          </div>

          <button 
            type="submit" 
            className="cta-button" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.1rem'  }} 
            disabled={isLoading || isCompressing}>
            {isCompressing ? t('common.image_upload.processing') : (isLoading ? t('profile.edit_modal.saving') : t('profile.edit_modal.submit_btn'))}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditProfileModal;