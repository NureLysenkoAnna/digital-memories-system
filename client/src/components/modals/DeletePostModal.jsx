import React from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

const DeletePostModal = ({ isOpen, onClose, post, groupId, onPostDeleted }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation();

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/posts/${post.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || t('groups.delete_post_modal.err_delete'));
    }
    
    onPostDeleted(); 
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title={t('groups.delete_post_modal.title')}
      description={t('groups.delete_post_modal.desc')}
    />
  );
};

export default DeletePostModal;