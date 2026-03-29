import React, { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

const PhotoViewerModal = ({ isOpen, onClose, images, initialIndex = 0 }) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(initialIndex);
    }
  }, [isOpen, initialIndex]);

  const showNext = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev + 1) % images.length);
  }, [images.length]);

  const showPrev = useCallback((e) => {
    e?.stopPropagation();
    setCurrentIndex((prev) => (prev - 1 + images.length) % images.length);
  }, [images.length]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
      if (images.length > 1) {
        if (e.key === 'ArrowRight') showNext();
        if (e.key === 'ArrowLeft') showPrev();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, showNext, showPrev, images.length]);

  if (!isOpen || !images || images.length === 0) return null;

  const hasMultipleImages = images.length > 1;

  return (
    <div className="photo-viewer-overlay" onClick={onClose}>
      <button className="photo-viewer-close" onClick={onClose} title="Закрити (Esc)">
        <X size={32} />
      </button>

      <div className="photo-viewer-container" onClick={(e) => e.stopPropagation()}>
        
        {hasMultipleImages && (
          <button className="photo-viewer-nav prev" onClick={showPrev} title="Попереднє (←)">
            <ChevronLeft size={48} />
          </button>
        )}

        <img 
          src={images[currentIndex]} 
          alt={`Фото ${currentIndex + 1}`} 
          className="photo-viewer-image"
        />

        {hasMultipleImages && (
          <button className="photo-viewer-nav next" onClick={showNext} title="Наступне (→)">
            <ChevronRight size={48} />
          </button>
        )}
        
        {hasMultipleImages && (
          <div className="photo-viewer-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoViewerModal;