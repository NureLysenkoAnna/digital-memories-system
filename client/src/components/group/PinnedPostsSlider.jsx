import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Sparkles, ChevronLeft, ChevronRight } from 'lucide-react';
import PostCard from '../post/PostCard';

const PinnedPostsSlider = ({ posts, currentUserId, userRole, onPinToggle, onDeleteClick, 
    onPostUpdated, onTagClick, onCommentClick, onError={onError}}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [direction, setDirection] = useState('next');
  const { t } = useTranslation();

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
          <span>{t('groups.pinned_slider.title', { count: posts.length })}</span>
        </div>
        
        {posts.length > 1 && (
          <div className="pinned-navigation">
            <button className="btn-nav" onClick={prevPost} title={t('groups.pinned_slider.prev_btn')}>
              <ChevronLeft size={18} />
            </button>
            <span className="pinned-counter">
              {currentIndex + 1} / {posts.length}
            </span>
            <button className="btn-nav" onClick={nextPost} title={t('groups.pinned_slider.next_btn')}>
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
          onError={onError}
          className="in-slider" 
        />
      </div>
    </div>
  );
};

export default PinnedPostsSlider;