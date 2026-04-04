import React, { useState, useEffect } from 'react';
import { MoreVertical, Users, Sparkles, Download, Trash2, MessageCircle, SmilePlus, Heart } from 'lucide-react';
import { Emoji, EmojiStyle } from 'emoji-picker-react';
import PhotoViewerModal from './PhotoViewerModal';
import DownloadPhotosModal from './DownloadPhotosModal';

const REACTION_TYPES = [
  { char: '❤️', unified: '2764-fe0f' },
  { char: '🔥', unified: '1f525' },
  { char: '✨', unified: '2728' },
  { char: '😮', unified: '1f62e' },
  { char: '😂', unified: '1f602' },
  { char: '😢', unified: '1f622' }
];

const PostContent = ({ 
  post, currentUserId, userRole, 
  onPinToggle, onDeleteClick, onTagClick, onCommentClick, onPostUpdated, 
  isModalView = false
}) => {
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [showMenu, setShowMenu] = useState(false);
  const [localReactions, setLocalReactions] = useState(post?.reactions || []);
  const [isPinned, setIsPinned] = useState(post?.is_pinned || false);
  
  const [isPhotoViewerOpen, setIsPhotoViewerOpen] = useState(false);
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);
  const [selectedPhotoIndex, setSelectedPhotoIndex] = useState(0);

  // Синхронізація з БД
  useEffect(() => {
    setLocalReactions(post?.reactions || []);
    setIsPinned(post?.is_pinned || false);
  }, [post?.reactions, post?.is_pinned]);

  useEffect(() => {
    const handleClickOutside = () => setShowMenu(false);
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Логіка доступу
  const isAuthor = post.author.id === currentUserId;
  const hasPhotos = post.images && post.images.length > 0;
  const canDelete = isAuthor || userRole === 'admin';
  const canPin = isAuthor || userRole === 'admin' || userRole === 'member';
  const hasMenuOptions = canPin || hasPhotos || canDelete;

  const handlePin = () => {
    setIsPinned(!isPinned);
    if (onPinToggle) onPinToggle(post.id);
    setShowMenu(false);
  };

  const handleReaction = async (emoji, e) => {
    e.stopPropagation();
    const existingIndex = localReactions.findIndex(r => String(r.user_id) === String(currentUserId));
    let newReactions = [...localReactions];

    if (existingIndex !== -1) {
      if (newReactions[existingIndex].reaction === emoji) newReactions.splice(existingIndex, 1);
      else newReactions[existingIndex].reaction = emoji;
    } else {
      newReactions.push({ user_id: currentUserId, reaction: emoji, isOptimistic: true });
    }

    setLocalReactions(newReactions);
    post.reactions = newReactions;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/${post.id}/reactions`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reaction: emoji })
      });
      if (res.ok && onPostUpdated) onPostUpdated();
      else if (!res.ok) setLocalReactions(post.reactions || []);
    } catch (err) {
      console.error('Помилка додавання реакції:', err);
      setLocalReactions(post.reactions || []);
    }
  };

  const handlePhotoClick = (index, e) => {
    e.stopPropagation();
    setSelectedPhotoIndex(index);
    setIsPhotoViewerOpen(true);
  };

  const handleDownloadClick = (e) => {
    e.stopPropagation();
    setShowMenu(false);
    setIsDownloadModalOpen(true);
  };

  const groupedReactions = Object.values(localReactions.reduce((acc, r) => {
    if (!acc[r.reaction]) {
      acc[r.reaction] = { reaction: r.reaction, count: 0, hasMine: false };
    }
    acc[r.reaction].count += 1;
    if (String(r.user_id) === String(currentUserId)) {
      acc[r.reaction].hasMine = true;
    }
    return acc;
  }, {})).sort((a, b) => b.count - a.count);

  return (
    <>
      <div className="post-header" style={{ marginBottom: '1rem' }}>
        <div className="post-author-info">
          {post.author.avatar ? (
            <img src={post.author.avatar} alt="Аватар" className="post-avatar" />
          ) : (
            <div className="post-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={24} color="var(--text-muted)" />
            </div>
          )}
          <div>
            <h4 style={{ margin: '0 0 0.3rem 0', fontSize: '1.1rem' }}>{post.author.name}</h4>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: isModalView ? '0.85rem' : '0.9rem', color: 'var(--text-muted)' }}>
              <span title="Дата події" style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: 'var(--text-main)', fontWeight: '500' }}>
                Дата події: {new Date(post.date).toLocaleDateString('uk-UA')}
              </span>
              <span style={{ opacity: 0.4 }}>|</span>
              <span title="Дата публікації" style={{ opacity: 0.7 }}>
                Опубліковано: {new Date(post.created_at).toLocaleDateString('uk-UA')}
              </span>
            </div>
          </div>
        </div>

        <div style={{ position: 'relative', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          {isPinned && <Sparkles size={20} color="var(--accent-silver)" fill="var(--accent-silver)" opacity={0.8} />}
          {hasMenuOptions && (
            <>
              <button className="btn-options" onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}>
                <MoreVertical size={20} />
              </button>
              
              {showMenu && (
                <div className="dropdown-menu" onClick={(e) => e.stopPropagation()}>
                  {canPin && (
                    <button className="dropdown-item" onClick={handlePin}>
                      <Sparkles size={18} fill={isPinned ? "none" : "currentColor"} /> 
                      {isPinned ? 'Відкріпити' : 'Закріпити'}
                    </button>
                  )}
                  {hasPhotos && (
                    <button className="dropdown-item" onClick={handleDownloadClick}>
                      <Download size={18} /> Завантажити фото
                    </button>
                  )}
                  {canDelete && (
                    <button className="dropdown-item danger" onClick={() => { onDeleteClick(post); setShowMenu(false); }}>
                      <Trash2 size={18} /> Видалити
                    </button>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <p className="post-text">{post.text}</p>

      {hasPhotos && (
        <div className={
          isModalView 
            ? `modal-photo-grid ${post.images.length === 1 ? 'single-image' : ''}` 
            : `post-photo-grid grid-${Math.min(post.images.length, 5)}`
        }>
          {post.images.map((img, index) => (
            <img key={index} src={img} alt={`Фото ${index + 1}`} onClick={(e) => handlePhotoClick(index, e)} />
          ))}
        </div>
      )}

      {isModalView && <hr style={{ border: 'none', borderTop: '1px solid var(--glass-border)', margin: '1rem 0' }} />}

      <div className="post-footer" style={{ borderTop: isModalView ? 'none' : '', paddingTop: isModalView ? '0' : '' }}>
        <div className="post-tags">
          {post.tags && post.tags.map((tag, idx) => (
            <span key={idx} className="post-tag" onClick={() => onTagClick && onTagClick(tag)}>{tag}</span>
          ))}
        </div>
        
        <div className="post-footer-actions">
          <div className="reaction-picker-container">
            {groupedReactions.length > 0 ? (
              <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                {groupedReactions.map(r => {
                  const reactionDef = REACTION_TYPES.find(rt => rt.char === r.reaction);
                  const unified = reactionDef ? reactionDef.unified : '2764-fe0f';
                  return (
                    <button
                      key={r.reaction}
                      className={`btn-interaction reaction-badge ${r.hasMine ? 'active-reaction' : ''}`}
                      onClick={(e) => handleReaction(r.reaction, e)}
                    >
                      <Emoji unified={unified} size={20} emojiStyle={EmojiStyle.APPLE} />
                      <span className={`activity-count ${r.hasMine ? 'active-reaction' : ''}`}>{r.count}</span>
                    </button>
                  );
                })}
                <button className="btn-interaction add-reaction-btn">
                  <SmilePlus size={23} className="empty-heart" />
                </button>
              </div>
            ) : (
              <button className="btn-interaction">
                <Heart size={21} className="empty-heart" />
              </button>
            )}

            {/* Випадаюче меню для вибору */}
            <div className="reaction-popover">
              {REACTION_TYPES.map(({ char, unified }) => (
                <button key={char} className="emoji-btn" onClick={(e) => handleReaction(char, e)}>
                  <Emoji unified={unified} size={23} emojiStyle={EmojiStyle.APPLE} />
                </button>
              ))}
            </div>
          </div>

          {!isModalView && <div className="action-divider"></div>}

          {!isModalView && (
            <button className="btn-interaction" onClick={() => onCommentClick && onCommentClick(post)}>
              <MessageCircle size={21} /> <span className="activity-count">{post.commentsCount || 0}</span>
            </button>
          )}
        </div>
      </div>

      <PhotoViewerModal 
        isOpen={isPhotoViewerOpen} onClose={() => setIsPhotoViewerOpen(false)} 
        images={post.images} initialIndex={selectedPhotoIndex} 
      />

      <DownloadPhotosModal 
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        post={post}
      />
    </>
  );
};

export default PostContent;