import React, { useMemo } from 'react';

const StarBackground = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 125 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 4 + 1}px`,
    }));
  }, []);

  return (
    <div className="stars-container">
      {stars.map((star) => (
        <div
          key={star.id}
          className="interactive-star"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
          }}
        />
      ))}
    </div>
  );
};

export default StarBackground;