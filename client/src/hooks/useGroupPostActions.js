export const useGroupPostActions = ({ API_URL, groupId, posts, setPosts, setSelectedPost, showToast }) => {

  const handleTogglePin = async (postId) => {
    const token = localStorage.getItem('token');
    const postToUpdate = posts.find(p => p.id === postId);
    if (!postToUpdate) return;
    
    const isCurrentlyPinned = postToUpdate.is_pinned;

    // Бізнес-правило: ліміт 3 пости
    if (!isCurrentlyPinned) {
      const currentPinnedCount = posts.filter(p => p.is_pinned).length;
      if (currentPinnedCount >= 3) {
        showToast('У групі вже закріплено максимум публікацій (3). Відкріпіть одну з них, щоб закріпити нову.');
        return;
      }
    }

    // ОПТИМІСТИЧНЕ ОНОВЛЕННЯ
    const newPinnedStatus = !isCurrentlyPinned;
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: newPinnedStatus } : p));
    setSelectedPost(prev => (prev && prev.id === postId) ? { ...prev, is_pinned: newPinnedStatus } : prev);

    try {
      const response = await fetch(`${API_URL}/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ groupId })
      });
      
      if (!response.ok) {
        const contentType = response.headers.get("content-type");
        let errorMessage = 'Не вдалося змінити статус закріплення';
        if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          errorMessage = data.error || errorMessage;
        }
        throw new Error(errorMessage);
      }
    } catch (err) {
      // ВІДКАТ (ROLLBACK)
      setPosts(prev => prev.map(p => p.id === postId ? { ...p, is_pinned: isCurrentlyPinned } : p));
      setSelectedPost(prev => (prev && prev.id === postId) ? { ...prev, is_pinned: isCurrentlyPinned } : prev);
      showToast(err.message || 'Помилка з\'єднання з сервером');
    }
  };

  return { handleTogglePin };
};