import React from 'react';
import { useTranslation } from 'react-i18next';
import { Download } from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const DownloadPhotosModal = ({ isOpen, onClose, post }) => {
  const { t } = useTranslation();

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
      throw new Error(t('groups.download_modal.err_download'));
    }
  };

  const imagesCount = post.images.length;
  const description = imagesCount > 1 
    ? t('groups.download_modal.desc_plural', { count: imagesCount })
    : t('groups.download_modal.desc_single');

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={executeDownload}
      title={t('groups.download_modal.title')}
      description={description}
      confirmText={t('groups.download_modal.confirm_btn')}
      Icon={Download}
      isDanger={false} 
    />
  );
};

export default DownloadPhotosModal;