import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useGroupSockets = (API_URL, groupId, { onMemberRemoved, onGroupDeleted }) => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token || !groupId) return;

    const SOCKET_URL = API_URL.replace('/api', '');
    const socket = io(SOCKET_URL);

    socket.on('member_removed', (data) => {
      if (String(data.groupId) === String(groupId)) {
        onMemberRemoved(data.removedUserId);
      }
    });

    socket.on('group_deleted', (data) => {
      if (String(data.groupId) === String(groupId)) {
        onGroupDeleted();
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [API_URL, groupId, onMemberRemoved, onGroupDeleted]);
};