import React from 'react';
import PostContent from './PostContent';

const PostCard = (props) => {
  const pinnedStyle = props.post.is_pinned 
    ? { borderColor: 'var(--accent-silver)', boxShadow: '0 0 15px var(--silver-glow)', background: 'rgba(255, 255, 255, 0.08)' } 
    : {};

  return (
    <div className="glass-panel post-card" style={pinnedStyle}>
      <PostContent {...props} isModalView={false} />
    </div>
  );
};

export default PostCard;