import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CalendarHeart, WandSparkles,
   Star, Flame, Heart, Clock, MessageCircle, MessageCircleHeart } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_BASE_URL;

// Словник для автоматичної прив'язки іконок та текстів до серверних ID
const MILESTONE_UI_CONFIG = {
  'first-post': { title: 'Перша публікація', icon: <Star size={20} /> },
  'most-discussed': { title: 'Найбільш обговорювана', icon: <Flame size={20} /> },
  'latest-post': { title: 'Остання публікація', icon: <Clock size={20} /> },
  'first-comment': { title: 'Перший коментар', icon: <MessageCircle size={20} /> },
  'first-reaction': { title: 'Перша реакція', icon: <Heart size={20} /> },
  'first-comment-reaction': { title: 'Перший коментар та реакція', icon: <MessageCircleHeart size={20} /> },
  'latest-interaction': { title: 'Остання взаємодія', icon: <Clock size={20} /> },
};

// Функція для визначення номера тижня в році
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
};

const MemoriesTab = ({ groupId, posts, currentUserId, userRole, onPostClick }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const [personalMilestones, setPersonalMilestones] = useState([]);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);

  // Фільтрація календарних спогадів
  const memoryData = useMemo(() => {
    if (!posts || posts.length === 0) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const currentWeek = getWeekNumber(today);

    // Тільки пости з фотографіями з минулих років
    const pastPhotoPosts = posts.filter(post => {
      if (!post.images || post.images.length === 0 || !post.date) return false;
      return new Date(post.date).getFullYear() < currentYear;
    });

    if (pastPhotoPosts.length === 0) return null;

    // Збіги за днем (події)
    const dayMatches = pastPhotoPosts.filter(post => {
      const d = new Date(post.date);
      return d.getMonth() === currentMonth && d.getDate() === currentDate;
    });

    if (dayMatches.length > 0) {
      const isExactlyOneYear = dayMatches.every(p => new Date(p.date).getFullYear() === currentYear - 1);
      return { 
        type: 'day', 
        title: isExactlyOneYear ? 'В цей день рік тому:' : 'В цей день роки тому:', 
        items: dayMatches };
    }

    // Збіги за тижнем
    const weekMatches = pastPhotoPosts.filter(post => {
      const d = new Date(post.date);
      const projectedDate = new Date(currentYear, d.getMonth(), d.getDate());
      return getWeekNumber(projectedDate) === currentWeek;
    });

    if (weekMatches.length > 0) {
      const isExactlyOneYear = weekMatches.every(p => new Date(p.date).getFullYear() === currentYear - 1);
      return { 
        type: 'week', 
        title: isExactlyOneYear ? 'Події цього тижня рік тому:' : 'Події цього тижня роки тому:', 
        items: weekMatches };
    }

    // Збіги за поточним місяцем
    const monthMatches = pastPhotoPosts.filter(post => {
      return new Date(post.date).getMonth() === currentMonth;
    });

    if (monthMatches.length > 0) {
      const isExactlyOneYear = monthMatches.every(p => new Date(p.date).getFullYear() === currentYear - 1);
      const monthName = today.toLocaleString('uk-UA', { month: 'long' });
      const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
      return { 
        type: 'month', 
        title: isExactlyOneYear ? `Пригадайте ${capitalizedMonth} минулого року:` : `Пригадайте ${capitalizedMonth} минулих років:`, 
        items: monthMatches };
    }

    return null;
  }, [posts]);

  // 2. Завантаження особистих досягнень із сервера
  useEffect(() => {
    const fetchMilestones = async () => {
      if (!groupId) return;
      
      setIsLoadingMilestones(true);
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`${API_URL}/posts/group/${groupId}/milestones?role=${userRole}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
          const data = await response.json();
          setPersonalMilestones(data);
        }
      } catch (error) {
        console.error('Помилка завантаження досягнень:', error);
      } finally {
        setIsLoadingMilestones(false);
      }
    };

    fetchMilestones();
  }, [groupId, userRole]);

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

  if (!memoryData && !isLoadingMilestones && personalMilestones.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Немає спогадів!</h3>
        <p>На цей період у минулих роках не було збережено жодних спогадів із зображеннями.</p>
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
                    {new Date(post.date).toLocaleDateString('uk-UA')}
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
          Аналізуємо ваш внесок у групу...
        </div>
      ) : personalMilestones.length > 0 && (
        <div className="memory-section">
          <h3 className="memory-title">
            <WandSparkles size={25} className="memory-icon" />
            {userRole === 'reader' 
              ? 'Історія ваших взаємодій у спільній історії:' 
              : 'Ваш яскравий внесок у створення спільної історії:'}
          </h3>
          
          <div className="milestones-grid">
            {personalMilestones.map((milestone, index) => {
              // Зіставляємо ID із сервера з нашими іконками та назвами
              const uiConfig = MILESTONE_UI_CONFIG[milestone.id];
              
              if (!uiConfig || !milestone.post) return null;

              return (
                <div 
                  key={`${milestone.id}-${index}`} 
                  className="memory-card milestone-card-variant" 
                  onClick={() => onPostClick(milestone.post)}>
                  
                  <div className="memory-image-wrapper">
                    {milestone.post.images && milestone.post.images.length > 0 && (
                      <>
                        <img src={milestone.post.images[0]} alt="Досягнення" />
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
                      ).toLocaleDateString('uk-UA')
                    }
                  </div>

                  <div className="milestone-footer-badge">
                    {uiConfig.icon}
                    <span>{uiConfig.title}</span>
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