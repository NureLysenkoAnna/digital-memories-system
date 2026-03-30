import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Sparkles, Search, X, Plus, Dices, Image as ImageIcon, AlertCircle
} from 'lucide-react';
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

const GroupPage = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  // UI Стани
  const [activeTab, setActiveTab] = useState('posts');
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Стани модалок
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreatePostModalOpen, setIsCreatePostModalOpen] = useState(false);
  const [isDeletePostModalOpen, setIsDeletePostModalOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [isPostDetailModalOpen, setIsPostDetailModalOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState(null);
  const [isMembersModalOpen, setIsMembersModalOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false);

  // Стани даних
  const [groupData, setGroupData] = useState(null);
  const [posts, setPosts] = useState([]); 
  const [sortBy, setSortBy] = useState('new_published');
  const [searchQuery, setSearchQuery] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  const loadPosts = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${API_URL}/posts/group/${groupId}?sortBy=${sortBy}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) {
        setPosts(data);
      }
    } catch (err) {
      console.error('Помилка завантаження публікацій', err);
    }
  };

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

  const showToast = (message) => {
    setToastMessage(message);
    setTimeout(() => {
      setToastMessage('');
    }, 4000); // Зникне через 4 сек
  };

  const openPostDetail = (post) => {
    setSelectedPost(post);
    setIsPostDetailModalOpen(true);
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

  useEffect(() => {
    if (groupData) loadPosts();
  }, [sortBy]);

  useEffect(() => {
    const handleClickOutside = () => setShowGroupMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

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

  const handleTogglePin = async (postId) => {
    const token = localStorage.getItem('token');
    try {
      const response = await fetch(`${API_URL}/posts/${postId}/pin`, {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ groupId })
      });
      
      if (response.ok) {
        loadPosts();
        return;
      }

      const contentType = response.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        const data = await response.json();
        showToast(data.error || 'Не вдалося закріпити публікацію');
      } else {
        console.error("Сервер повернув не JSON помилку:", await response.text());
        showToast('Сталася непередбачувана помилка на сервері');
      }

    } catch (err) {
      showToast('Помилка з\'єднання з сервером');
      console.error('Помилка мережі (catch):', err);
    }
  };

  const openDeletePostModal = (post) => {
    setPostToDelete(post);
    setIsDeletePostModalOpen(true);
  };

  // Оновлення стрічки та статистики (після створення/видалення)
  const handlePostsChanged = () => {
    loadPosts();
    loadGroupData(); // Завантажує нові лічильники постів та фотографій
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
      <div className="profile-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <StarBackground />
        <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', zIndex: 1 }}>
          <Sparkles className="logo-icon spin" /> Завантаження сузір'я...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="profile-container" style={{ display: 'flex', justifyContent: 'center',
        alignItems: 'center', height: '100vh', flexDirection: 'column', gap: '1rem' }}>
        <StarBackground />
        <div style={{ color: '#ef4444', zIndex: 1, fontSize: '1.2rem' }}>{error}</div>
        <button className="btn-profile" onClick={() => navigate('/profile')}
        style={{ zIndex: 1 }}>Повернутися до профілю</button>
      </div>
    );
  }

  // Пошук
  const filteredPosts = posts.filter((post) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase().trim();
    // 1. Пошук за текстом
    const textMatch = post.text?.toLowerCase().includes(query);
    // 2. Пошук за тегами
    const tagMatch = post.tags?.some(tag => tag.toLowerCase().includes(query));
    // 3. Пошук за іменем автора
    const authorMatch = post.author?.name.toLowerCase().includes(query);
    // 4. Пошук за датою події
    const eventDate = new Date(post.date).toLocaleDateString('uk-UA');
    const eventDateMatch = eventDate.includes(query);
    // 5. Пошук за датою публікації
    const publishDate = new Date(post.created_at).toLocaleDateString('uk-UA');
    const publishDateMatch = publishDate.includes(query);

    return textMatch || tagMatch || authorMatch || eventDateMatch || publishDateMatch;
  });

  const pinnedPosts = filteredPosts.filter(post => post.is_pinned);
  const regularPosts = filteredPosts.filter(post => !post.is_pinned);

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
      </div>

      {activeTab === 'posts' && (
        <>
          <div className="search-filter-bar">
            <div className="search-input-wrapper" style={{ position: 'relative', flex: 1, display: 'flex', alignItems: 'center' }}>
              <Search className="search-icon" size={20} />
              <input 
                type="text" 
                className="search-input" 
                placeholder="Пошук..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingRight: '2.5rem' }}
              />

              {searchQuery && (
                <button 
                  className="btn-clear-search" 
                  onClick={() => setSearchQuery('')}
                  title="Очистити пошук"
                >
                  <X size={18} />
                </button>
              )}
            </div>
            
            <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="new_published">Нові публікації</option>
              <option value="event_new">Хронологія: нові події</option>
              <option value="event_old">Хронологія: старі події</option>
              <option value="popular">Найпопулярніші</option>
            </select>
          </div>

          <hr className="section-divider" />

          {pinnedPosts.length > 0 && (
            <PinnedPostsSlider 
              posts={pinnedPosts} 
              currentUserId={currentUserId}
              userRole={groupData?.userRole}
              onPinToggle={handleTogglePin}
              onDeleteClick={openDeletePostModal}
              onPostUpdated={loadPosts}
              onTagClick={setSearchQuery}
              onCommentClick={openPostDetail}
            />
          )}

          <div>
            {regularPosts.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
                {searchQuery ? 'За вашим запитом нічого не знайдено.' : (pinnedPosts.length > 0 ? 'Більше немає публікацій.' : 'Тут ще немає спогадів. Створіть перший!')}
              </div>
            ) : (
              regularPosts.map((post) => (
                <PostCard 
                  key={post.id} 
                  post={post} 
                  currentUserId={currentUserId}
                  userRole={groupData?.userRole || 'reader'}
                  onPinToggle={handleTogglePin}
                  onDeleteClick={openDeletePostModal}
                  onTagClick={setSearchQuery}
                  onCommentClick={openPostDetail}
                />
              ))
            )}
          </div>
        </>
      )}

      {activeTab === 'timeline' && (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          <h3>Таймлайн у розробці</h3>
          <p>Тут буде відображено хронологічну лінію ваших спогадів.</p>
        </div>
      )}

      <div className="fab-container">
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