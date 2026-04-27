import { useEffect } from 'react';
import { io } from 'socket.io-client';

export const useProfileSockets = (API_URL, { onNewPost }) => {
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const SOCKET_URL = API_URL.replace('/api', '');
    const socket = io(SOCKET_URL);

    socket.on('new_post', (data) => {
      console.log('Знайдено новий спогад у групі:', data.groupId);
      if (onNewPost) {
        onNewPost(data.groupId);
      }
    });

    return () => {
      if (socket) socket.disconnect();
    };
  }, [API_URL, onNewPost]);
};