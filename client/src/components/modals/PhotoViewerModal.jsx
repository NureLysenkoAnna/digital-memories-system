import React, { useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useTranslation } from 'react-i18next';
import { X, ChevronLeft, ChevronRight, Download } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const PhotoViewerModal = ({ isOpen, onClose, images, initialIndex = 0, postId}) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isDownloadConfirmOpen, setIsDownloadConfirmOpen] = useState(false);

  const { t } = useTranslation();

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

  const executeDownload = async () => {
    const imageUrl = images[currentIndex];
    
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = url;
      link.download = `starlace_photo_${postId}_${currentIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (fetchErr) {
      const link = document.createElement('a');
      link.href = imageUrl;
      link.download = `starlace_photo_${postId}_${currentIndex + 1}.jpg`;
      link.target = '_blank';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setIsDownloadConfirmOpen(false);
    }
  };

  return createPortal(
    <div className="photo-viewer-overlay" onClick={onClose}>
      <button className="photo-viewer-button" onClick={onClose} title={t('groups.photo_viewer.close_title')}>
        <X size={32} />
      </button>

      <button 
        className="photo-viewer-button" style={{ right: '5rem' }}
        onClick={(e) => { e.stopPropagation(); setIsDownloadConfirmOpen(true); }} 
        title={t('groups.photo_viewer.download_title')}
      >
        <Download size={28} />
      </button>

      <div className="photo-viewer-container" onClick={(e) => e.stopPropagation()}>
        
        {hasMultipleImages && (
          <button className="photo-viewer-nav prev" onClick={showPrev} title={t('groups.photo_viewer.prev_title')}>
            <ChevronLeft size={48} />
          </button>
        )}

        <img 
          src={images[currentIndex]} 
          alt={`Фото ${currentIndex + 1}`} 
          className="photo-viewer-image"
        />

        {hasMultipleImages && (
          <button className="photo-viewer-nav next" onClick={showNext} title={t('groups.photo_viewer.next_title')}>
            <ChevronRight size={48} />
          </button>
        )}
        
        {hasMultipleImages && (
          <div className="photo-viewer-counter">
            {currentIndex + 1} / {images.length}
          </div>
        )}
      </div>

      <ConfirmModal 
        isOpen={isDownloadConfirmOpen}
        onClose={() => setIsDownloadConfirmOpen(false)}
        onConfirm={executeDownload}
        title={t('groups.download_modal.title')}
        description={t('groups.download_modal.desc_single')}
        confirmText={t('groups.download_modal.confirm_btn')}
        Icon={Download}
        isDanger={false} 
      />

    </div>,
    document.body
  );
};

export default PhotoViewerModal;