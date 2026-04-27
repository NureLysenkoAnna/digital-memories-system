import React, { useState, useRef } from 'react';
import { X, Sparkles, UploadCloud, Image as ImageIcon } from 'lucide-react';
import { compressSingleImage } from '../utils/imageUtils';

const CreateGroupModal = ({ isOpen, onClose, onGroupCreated }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  
  // Cтани для файлу
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setErrors({ ...errors, [e.target.name]: '', general: '' });
  };

  // Обробка вибору файлу
  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      return setErrors({ ...errors, image: 'Файл занадто великий. Максимум 10 МБ.' });
    }

    setPreviewUrl(URL.createObjectURL(file));
    setErrors({ ...errors, image: '', general: '' });

    // Фонове стиснення
    setIsCompressing(true);
    const compressedFile = await compressSingleImage(file, { maxWidthOrHeight: 1280 });
    setSelectedFile(compressedFile);
    setIsCompressing(false);
  };

  const handleContainerClick = () => {
    fileInputRef.current.click();
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
      let finalImageUrl = '';

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

      const response = await fetch(`${API_URL}/groups`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name,
          description: formData.description,
          coverImageUrl: finalImageUrl // Передаємо посилання (або порожній рядок)
        })
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Помилка створення групи');

      setFormData({ name: '', description: '' });
      setSelectedFile(null);
      setPreviewUrl('');
      onGroupCreated(); 
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

          <h2 className="modal-title"><Sparkles size={24} className="logo-icon" />Створити сузір'я</h2>

          <form className="auth-form" onSubmit={handleSubmit} style={{marginTop: '-1rem' }} spellCheck={false}>
            <div className="general-error">{errors.general}</div>

              <div className="input-group">
                <label>Назва: </label>
                <input 
                  type="text" 
                  name="name" 
                  className="glass-input" 
                  value={formData.name} 
                  onChange={handleChange} 
                  placeholder="Дайте назву вашому простору..."
                  maxLength={100}
                />
                {errors.name && <span className="error-message">{errors.name}</span>}
              </div>

              <div className="input-group">
                  <label>Обкладинка (необов'язково):</label>
                  <div className="image-upload-container" onClick={handleContainerClick}>
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
                  />
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
                    placeholder="Про що буде розповідати саме ця історія?.."
                    maxLength={255}
                  />
              </div>

            <button 
              type="submit" 
              className="cta-button" 
              style={{ width: '100%', justifyContent: 'center', marginTop: '0.1rem' }} 
              disabled={isLoading || isCompressing}>
              {isCompressing ? 'Обробка зображення...' : (isLoading ? 'Створення...' : 'Запалити нове сузір\'я')}
            </button>
          </form>
        </div>
      </div>
  );
};

export default CreateGroupModal;