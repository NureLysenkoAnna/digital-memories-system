import React, { useMemo, useRef, useState, useEffect } from 'react';
import { ChevronRight, ChevronLeft, CalendarHeart } from 'lucide-react';

// Функція для визначення номера тижня в році
const getWeekNumber = (d) => {
  const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const dayNum = date.getUTCDay() || 7;
  date.setUTCDate(date.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(date.getUTCFullYear(),0,1));
  return Math.ceil((((date - yearStart) / 86400000) + 1)/7);
};

const MemoriesTab = ({ posts, onPostClick }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Фільтрація спогадів
  const memoryData = useMemo(() => {
    if (!posts || posts.length === 0) return null;

    const today = new Date();
    const currentYear = today.getFullYear();
    const currentMonth = today.getMonth();
    const currentDate = today.getDate();
    const currentWeek = getWeekNumber(today);

    // тільки пости з фотографіями з минулих років
    const pastPhotoPosts = posts.filter(post => {
      if (!post.images || post.images.length === 0 || !post.date) return false;
      const postDateObj = new Date(post.date);
      return postDateObj.getFullYear() < currentYear;
    });

    if (pastPhotoPosts.length === 0) return null;

    // збіги за днем (події)
    const dayMatches = pastPhotoPosts.filter(post => {
      const d = new Date(post.date);
      return d.getMonth() === currentMonth && d.getDate() === currentDate;
    });

    if (dayMatches.length > 0) {
      const isExactlyOneYear = dayMatches.every(p => new Date(p.date).getFullYear() === currentYear - 1);
      return {
        type: 'day',
        title: isExactlyOneYear ? 'В цей день рік тому:' : 'В цей день роки тому:',
        items: dayMatches
      };
    }

    // збіги за тижнем
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
        items: weekMatches
      };
    }

    // збіги за поточним місяцем
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
        items: monthMatches
      };
    }

    return null;
  }, [posts]);

  // Перевірка, чи потрібні стрілочки
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

  // Функція для плавного скролу при натисканні на стрілочку
  const scroll = (direction) => {
    if (scrollRef.current) {
      const scrollAmount = 290; // На скільки пікселів зсувати
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
      setTimeout(checkScroll, 350);
    }
  };

  if (!memoryData) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'var(--text-muted)' }}>
        <h3 style={{ marginBottom: '0.5rem', color: 'var(--text-main)' }}>Немає спогадів!</h3>
        <p>На цей період у минулих роках ще не було збережено жодних спогадів з фотографіями.</p>
      </div>
    );
  }

  return (
    <div className="memories-container">
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

        <div 
          className="memory-carousel" 
          ref={scrollRef}
          onScroll={checkScroll}
        >
          {memoryData.items.map(post => (
            <div 
              key={post.id} 
              className="memory-card" 
              onClick={() => onPostClick(post)}
            >
              <div className="memory-image-wrapper">
                <img src={post.images[0]} alt="Спогад" />
                {post.images.length > 1 && (
                  <div className="memory-image-count">
                    +{post.images.length - 1}
                  </div>
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
      <hr className="section-divider" style={{ marginTop: '2.5rem', marginBottom: '0' }} />
    </div>
  );
};

export default MemoriesTab;