import React from 'react';
import ConfirmModal from './ConfirmModal';

const DeleteGroupModal = ({ isOpen, onClose, groupData, onGroupDeleted }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  if (!groupData) return null;

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/groups/${groupData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Помилка видалення групи');
    }

    onGroupDeleted(); 
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title="Видалити групу?"
      description={
        <>
          Ви впевнені, що хочете видалити групу <strong>«{groupData.name}»</strong>? 
          Цю дію неможливо скасувати. Всі публікації, фотографії та коментарі будуть знищені назавжди.
        </>
      }
    />
  );
};

export default DeleteGroupModal;