import React from 'react';
import ConfirmModal from './ConfirmModal';

const DeletePostModal = ({ isOpen, onClose, post, groupId, onPostDeleted }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    const response = await fetch(`${API_URL}/posts/${post.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId })
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Помилка видалення публікації');
    }
    
    onPostDeleted(); 
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Видалити спогад?"
      description="Ви впевнені, що хочете назавжди видалити цю публікацію? 
      Всі фотографії, коментарі та реакції до неї також будуть знищені."
    />
  );
};

export default DeletePostModal;