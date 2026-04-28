import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, UploadCloud, Image as ImageIcon, Trash2 } from 'lucide-react';
import { compressSingleImage } from '../../utils/imageUtils';

const EditGroupModal = ({ isOpen, onClose, groupData, onGroupUpdated }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [isCoverRemoved, setIsCoverRemoved] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (isOpen && groupData) {
      setFormData({
        name: groupData.name || '',
        description: groupData.description || ''
      });
      setPreviewUrl(groupData.coverUrl || '');
      setSelectedFile(null);
      setIsCoverRemoved(false);
      setErrors({});
      setIsCompressing(false);
    }
  }, [isOpen, groupData]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return setErrors({ ...errors, image: 'Файл занадто великий. Максимум 10 МБ.' });
    }

    setPreviewUrl(URL.createObjectURL(file));
    setIsCoverRemoved(false);
    setErrors({ ...errors, image: '', general: '' });

    // Фонове стиснення
    setIsCompressing(true);
    const compressedFile = await compressSingleImage(file, { maxWidthOrHeight: 1280 });
    setSelectedFile(compressedFile);
    setIsCompressing(false);
  };

  const handleRemoveCover = (e) => {
    e.stopPropagation();
    setPreviewUrl('');
    setSelectedFile(null);
    setIsCoverRemoved(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    let newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Назва групи є обов\'язковою!';
    }

    if (Object.keys(newErrors).length > 0) {
      return setErrors(newErrors);
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let finalImageUrl = groupData.coverUrl;

      if (isCoverRemoved) {
        finalImageUrl = '';
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
          throw new Error("Файл не підтримується. Оберіть інший!");
        }

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Помилка завантаження фото');
        
        finalImageUrl = uploadData.imageUrl; 
      }

      // Видалення старого фото з хмари, якщо воно було і його замінили або видалили
      if (groupData.coverUrl && (selectedFile || isCoverRemoved)) {
        fetch(`${API_URL}/upload`, {
          method: 'DELETE',
          headers: { 
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ imageUrl: groupData.coverUrl })
        }).catch(err => console.error('Не вдалося видалити старе фото', err));
      }

      const response = await fetch(`${API_URL}/groups/${groupData.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          coverImageUrl: finalImageUrl 
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Помилка оновлення групи');

      onGroupUpdated(); 
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

        <h2 className="modal-title"><Sparkles size={24} className="logo-icon" />Редагувати групу</h2>

        <form className="auth-form" onSubmit={handleSubmit} style={{ marginTop: '-1rem' }} spellCheck={false}>
          <div className="general-error">{errors.general}</div>

          <div className="input-group">
            <label>Назва: </label>
            <input 
              type="text" 
              name="name" 
              className="glass-input" 
              value={formData.name} 
              onChange={handleChange} 
              maxLength={100}
            />
            {errors.name && <span className="error-message">{errors.name}</span>}
          </div>

          <div className="input-group">
            <label>Обкладинка (необов'язково):</label>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', width: '100%' }}>
              <div className="image-upload-container" onClick={() => fileInputRef.current.click()}>
                {previewUrl ? (
                    <>
                    <img src={previewUrl} alt="Попередній перегляд" className="image-preview" />
                    <div className="image-upload-overlay">
                        <UploadCloud size={24} style={{ marginRight: '8px' }}/> Змінити фото
                    </div>
                    </>
                ) : (
                    <>
                    <ImageIcon size={32} opacity={0.6} />
                    <span>Натисніть, щоб додати фото</span>
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
              
              {/* Кнопка видалення поточного фото */}
              {previewUrl && (
                <button 
                  type="button" 
                  onClick={handleRemoveCover}
                  style={{ 
                    background: 'transparent', border: 'none', color: '#ef4444', 
                    cursor: 'pointer', display: 'flex', alignItems: 'center', 
                    justifyContent: 'center', gap: '0.4rem', fontSize: '0.85rem', 
                    padding: '0.5rem', borderRadius: '8px', transition: 'all 0.2s'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Trash2 size={16} /> Видалити поточну обкладинку
                </button>
              )}
            </div>
            
            {errors.image && <span className="error-message" style={{ textAlign: 'center', width: '100%' }}>{errors.image}</span>}
          </div>

          <div className="input-group">
              <label>Опис (необов'язково): </label>
              <textarea 
                name="description" 
                className="glass-textarea" 
                value={formData.description} 
                onChange={handleChange}
                maxLength={255}
              />
          </div>

          <button 
            type="submit" 
            className="cta-button" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.1rem'  }} 
            disabled={isLoading || isCompressing}>
            {isCompressing ? 'Обробка зображення...' : (isLoading ? 'Збереження змін...' : 'Зберегти зміни')}
          </button>
        </form>
      </div>
    </div>
  );
};

export default EditGroupModal;