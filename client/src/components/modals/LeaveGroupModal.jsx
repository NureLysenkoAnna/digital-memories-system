import React from 'react';
import { useTranslation } from 'react-i18next';
import { MessageSquareWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const LeaveGroupModal = ({ isOpen, onClose, groupId, currentUserId }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleLeave = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/groups/${groupId}/members/${currentUserId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || t('groups.leave_group_modal.err_leave'));
    }
    
    navigate('/profile');
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleLeave}
      title={t('groups.leave_group_modal.title')}
      description={t('groups.leave_group_modal.desc')}
      confirmText={t('groups.leave_group_modal.btn_confirm')}
      cancelText={t('groups.leave_group_modal.btn_cancel')}
      Icon={MessageSquareWarning}
    />
  );
};

export default LeaveGroupModal;