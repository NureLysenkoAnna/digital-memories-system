import React from 'react';
import { Download } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const DownloadPhotosModal = ({ isOpen, onClose, post }) => {
  if (!isOpen || !post || !post.images) return null;

  const executeDownload = async () => {
    try {
      for (let i = 0; i < post.images.length; i++) {
        const imageUrl = post.images[i];
        
        try {
          const response = await fetch(imageUrl);
          const blob = await response.blob();
          const url = window.URL.createObjectURL(blob);
          
          const link = document.createElement('a');
          link.href = url;
          link.download = `starlace_photo_${post.id}_${i + 1}.jpg`;
          document.body.appendChild(link);
          link.click();
          
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
        } catch (fetchErr) {
          const link = document.createElement('a');
          link.href = imageUrl;
          link.download = `starlace_photo_${post.id}_${i + 1}.jpg`;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      }
      onClose();
    } catch (err) {
      throw new Error('Помилка завантаження фотографій');
    }
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={executeDownload}
      title="Завантажити фото?"
      description={`Ви впевнені, що хочете завантажити ${post.images.length > 1 ? `${post.images.length} фото` : 'цю фотографію'} на ваш пристрій?`}
      confirmText="Так, завантажити"
      Icon={Download}
      isDanger={false} 
    />
  );
};

export default DownloadPhotosModal;