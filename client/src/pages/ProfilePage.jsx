import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, User, Mail, Calendar, Plus, Image as ImageIcon, Star, Circle, AlertCircle } from 'lucide-react';
import StarBackground from '../components/layout/StarBackground';
import MainHeader from '../components/layout/MainHeader';
import CreateGroupModal from '../components/modals/CreateGroupModal';
import EditProfileModal from '../components/modals/EditProfileModal';
import { getUserFriendlyError } from '../utils/errorUtils';
import { useDelayedLoader } from '../hooks/useDelayedLoader';
import { useProfileSockets } from '../hooks/useProfileSockets';

const ProfilePage = () => {
  const navigate = useNavigate();
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [userData, setUserData] = useState(null);
  const [userGroups, setUserGroups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const showLoader = useDelayedLoader(isLoading, 300);
  const [error, setError] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const fetchGroups = async (token) => {
    const response = await fetch(`${API_URL}/groups`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!response.ok) throw new Error('Помилка завантаження груп');
    return await response.json();
  };

  const loadData = async () => {
    const token = localStorage.getItem('token');
    if (!token) return navigate('/login');

    setIsLoading(true);
    try {
      const [profileRes, groupsData] = await Promise.all([
        fetch(`${API_URL}/users/profile`, { headers: { 'Authorization': `Bearer ${token}` } }),
        fetchGroups(token)
      ]);

      const profileData = await profileRes.json();
      if (!profileRes.ok) {
        if (profileRes.status === 401) {
          localStorage.removeItem('token');
          return navigate('/login');
        }
        throw new Error(profileData.error || 'Помилка завантаження профілю');
      }

      const date = new Date(profileData.created_at);
      const formattedDate = date.toLocaleDateString('uk-UA');

      setUserData({
        username: profileData.username,
        email: profileData.email,
        createdAt: formattedDate,
        bio: profileData.bio,
        avatarUrl: profileData.avatar_url
      });
      
      setUserGroups(groupsData);

    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [navigate, API_URL]);

  // Відслідковування нових публікацій через WebSockets
  useProfileSockets(API_URL, {
    onNewPost: async () => {
      try {
        const token = localStorage.getItem('token');
        const updatedGroups = await fetchGroups(token);
        setUserGroups(updatedGroups);
      } catch (err) {
        console.error('Помилка фонового оновлення груп:', err);
      }
    }
  });

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/'); 
  };

  const handleGroupCreated = async () => {
    const token = localStorage.getItem('token');
    try {
      const updatedGroups = await fetchGroups(token);
      setUserGroups(updatedGroups);
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleFavorite = async (e, groupId) => {
    e.stopPropagation();
    const token = localStorage.getItem('token');
    
    try {
      setUserGroups(prevGroups => {
        const updatedGroups = prevGroups.map(g => 
          g.id === groupId ? { ...g, is_favorite: !g.is_favorite } : g
        );
        return updatedGroups.sort((a, b) => (b.is_favorite === a.is_favorite) ? 0 : b.is_favorite ? 1 : -1);
      });

      const response = await fetch(`${API_URL}/groups/${groupId}/favorite`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        const realGroups = await fetchGroups(token);
        setUserGroups(realGroups);
      }
    } catch (err) {
      console.error('Помилка додавання в обране', err);
    }
  };

  if (isLoading || !userData) {
    if (!showLoader) {
      return (
        <div className="profile-container">
          <StarBackground />
        </div>
      );
    }

    return (
      <div className="profile-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <StarBackground />
        <div style={{ color: 'var(--text-main)', fontSize: '1.2rem', zIndex: 1 }}>
          Завантаження сузір'я...
        </div>
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
      </div>
    );
  }

  return (
    <div className="profile-container">
      <StarBackground />
      
      <CreateGroupModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onGroupCreated={handleGroupCreated} 
      />

      <EditProfileModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        currentUserData={userData}
        onProfileUpdated={loadData}
      />
      
      <MainHeader pageType="profile" onLogout={handleLogout} />

      <div className="glass-panel user-card">
        <div className="avatar-container">
          {userData.avatarUrl ? (
            <img 
              src={userData.avatarUrl} 
              alt="Аватар користувача" 
              style={{ width: '100%', height: '100%', borderRadius: '22px', objectFit: 'cover' }} 
            />
          ) : (
            <User size={60} color="var(--accent-silver)" />
          )}
        </div>
        
        <div className="user-main-content">
          <div className="user-top-row">
            <div className="user-info">
              <h1 className="user-name">{userData.username}</h1>
              <div className="user-details">
                <span className="detail-item">
                  <Mail size={16} /> {userData.email}
                </span>
                <span className="detail-item">
                  <Calendar size={16} /> Історію розпочато: {userData.createdAt}
                </span>
              </div>
            </div>
            <button className="btn-edit-profile" onClick={() => setIsEditModalOpen(true)}>
              Оновити профіль</button>
          </div>

          <div className="user-quote-section">
            <p className="profile-quote">
              «Дивлячись на зоряне небо, який спогад засяяв би найяскравіше у вашій свідомості?»
            </p>
            <p className="user-bio" style={{ opacity: userData.bio ? 1 : 0.5 }}>
              {userData.bio || 'Додайте свою відповідь під час редагування профілю...'}
            </p>
          </div>
        </div>
      </div>

      <div className="groups-section">
        <h2 className="groups-section-title">
          <Sparkles size={28} className="logo-icon" /> 
          Мої сузір'я (Групи)
        </h2>
        
        <hr className="section-divider" />
        
        <div className="groups-grid">
          <div className="glass-panel group-card create-group-card" onClick={() => setIsModalOpen(true)}>
            <div className="plus-icon-container">
              <Plus size={36} />
            </div>
            <span style={{ fontWeight: '600', fontSize: '1.1rem' }}>Створити сузір'я</span>
          </div>

          {userGroups.map((group) => (
            <div key={group.id} className="glass-panel group-card"
              onClick={() => navigate(`/group/${group.id}`)}
              style={{ cursor: 'pointer' }}
            >
              <div className={`group-image-wrapper ${!group.cover_image_url ? 'default-group-bg' : ''}`}>
                  <button 
                    className={`btn-favorite ${group.is_favorite ? 'active' : ''}`}
                    onClick={(e) => handleToggleFavorite(e, group.id)}
                    title={group.is_favorite ? "Прибрати з обраного" : "Додати в обране"}
                  >
                    <Star size={18} />
                  </button>

                  {group.cover_image_url ? (
                    <img src={group.cover_image_url} alt={group.name} />
                  ) : (
                    <ImageIcon size={40} color="var(--text-muted)" opacity={0.5} />
                  )}
              </div>
              <div className="group-content">
                <h3 className="group-card-title">{group.name}</h3>

                <span className="group-card-members"
                  style={{ 
                    color: group.hasNewPosts ? 'var(--text-main)' : 'var(--text-muted)',
                    fontWeight: group.hasNewPosts ? '500' : 'normal',
                    marginTop: 'auto'
                  }}
                >
                  {group.hasNewPosts ? (
                    <>
                      <Circle size={10} color="#10b981" fill='#10b981' 
                      style={{ display: 'inline', marginRight: '6px' }}/>
                      Перегляньте нові спогади!
                    </>
                  ) : (
                    group.postsCount > 0 ? (
                      <>
                        <ImageIcon size={14} style={{ display: 'inline', marginRight: '6px', marginBottom: '-2px' }}/>
                        Спогадів: {group.postsCount}
                      </>
                    ) : (
                      'Спогадів ще немає. Створіть перші!'
                    )
                  )}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;