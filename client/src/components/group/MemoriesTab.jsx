import React, { useMemo, useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronRight, ChevronLeft, CalendarHeart, WandSparkles,
   Star, Flame, Heart, Clock, MessageCircle, MessageCircleHeart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;


// Словник іконок
const MILESTONE_ICONS = {
  'first-post': <Star size={20} />,
  'most-discussed': <Flame size={20} />,
  'latest-post': <Clock size={20} />,
  'first-comment': <MessageCircle size={20} />,
  'first-reaction': <Heart size={20} />,
  'first-comment-reaction': <MessageCircleHeart size={20} />,
  'latest-interaction': <Clock size={20} />,
};

const MemoriesTab = ({ groupId, posts, currentUserId, userRole, onPostClick }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  
  const { t, i18n } = useTranslation();
  const dateLocale = i18n.language === 'uk' ? 'uk-UA' : 'en-US';

  const [personalMilestones, setPersonalMilestones] = useState([]);
  const [memoryData, setMemoryData] = useState(null);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  useEffect(() => {
    const fetchMemoriesData = async () => {
      if (!groupId) return;
      
      setIsLoadingMilestones(true);
      setFetchError(null);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/posts/group/${groupId}/memories?role=${userRole}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPersonalMilestones(data.milestones || []);
          setMemoryData(data.calendarMemories || null);
        }else {
          setFetchError(true);
        }
      } catch (error) {
        console.error('Memory loading error:', error);
        setFetchError(true);
      } finally {
        setIsLoadingMilestones(false);
      }
    };

    fetchMemoriesData();
  }, [groupId, userRole, t]);

  // Перевірка скролу для стрілочок
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener('resize', checkScroll);
    return () => window.removeEventListener('resize', checkScroll);
  }, [memoryData]);

  // Функція для плавного скролу
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 290;
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (fetchError && !isLoadingMilestones) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <h3 style={{ marginBottom: '0.5rem', color: '#ef4444' }}>
          {t('groups.memories_tab.err_fetch_title')}
        </h3>
        <p>{t('groups.memories_tab.err_fetch_desc')}</p>
      </div>
    );
  }

  if (!memoryData && !isLoadingMilestones && personalMilestones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>{t('groups.memories_tab.empty_title')}</h3>
        <p>{t('groups.memories_tab.empty_desc')}</p>
      </div>
    );
  }

  return (
    <div className="memories-container">
      
      {memoryData && (
        <div className="memory-section">
          <h3 className="memory-title">
            <CalendarHeart size={25} className="memory-icon" />
            {memoryData.title}
          </h3>
          
          <div className="memory-carousel-wrapper">
            {canScrollLeft && (
              <button className="memory-nav prev" onClick={() => scroll('left')}>
                <ChevronLeft size={24} />
              </button>
            )}

            <div className="memory-carousel" ref={scrollRef} onScroll={checkScroll}>
              {memoryData.items.map(post => (
                <div key={post.id} className="memory-card" onClick={() => onPostClick(post)}>
                  <div className="memory-image-wrapper">
                    <img src={post.images[0]} alt="Спогад" />
                    {post.images.length > 1 && (
                      <div className="memory-image-count">+{post.images.length - 1}</div>
                    )}
                  </div>
                  <div className="memory-date">
                    {new Date(post.date).toLocaleDateString(dateLocale)}
                  </div>
                </div>
              ))}
            </div>

            {canScrollRight && memoryData.items.length > 3 && (
              <button className="memory-nav next" onClick={() => scroll('right')}>
                <ChevronRight size={24} />
              </button>
            )}
          </div>
        </div>
      )}

      {memoryData && (isLoadingMilestones || personalMilestones.length > 0) && (
        <hr className="section-divider" style={{ margin: '2.5rem 0' }} />
      )}

      {isLoadingMilestones ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
          {t('groups.memories_tab.loading_milestones')}
        </div>
      ) : personalMilestones.length > 0 && (
        <div className="memory-section">
          <h3 className="memory-title">
            <WandSparkles size={25} className="memory-icon" />
            {userRole === 'reader' 
              ? t('groups.memories_tab.title_reader') 
              : t('groups.memories_tab.title_contributor')}
          </h3>
          
          <div className="milestones-grid">
            {personalMilestones.map((milestone, index) => {
              // Динамічне отримання іконки та перекладу назви за ID
              const milestoneIcon = MILESTONE_ICONS[milestone.id];
              // Заміна дефіси на нижнє підкреслення, щоб відповідати ключам JSON
              const milestoneTitleKey = milestone.id.replace(/-/g, '_');
              const milestoneTitle = t(`groups.memories_tab.milestones.${milestoneTitleKey}`, milestone.id);
              
              if (!milestoneIcon || !milestone.post) return null;

              return (
                <div 
                  key={`${milestone.id}-${index}`} 
                  className="memory-card milestone-card-variant" 
                  onClick={() => onPostClick(milestone.post)}>
                  
                  <div className="memory-image-wrapper">
                    {milestone.post.images && milestone.post.images.length > 0 && (
                      <>
                        <img src={milestone.post.images[0]} alt={t('groups.memories_tab.alt_milestone')} />
                        {milestone.post.images.length > 1 && (
                          <div className="memory-image-count">+{milestone.post.images.length - 1}</div>
                        )}
                      </>
                    )}
                  </div>

                  <div className="memory-date">
                    {userRole !== 'reader' &&
                      new Date(
                        milestone.post.created_at || milestone.post.date
                      ).toLocaleDateString(dateLocale)
                    }
                  </div>

                  <div className="milestone-footer-badge">
                    {milestoneIcon}
                    <span>{milestoneTitle}</span>
                  </div>

                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default MemoriesTab;