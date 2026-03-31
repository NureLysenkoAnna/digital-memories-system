import React, { useMemo, useState } from 'react';
import { Star } from 'lucide-react';

const TimelineFeed = ({ posts, onPostClick }) => {
  const currentYearStr = new Date().getFullYear().toString();
  const currentMonthStr = new Date().toLocaleString('uk-UA', { month: 'long' });
  const currentMonthCapitalized = currentMonthStr.charAt(0).toUpperCase() + currentMonthStr.slice(1);

  const timelineData = useMemo(() => {
    if (!posts) return [];

    const photoPosts = posts.filter(post => post.images && post.images.length > 0 && post.date);
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

    return Object.entries(grouped)
      .sort(([yearA], [yearB]) => yearB - yearA)
      .map(([year, months]) => ({
        year,
        months: Object.entries(months).map(([month, days]) => ({
          month,
          isCurrent: year === currentYearStr && month === currentMonthCapitalized,
          days: Object.entries(days).map(([dateKey, dayPosts]) => ({
            dateKey,
            posts: dayPosts
          }))
        }))
      }));
  }, [posts, currentYearStr, currentMonthCapitalized]);

  const [expandedYears, setExpandedYears] = useState(() => {
    if (timelineData.length === 0) return [];
    const hasCurrentYear = timelineData.some(g => g.year === currentYearStr);
    return hasCurrentYear ? [currentYearStr] : [timelineData[0].year];
  });

  const [expandedMonths, setExpandedMonths] = useState(() => {
    if (timelineData.length === 0) return [];
    const defaultYear = timelineData.some(g => g.year === currentYearStr) ? currentYearStr : timelineData[0].year;
    const yearData = timelineData.find(g => g.year === defaultYear);
    return yearData ? yearData.months.map(m => `${defaultYear}-${m.month}`) : [];
  });

  const toggleYear = (year) => {
    setExpandedYears(prev => {
      if (prev.includes(year)) {
        return prev.filter(y => y !== year);
      } else {
        const yearData = timelineData.find(g => g.year === year);
        if (yearData) {
          const monthsToAdd = yearData.months.map(m => `${year}-${m.month}`);
          setExpandedMonths(prevMonths => Array.from(new Set([...prevMonths, ...monthsToAdd])));
        }
        return [...prev, year];
      }
    });
  };

  const toggleMonth = (monthKey) => {
    setExpandedMonths(prev => prev.includes(monthKey) ? prev.filter(m => m !== monthKey) : [...prev, monthKey]);
  };

  if (timelineData.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
        <p>Створіть свою історію та запаліть на ночному небі сузір'я зі спогадів!</p>
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
                            
                            {monthGroup.days.map((dayGroup, dIndex) => (
                              <div key={dayGroup.dateKey} className={`timeline-day-node ${dIndex % 2 === 0 ? 'left' : 'right'}`}>
                                
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
    </div>
  );
};

export default TimelineFeed;