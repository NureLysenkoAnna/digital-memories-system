import React from 'react';
import PostContent from './PostContent';

const PostCard = (props) => {
  const { post, className, onError } = props;

  if (!post) return null;

  const pinnedStyle = props.post.is_pinned 
    ? {background: '#1f232b' } 
    : {};

  return (
    <div className={`glass-panel post-card ${className || ''}`} style={pinnedStyle}>
      <PostContent {...props} isModalView={false} onError={onError}/>
    </div>
  );
};

export default PostCard;