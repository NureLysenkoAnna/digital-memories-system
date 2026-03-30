import React, { useState, useEffect } from 'react';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import PostCard from './PostCard';

const PinnedPostsSlider = ({ posts, currentUserId, userRole, onPinToggle, onDeleteClick, 
    onPostUpdated, onTagClick, onCommentClick }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next'); 

  useEffect(() => {
    if (currentIndex >= posts.length) {
      setCurrentIndex(Math.max(0, posts.length - 1));
    }
  }, [posts.length, currentIndex]);

  const nextPost = () => {
    setDirection('next');
    setCurrentIndex((prevIndex) => (prevIndex + 1) % posts.length);
  };

  const prevPost = () => {
    setDirection('prev');
    setCurrentIndex((prevIndex) => (prevIndex - 1 + posts.length) % posts.length);
  };

  if (!posts || posts.length === 0) return null;

  const safeIndex = currentIndex >= posts.length ? Math.max(0, posts.length - 1) : currentIndex;
  const currentPost = posts[safeIndex];

  return (
    <div className="pinned-slider-container">
      <div className="pinned-slider-header">
        <div className="pinned-header-title">
          <Sparkles size={18} color="var(--accent-silver)" fill="var(--accent-silver)"/>
          <span>Закріплені спогади ({posts.length})</span>
        </div>
        
        {posts.length > 1 && (
          <div className="pinned-navigation">
            <button className="btn-nav" onClick={prevPost} title="Попередній">
              <ChevronLeft size={18} />
            </button>
            <span className="pinned-counter">
              {currentIndex + 1} / {posts.length}
            </span>
            <button className="btn-nav" onClick={nextPost} title="Наступний">
              <ChevronRight size={18} />
            </button>
          </div>
        )}
      </div>

      <div 
        className={`pinned-slider-content slide-${direction}`} 
        key={safeIndex} 
      >
        <PostCard 
          post={currentPost}
          currentUserId={currentUserId}
          userRole={userRole}
          onPinToggle={onPinToggle}
          onDeleteClick={onDeleteClick}
          onPostUpdated={onPostUpdated}
          onTagClick={onTagClick}
          onCommentClick={onCommentClick}
          className="in-slider" 
        />
      </div>
    </div>
  );
};

export default PinnedPostsSlider;