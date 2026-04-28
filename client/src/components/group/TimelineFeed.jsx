import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { Star, Sparkles } from 'lucide-react';
import { useDelayedLoader } from '../../hooks/useDelayedLoader';

const API_URL = import.meta.env.VITE_API_BASE_URL;

const TimelineFeed = ({ groupId, onPostClick }) => {
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = new Date().toLocaleString('uk-UA', { month: 'long' });
  const currentMonthCapitalized = currentMonthStr.charAt(0).toUpperCase() + currentMonthStr.slice(1);

  const [timelinePosts, setTimelinePosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const showLoader = useDelayedLoader(isLoading, 300);
  
  const POSTS_PER_BATCH = 30;

  const loadTimelineHistory = useCallback(async (pageToLoad) => {
    if (isLoading) return;
    setIsLoading(true);
    
    try {
      const token = localStorage.getItem('token');
      const offset = (pageToLoad - 1) * POSTS_PER_BATCH;
      
      // сортування за датою події (event_new)
      const response = await fetch(
        `${API_URL}/posts/group/${groupId}?sortBy=event_new&limit=${POSTS_PER_BATCH}&offset=${offset}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      if (response.ok) {
        const data = await response.json();
        
        setTimelinePosts(prev => {
          const existingIds = new Set(prev.map(p => p.id));
          const newPosts = data.posts.filter(p => !existingIds.has(p.id));
          return [...prev, ...newPosts];
        });
        
        setHasMore(data.hasMore);
      }
    } catch (err) {
      console.error('Помилка завантаження таймлайну:', err);
    } finally {
      setIsLoading(false);
    }
  }, [groupId, isLoading]);

  useEffect(() => {
    if (groupId) {
      loadTimelineHistory(1);
    }
  }, [groupId]);

  const observer = useRef();
  const loadingTriggerRef = useCallback(node => {
    if (isLoading) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        setPage(prev => {
          const nextPage = prev + 1;
          loadTimelineHistory(nextPage);
          return nextPage;
        });
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoading, hasMore, loadTimelineHistory])

  const timelineData = useMemo(() => {
    if (!timelinePosts || timelinePosts.length === 0) return [];

    const photoPosts = timelinePosts.filter(post => post.images && post.images.length > 0 && post.date);
    photoPosts.sort((a, b) => new Date(b.date) - new Date(a.date));

    const grouped = {};
    photoPosts.forEach(post => {
      const d = new Date(post.date);
      const year = d.getFullYear().toString();
      const monthStr = d.toLocaleString('uk-UA', { month: 'long' });
      const month = monthStr.charAt(0).toUpperCase() + monthStr.slice(1);
      const dateKey = d.toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });

      if (!grouped[year]) grouped[year] = {};
      if (!grouped[year][month]) grouped[year][month] = {};
      if (!grouped[year][month][dateKey]) grouped[year][month][dateKey] = [];
      
      grouped[year][month][dateKey].push(post);
    });

    let globalDayCounter = 0; //Суцільний лічильник для чергування сторін відображення зірок

    return Object.entries(grouped)
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, months]) => ({
        year,
        months: Object.entries(months).map(([month, days]) => ({
          month,
          isCurrent: year === currentYearStr && month === currentMonthCapitalized,
          days: Object.entries(days).map(([dateKey, dayPosts]) => {
            const position = globalDayCounter % 2 === 0 ? 'left' : 'right';
            globalDayCounter++;
            
            return {
              dateKey,
              posts: dayPosts,
              position
            };
          })
        }))
      }));
  }, [timelinePosts, currentYearStr, currentMonthCapitalized]);

  const [expandedYears, setExpandedYears] = useState([]);
  const [expandedMonths, setExpandedMonths] = useState([]);

  // Авто-розкриття першого доступного року
  useEffect(() => {
    // Автоматичне розгортання тільки якщо щойно отримано ПЕРШУ порцію даних
    if (timelineData.length > 0 && expandedYears.length === 0 && timelinePosts.length <= POSTS_PER_BATCH) {
      const defaultYear = timelineData[0].year;
      setExpandedYears([defaultYear]);
      
      const yearData = timelineData.find(g => g.year === defaultYear);
      if (yearData) {
        setExpandedMonths(yearData.months.map(m => `${defaultYear}-${m.month}`));
      }
    }
  }, [timelineData]);

  const toggleYear = (year) => {
    setExpandedYears(prev => prev.includes(year) ? prev.filter(y => y !== year) : [...prev, year]);
  };

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => prev.includes(monthKey) ? prev.filter(m => m !== monthKey) : [...prev, monthKey]);
  };

  if (!isLoading && timelinePosts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <p>Створіть свою історію та запаліть на ночному небі сузір'я зі спогадів!</p>
      </div>
    );
  }

  if (showLoader && timelinePosts.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <Sparkles className="spin" size={24} style={{ marginBottom: '1rem', color: 'var(--accent-silver)' }} />
        <p>Побудова хронології...</p>
      </div>
    );
  }

  return (
    <div className="timeline-feed-container">
      {timelineData.map((yearGroup) => {
        const isExpanded = expandedYears.includes(yearGroup.year);

        return (
          <div key={yearGroup.year} className="timeline-year-section">
            
            <div className="timeline-year-marker">
              <span className={isExpanded ? 'active' : ''} onClick={() => toggleYear(yearGroup.year)}>
                {yearGroup.year}
              </span>
            </div>

            <div className={`timeline-accordion ${isExpanded ? 'open' : ''}`}>
              <div className="timeline-accordion-inner">
                
                {yearGroup.months.map((monthGroup, mIndex) => {
                  const monthKey = `${yearGroup.year}-${monthGroup.month}`;
                  const isMonthExpanded = expandedMonths.includes(monthKey);

                  return (
                    <div key={monthGroup.month} className="timeline-month-section">
                      <div className={`timeline-month-marker ${monthGroup.isCurrent ? 'current' : ''}`}>
                        <span 
                          className={isMonthExpanded ? 'active' : ''} 
                          onClick={() => toggleMonth(monthKey)}
                        >
                          {monthGroup.month}
                        </span>
                      </div>

                      <div className={`timeline-accordion ${isMonthExpanded ? 'open' : ''}`}>
                        <div className="timeline-accordion-inner">
                          <div className="timeline-days-wrapper">
                            
                            {monthGroup.days.map((dayGroup) => (
                              <div key={dayGroup.dateKey} className={`timeline-day-node ${dayGroup.position}`}>
                                
                                <div className="timeline-connector"></div>

                                <div className="timeline-star-cluster">
                                  {dayGroup.posts.map((post, pIndex) => {
                                    const sizeClass = pIndex === 0 ? 'star-large' : pIndex === 1 ? 'star-medium' : 'star-small';
                                    const starSize = pIndex === 0 ? 32 : pIndex === 1 ? 24 : 20;
                                    
                                    return (
                                      <div 
                                        key={post.id} 
                                        className={`timeline-star-wrapper ${sizeClass}`} 
                                        onClick={() => onPostClick(post)}
                                      >
                                        <div className="star-icon">
                                          <Star size={starSize} fill="currentColor" strokeWidth={1.5} />
                                        </div>

                                        <div className="timeline-tooltip">
                                          <div className="tooltip-image-ring">
                                            <img src={post.images[0]} alt="Спогад" />
                                          </div>
                                          <span className="tooltip-date">{dayGroup.dateKey}</span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        );
      })}

      {hasMore && (
        <div 
          ref={loadingTriggerRef} 
          style={{ 
            display: 'flex', 
            justifyContent: 'center', 
            padding: '2rem 0', 
            minHeight: '80px',
            overflowAnchor: 'none'}}>
          {showLoader ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Sparkles className="spin" size={20} />
              <span>Аналізуємо старі хроніки...</span>
            </div>
          ) : (
            <div style={{ height: '24px' }}></div>
          )}
        </div>
      )}
    </div>
  );
};

export default TimelineFeed;