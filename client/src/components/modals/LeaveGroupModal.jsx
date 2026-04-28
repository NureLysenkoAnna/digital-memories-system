import React from 'react';
import { MessageSquareWarning } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ConfirmModal from './ConfirmModal';

const LeaveGroupModal = ({ isOpen, onClose, groupId, currentUserId }) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  const navigate = useNavigate();

  const handleLeave = async () => {
    const token = localStorage.getItem('token');
    
    const response = await fetch(`${API_URL}/groups/${groupId}/members/${currentUserId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Помилка при виході з групи');
    }
    
    navigate('/profile');
  };

  return (
    <ConfirmModal 
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={handleLeave}
      title="Покинути групу?"
      description="Ви впевнені, що хочете покинути цю групу? Ви втратите доступ до всіх спогадів, фотографій та обговорень учасників."
      confirmText="Так, покинути"
      cancelText="Залишитися"
      Icon={MessageSquareWarning}
    />
  );
};

export default LeaveGroupModal;