import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, UploadCloud, Calendar, Hash, Image as ImageIcon, Plus } from 'lucide-react';

const CreatePostModal = ({ isOpen, onClose, groupId, onPostCreated }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  // Отримання точної локальної дати (вирішує проблему з часовими поясами)
  const getTodayStr = () => {
    const local = new Date();
    local.setMinutes(local.getMinutes() - local.getTimezoneOffset());
    return local.toJSON().slice(0, 10);
  };

  // Стани форми
  const [content, setContent] = useState('');
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState('');
  const [eventDate, setEventDate] = useState(getTodayStr()); 
  
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const fileInputRef = useRef(null);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setContent('');
      setTags([]);
      setTagInput('');
      setEventDate(getTodayStr()); 
      setSelectedFiles([]);
      previewUrls.forEach(url => URL.revokeObjectURL(url));
      setPreviewUrls([]);
      setErrors({});
    }
  }, [isOpen]);

  useEffect(() => {
    if (errors.general) {
      const timer = setTimeout(() => {
        setErrors((prev) => ({ ...prev, general: '' }));
      }, 4000);
      return () => clearTimeout(timer); // Очищення таймера, при закритті компонента
    }
  }, [errors.general]);

  if (!isOpen) return null;

  // Блокування вибору майбутньої дати
  const handleDateChange = (e) => {
    const selected = e.target.value;
    const today = getTodayStr();
    
    // Якщо користувач ввів з клавіатури дату з майбутнього
    if (selected > today) {
      setErrors({ ...errors, date: 'Ви не можете обрати дату з майбутнього!' });
      setEventDate(today); // повертається на сьогодні
    } else {
      setErrors({ ...errors, date: '' });
      setEventDate(selected);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (selectedFiles.length + files.length > 5) {
      setErrors({ ...errors, images: 'Можна завантажити максимум 5 фотографій.' });
      return;
    }
    const newFiles = [];
    const newPreviews = [];
    let hasSizeError = false;
    files.forEach(file => {
      if (file.size > 10 * 1024 * 1024) {
        hasSizeError = true;
      } else {
        newFiles.push(file);
        newPreviews.push(URL.createObjectURL(file));
      }
    });
    if (hasSizeError) {
      setErrors({ ...errors, images: 'Деякі файли занадто великі. Максимум 10 МБ кожен.' });
    } else {
      setErrors({ ...errors, images: '' });
    }
    setSelectedFiles([...selectedFiles, ...newFiles]);
    setPreviewUrls([...previewUrls, ...newPreviews]);
  };

  const removeFile = (indexToRemove) => {
    setSelectedFiles(selectedFiles.filter((_, index) => index !== indexToRemove));
    URL.revokeObjectURL(previewUrls[indexToRemove]);
    setPreviewUrls(previewUrls.filter((_, index) => index !== indexToRemove));
  };

  const addTagFromInput = () => {
    const newTag = tagInput.trim().replace(/^#/, ''); 
    if (newTag && tags.length < 5 && !tags.includes(`#${newTag}`)) {
      setTags([...tags, `#${newTag}`]);
      setTagInput('');
      setErrors({ ...errors, tags: '' });
    } else if (tags.length >= 5) {
      setErrors({ ...errors, tags: 'Можна додати не більше 5 тегів.' });
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault(); 
      addTagFromInput();
    }
  };

  const removeTag = (indexToRemove) => {
    setTags(tags.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    if (!content.trim() && selectedFiles.length === 0) {
      return setErrors({ general: 'Додайте текст або хоча б одну фотографію, щоб зберегти спогад!' });
    }
    
    if (eventDate > getTodayStr()) {
        return setErrors({ date: 'Дата події не може бути в майбутньому.' });
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let finalImageUrls = [];
      if (selectedFiles.length > 0) {
        const imageFormData = new FormData();
        selectedFiles.forEach(file => { imageFormData.append('images', file); });
        const uploadRes = await fetch(`${API_URL}/upload/multiple`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${token}` },
          body: imageFormData
        });

        const contentType = uploadRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          throw new Error("Неможливо обробити одне з фото. Перевірте формат файлів.");
        }

        const uploadData = await uploadRes.json();
        if (!uploadRes.ok) throw new Error(uploadData.error || 'Помилка завантаження фотографій');
        finalImageUrls = uploadData.imageUrls;
      }
      const response = await fetch(`${API_URL}/posts`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ groupId, content: content.trim(), tags, eventDate, imageUrls: finalImageUrls })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Помилка створення публікації');
      onPostCreated(); 
      onClose();
    } catch (err) {
      setErrors({ general: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="glass-panel modal-content create-post-modal">
        
        <button className="btn-close-modal" onClick={onClose}>
          <X size={24} />
        </button>

        <h2 className="modal-title" style={{ marginBottom: '0' }}>
          <Sparkles size={24} className="logo-icon" />
          Зберегти спогад
        </h2>

        <form className="auth-form" onSubmit={handleSubmit} style={{ gap: '0.8rem', marginTop: '-1rem' }}>
          <div className="general-error">{errors.general}</div>

          <div className="input-group">
            <label className="big-label">
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ImageIcon size={18} /> Фотографії ({selectedFiles.length}/5)
              </span>
            </label>
            
            {selectedFiles.length < 5 && (
              <div 
                className="image-upload-container compact" 
                onClick={() => fileInputRef.current.click()}
              >
                <UploadCloud size={24} />
                <span style={{ fontSize: '1rem' }}>Натисніть, щоб обрати фото</span>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  className="hidden-file-input"
                  accept="image/jpeg, image/png, image/webp"
                  multiple 
                  onChange={handleFileChange}
                  onClick={(e) => { e.target.value = null }} 
                />
              </div>
            )}
            {previewUrls.length > 0 && (
              <div className="preview-gallery">
                {previewUrls.map((url, index) => (
                  <div key={index} className="preview-item">
                    <img src={url} alt={`Прев'ю ${index + 1}`} />
                    <button type="button" className="btn-remove-preview" onClick={() => removeFile(index)}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}
            {errors.images && <span className="error-message">{errors.images}</span>}
          </div>

          <div className="input-group">
            <label className="big-label">
              <Calendar size={18} /> Коли це сталося? 
              <span style={{ fontSize: '0.8rem', opacity: 0.5, fontWeight: '400' }}></span>
            </label>
            <input 
              type="date" 
              className="glass-input" 
              value={eventDate}
              onChange={handleDateChange}
              required
              max={getTodayStr()} 
            />
            {errors.date && <span className="error-message">{errors.date}</span>}
          </div>

          <div className="input-group">
            <label className="big-label">Опис спогаду:</label>
            <div className="textarea-wrapper">
              <textarea 
                className="glass-textarea big-textarea"
                value={content} 
                onChange={(e) => {
                  setContent(e.target.value);
                  
                  if (errors.general) setErrors({ ...errors, general: '' }); 
                }}
                placeholder="Розкажіть, як це було..."
                maxLength={500}
              />
              <span className={`char-counter-reverse ${content.length >= 500 ? 'over-limit' : ''}`}>
                Доступно {500 - content.length} символів.
              </span>
            </div>
          </div>

          <div className="input-group" style={{ marginTop: '0.5rem' }}>
            <label className="big-label">
              <Hash size={18} /> Теги (до 5 шт)
            </label>
            
            {tags.length > 0 && (
              <div className="tags-chips-container">
                {tags.map((tag, index) => (
                  <span key={index} className="tag-chip">
                    {tag}
                    <button type="button" className="tag-remove-btn" onClick={() => removeTag(index)}>
                      <X size={14} />
                    </button>
                  </span>
                ))}
              </div>
            )}

            <div className="tag-input-group">
              <input 
                type="text" 
                className="glass-input" 
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                placeholder={tags.length < 5 ? "Введіть тег" : "Досягнуто ліміт тегів"}
                disabled={tags.length >= 5}
                style={{ flex: 1 }}
              />
              <button 
                type="button" 
                className="btn-add-tag" 
                onClick={addTagFromInput}
                disabled={tags.length >= 5 || !tagInput.trim()}
                title="Додати тег"
              >
                <Plus size={20} />
              </button>
            </div>
            {errors.tags && <span className="error-message">{errors.tags}</span>}
          </div>

          <button 
            type="submit" 
            className="cta-button" 
            style={{ width: '100%', justifyContent: 'center', marginTop: '0.1rem' }} 
            disabled={isLoading}>
            {isLoading ? 'Збереження...' : 'Поділитися спогадом'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreatePostModal;