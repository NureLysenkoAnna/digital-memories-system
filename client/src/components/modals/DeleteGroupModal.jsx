import React from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmModal from './ConfirmModal';

const DeleteGroupModal = ({ isOpen, onClose, groupData, onGroupDeleted }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const { t } = useTranslation();

  if (!groupData) return null;

  const handleDelete = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/groups/${groupData.id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || t('groups.delete_group_modal.err_delete'));
    }

    onGroupDeleted(); 
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleDelete}
      title={t('groups.delete_group_modal.title')}
      description={
        <>
          {t('groups.delete_group_modal.desc_start')} 
          <strong>«{groupData.name}»</strong>
          {t('groups.delete_group_modal.desc_end')}
        </>
      }
    />
  );
};

export default DeleteGroupModal;