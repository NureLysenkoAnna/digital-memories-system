import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {Sparkles, Plus, Dices, AlertCircle, ArrowUp} from 'lucide-react';

import StarBackground from '../components/StarBackground';
import MainHeader from '../components/MainHeader';
import GroupHeader from '../components/GroupHeader';
import EditGroupModal from '../components/EditGroupModal';
import DeleteGroupModal from '../components/DeleteGroupModal';
import CreatePostModal from '../components/CreatePostModal';
import PostCard from '../components/PostCard';
import PinnedPostsSlider from '../components/PinnedPostsSlider';
import GroupMembersModal from '../components/GroupMembersModal';
import DeletePostModal from '../components/DeletePostModal';
import PostDetailModal from '../components/PostDetailModal';
import LeaveGroupModal from '../components/LeaveGroupModal';
import MemoriesTab from '../components/MemoriesTab';
import TimelineFeed from '../components/TimelineFeed';
import PostsTab from '../components/PostsTab';
import { getUserFriendlyError } from '../utils/errorUtils';

// Хуки
import { useGroupPosts } from '../hooks/useGroupPosts';
import { useGroupPostActions } from '../hooks/useGroupPostActions';
import { useGroupSockets } from '../hooks/useGroupSockets';

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const getCurrentUserId = () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return null;
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.id;
    } catch (e) {
      return null;
    }
  };
  const currentUserId = getCurrentUserId();

  // UI Стани
  const [activeTab, setActiveTab] = useState('posts');
  const [toastMessage, setToastMessage] = useState('');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const searchBarRef = useRef(null);

  // Стани модалок
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [selectedPost, setSelectedPost] = useState(null);
  
  // Дані групи
  const [groupData, setGroupData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 4000); // Зникне через 4 сек
  };

  // ХУК ЧИТАННЯ (Posts Fetching)
  const {
    posts, setPosts, sortBy, setSortBy, searchQuery, setSearchQuery,
    hasAnyPosts, page, setPage, isLoadingMore, loadPosts, executeSearch,
    lastPostElementRef
  } = useGroupPosts(groupId, API_URL);

  // ХУК (Post Actions)
  const { handleTogglePin } = useGroupPostActions({
    API_URL, groupId, posts, setPosts, setSelectedPost, showToast
  });

  // ХУК ВЕБСОКЕТІВ
  useGroupSockets(API_URL, groupId, {
    onMemberRemoved: (removedUserId) => {
      if (String(removedUserId) === String(currentUserId)) {
        forceCloseAllModals(); 
        setError('Ваш доступ було змінено, або вас виключили з цього сузір\'я.'); 
      } else {
        loadGroupData(); 
      }
    },
    onGroupDeleted: () => {
      forceCloseAllModals();
      setError('Це сузір\'я було назавжди видалено власником.');
    }
  });

  const forceCloseAllModals = () => {
    setIsEditModalOpen(false); setIsDeleteModalOpen(false); setIsCreatePostModalOpen(false);
    setIsDeletePostModalOpen(false); setIsPostDetailModalOpen(false); setIsMembersModalOpen(false);
    setIsLeaveModalOpen(false);
  };

  const loadGroupData = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return navigate('/login');

      const response = await fetch(`${API_URL}/groups/${groupId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Помилка завантаження групи');

      const formattedDate = new Date(data.createdAt).toLocaleDateString('uk-UA');
      setGroupData({ ...data, createdAt: formattedDate });
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    const initializeData = async () => {
      setIsLoading(true);
      await loadGroupData();
      await loadPosts();
      setIsLoading(false);
    };
    initializeData();
  }, [groupId]);
  
  // Завантажуємо першу сторінку тільки при зміні сортування
  useEffect(() => {
    if (groupId && !isLoading) {
      setPage(1);
      loadPosts(true, searchQuery);
    }
  }, [sortBy]);
  
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  const handleToggleFavorite = async () => {
    const token = localStorage.getItem('token');
    try {
      setGroupData({ ...groupData, isFavorite: !groupData.isFavorite });
      const response = await fetch(`${API_URL}/groups/${groupId}/favorite`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) loadGroupData();
    } catch (err) {
      console.error('Помилка додавання в обране', err);
    }
  };

  const handleTagClick = (tag, e) => {
    if (e) e.preventDefault();
    
    setSearchQuery(tag);
    executeSearch(tag);
    
    if (searchBarRef.current) {
      const elementPosition = searchBarRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementPosition - 100, behavior: 'smooth' });
    }
  };
  
  const openDeletePostModal = (post) => {
    setPostToDelete(post);
    setIsDeletePostModalOpen(true);
  };
  
  const openPostDetail = (post) => {
    setSelectedPost(post);
    setIsPostDetailModalOpen(true);
  };
  
  // Оновлення стрічки та статистики (після створення/видалення)
  const handlePostsChanged = () => {
    setSearchQuery(''); // Очищення пошуку
    setPage(1); // повернення на першу сторінку
    loadPosts(true, ''); // завантаження нових постів
    loadGroupData();
  };

  const handleRandomMemory = () => {
    if (!posts || posts.length === 0) {
      showToast('У цій групі ще немає спогадів!');
      return;
    }

    const randomIndex = Math.floor(Math.random() * posts.length);
    const randomPost = posts[randomIndex];

    setSelectedPost(randomPost);
    setIsPostDetailModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="profile-container" style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' }}>
        <StarBackground />
        <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', zIndex: 1 }}>
          <Sparkles className="logo-icon spin" /> Завантаження сузір'я...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container error-page-wrapper">
        <StarBackground />
        <div className="error-state-content">
          <AlertCircle size={40} opacity={0.8} />
          {getUserFriendlyError(error)}
        </div>
        <button className="btn-profile" onClick={() => navigate('/profile')} style={{ zIndex: 1, marginTop: '1rem' }}>
          Повернутися до профілю
        </button>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <StarBackground />
      
      {/* МОДАЛКИ */}
      <EditGroupModal
        isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}
        groupData={groupData} onGroupUpdated={loadGroupData}
      />
      <DeleteGroupModal
        isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)}
        groupData={groupData} onGroupDeleted={() => navigate('/profile')}
      />
      <CreatePostModal
        isOpen={isCreatePostModalOpen} onClose={() => setIsCreatePostModalOpen(false)}
        groupId={groupId} onPostCreated={handlePostsChanged}
      />
      <DeletePostModal 
        isOpen={isDeletePostModalOpen} onClose={() => setIsDeletePostModalOpen(false)} 
        post={postToDelete} groupId={groupId} onPostDeleted={handlePostsChanged} 
      />
      <PostDetailModal 
        isOpen={isPostDetailModalOpen} onClose={() => setIsPostDetailModalOpen(false)} 
        post={selectedPost} currentUserId={currentUserId}
        userRole={groupData?.userRole || 'reader'} onPinToggle={handleTogglePin} 
        onDeleteClick={openDeletePostModal} onPostUpdated={loadPosts}
      />
      <GroupMembersModal 
        isOpen={isMembersModalOpen} onClose={() => setIsMembersModalOpen(false)} 
        groupId={groupId} currentUserId={currentUserId}
        currentUserRole={groupData?.userRole} onMembersUpdated={loadGroupData}
      />
      <LeaveGroupModal 
        isOpen={isLeaveModalOpen} onClose={() => setIsLeaveModalOpen(false)} 
        groupId={groupId} currentUserId={currentUserId} 
      />

      <MainHeader pageType="group" />

      {/* ШАПКА ГРУПИ */}
      <GroupHeader 
        groupData={groupData}
        onEdit={() => setIsEditModalOpen(true)}
        onMembers={() => setIsMembersModalOpen(true)}
        onDelete={() => setIsDeleteModalOpen(true)}
        onLeave={() => setIsLeaveModalOpen(true)}
        onToggleFavorite={handleToggleFavorite}
      />

      <div className="group-tabs">
        <button className={`tab-btn ${activeTab === 'posts' ? 'active' : ''}`} onClick={() => setActiveTab('posts')}>
          Всі публікації</button>
        <button className={`tab-btn ${activeTab === 'timeline' ? 'active' : ''}`} onClick={() => setActiveTab('timeline')}>
          Таймлайн</button>
        <button className={`tab-btn ${activeTab === 'memories' ? 'active' : ''}`} onClick={() => setActiveTab('memories')}>
          Спогади
        </button>
      </div>

      <div className="tab-content-wrapper" key={activeTab}>
        {activeTab === 'posts' && (
          <PostsTab
            posts={posts}
            hasAnyPosts={hasAnyPosts}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            executeSearch={executeSearch}
            searchBarRef={searchBarRef}
            setPage={setPage}
            loadPosts={loadPosts}
            sortBy={sortBy}
            setSortBy={setSortBy}
            currentUserId={currentUserId}
            userRole={groupData?.userRole || 'reader'}
            handleTogglePin={handleTogglePin}
            openDeletePostModal={openDeletePostModal}
            handleTagClick={handleTagClick}
            openPostDetail={openPostDetail}
            lastPostElementRef={lastPostElementRef}
            isLoadingMore={isLoadingMore}
            page={page}
          />
        )}

        {activeTab === 'timeline' && (
          <div className="timeline-section" style={{ padding: '1rem 0' }}>
            <TimelineFeed 
              groupId={groupId}
              onPostClick={openPostDetail}
            />
          </div>
        )}

        {activeTab === 'memories' && (
          <div className="memories-section" style={{ padding: '1rem 0' }}>
            <MemoriesTab
              groupId={groupId}
              posts={posts}
              currentUserId={currentUserId}
              userRole={groupData?.userRole || 'reader'}
              onPostClick={openPostDetail} 
            />
          </div>
        )}
      </div>

      <div className="fab-container">
        <button 
          className={`fab fab-scroll-top ${showScrollTop ? 'visible' : 'hidden'}`} 
          title="Нагору" 
          onClick={scrollToTop}
        >
          <ArrowUp size={32} />
        </button>

        {posts && posts.length > 0 && (
          <button className="fab fab-random" title="Випадковий спогад" onClick={handleRandomMemory}>
            <Dices size={28} className="dice-icon" />
          </button>
        )}
        {groupData?.userRole !== 'reader' && (
          <button className="fab fab-create" title="Створити публікацію" onClick={() => setIsCreatePostModalOpen(true)}>
            <Plus size={32} />
          </button>
        )}
      </div>

      {toastMessage && (
        <div className="toast-container">
          <div className="toast-notification">
            <AlertCircle size={20} />
            <span>{toastMessage}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupPage;