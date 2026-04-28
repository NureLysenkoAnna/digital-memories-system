import React, { useState, useEffect, useRef } from 'react';
import { Send, Users } from 'lucide-react';
import PostContent from '../post/PostContent';

const PostDetailModal = (props) => {
  const { isOpen, onClose, post, currentUserId, onPostUpdated } = props;
  const API_URL = import.meta.env.VITE_API_BASE_URL;
  
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const commentsEndRef = useRef(null);

  useEffect(() => {
    if (isOpen && post) loadComments();
    else { setComments([]); setNewComment(''); }
  }, [isOpen, post]);

  useEffect(() => {
    if (commentsEndRef.current) commentsEndRef.current.scrollIntoView({ behavior: 'smooth' });
  }, [comments]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen || !post) return null;

  const loadComments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (res.ok) setComments(await res.json());
    } catch (err) { console.error(err); }
  };

  const handleSendComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/posts/${post.id}/comments`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment })
      });
      if (res.ok) {
        const addedComment = await res.json();
        setComments([...comments, addedComment]);
        setNewComment('');
        if (onPostUpdated) onPostUpdated();
      }
    } catch (err) { console.error(err); } 
    finally { setIsLoading(false); }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content post-detail-modal" onClick={(e) => e.stopPropagation()}>
        
        <div className="post-detail-top">
           <PostContent {...props} isModalView={true} />
        </div>
        <div className="post-detail-bottom">
          <div className="comments-list">
            {comments.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem 0' }}>Коментарів ще немає. Будьте першим!</div>
            ) : (
              comments.map(c => {
                const isMyComment = String(c.author.id) === String(currentUserId);
                return (
                  <div key={c.id} className="comment-bubble">
                    <div className="comment-header">
                      <div className="comment-author-info">
                        {c.author.avatar ? (
                          <img src={c.author.avatar} alt="Аватар" className="post-avatar" style={{ width: '30px', height: '30px' }} />
                        ) : (
                          <div className="post-avatar" style={{ width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Users size={16} color="var(--text-muted)" />
                          </div>
                        )}
                        <span style={{ fontWeight: isMyComment ? '700' : '600', color: isMyComment ? 'var(--text-main)' : 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isMyComment ? 'Ви' : c.author.name}
                          {c.author.is_member === false && !isMyComment && (
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: '400', opacity: '0.5' }}>
                              | колишній учасник
                            </span>
                          )}
                        </span>
                      </div>
                      <span className="comment-date">{new Date(c.created_at).toLocaleDateString('uk-UA')}</span>
                    </div>
                    <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.95rem', lineHeight: '1.5' }}>{c.content}</p>
                  </div>
                );
              })
            )}
            <div ref={commentsEndRef} />
          </div>

          <form className="comment-input-area" onSubmit={handleSendComment} spellCheck={false}>
            <div className="comment-input-wrapper">
              <input type="text" placeholder="Напишіть ваш коментар..." value={newComment} onChange={(e) => setNewComment(e.target.value)} disabled={isLoading} />
              <button type="submit" className="btn-send-comment" disabled={!newComment.trim() || isLoading}><Send size={20} /></button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PostDetailModal;