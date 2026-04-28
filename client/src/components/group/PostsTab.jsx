import React from 'react';
import { Search, X, Sparkles } from 'lucide-react';
import PinnedPostsSlider from './PinnedPostsSlider';
import PostCard from '../post/PostCard';

const PostsTab = ({
  posts,
  hasAnyPosts,
  searchQuery,
  setSearchQuery,
  executeSearch,
  searchBarRef,
  setPage,
  loadPosts,
  sortBy,
  setSortBy,
  currentUserId,
  userRole,
  handleTogglePin,
  openDeletePostModal,
  handleTagClick,
  openPostDetail,
  lastPostElementRef,
  isLoadingMore,
  page
}) => {
  // Фільтрування постів
  const pinnedPosts = posts.filter(post => post.is_pinned);
  const regularPosts = posts.filter(post => !post.is_pinned);

  return (
    <>
      {hasAnyPosts && (
        <>
          <div className="search-filter-bar" ref={searchBarRef}>
            <form className="search-input-wrapper" onSubmit={executeSearch}>
              
              {!searchQuery && (
                <Search size={20} className="search-icon-empty" />
              )}

              <input 
                type="text" 
                className={`search-input ${searchQuery ? 'filled' : 'empty'}`}
                placeholder="Пошук спогадів..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery && (
                <div className="search-actions">
                  <button type="submit" className="search-action-btn submit" title="Шукати">
                    <Search size={18} />
                  </button>
                  <div className="search-divider"></div>
                  <button 
                    type="button"
                    className="search-action-btn clear"
                    onClick={() => {
                      setSearchQuery('');
                      setPage(1);
                      loadPosts(true, '');
                    }}
                    title="Очистити пошук"
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </form>
            
            <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="new_published">Нові публікації</option>
              <option value="event_new">Хронологія: нові події</option>
              <option value="event_old">Хронологія: старі події</option>
              <option value="popular">Найпопулярніші</option>
            </select>
          </div>

          <hr className="section-divider" />
        </>
      )}

      {pinnedPosts.length > 0 && (
        <PinnedPostsSlider 
          posts={pinnedPosts} 
          currentUserId={currentUserId}
          userRole={userRole}
          onPinToggle={handleTogglePin}
          onDeleteClick={openDeletePostModal}
          onPostUpdated={loadPosts}
          onTagClick={handleTagClick}
          onCommentClick={openPostDetail}
        />
      )}

      <div>
        {regularPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {searchQuery ? 'За вашим запитом нічого не знайдено.' : (pinnedPosts.length > 0 ? 'Більше немає публікацій.' : 'Тут ще немає спогадів. Створіть перший!')}
          </div>
        ) : (
          regularPosts.map((post, index) => {
            const isLastElement = regularPosts.length === index + 1;

            return (
              <div key={post.id} ref={isLastElement ? lastPostElementRef : null}>
                <PostCard 
                  post={post} 
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onPinToggle={handleTogglePin}
                  onDeleteClick={openDeletePostModal}
                  onTagClick={handleTagClick}
                  onCommentClick={openPostDetail}
                />
              </div>
            );
          })
        )}
      </div>

      {isLoadingMore && page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <Sparkles className="spin" size={20} style={{ marginRight: '0.5rem' }} />
          <span style={{ fontStyle: 'italic' }}>Завантаження спогадів...</span>
        </div>
      )}
    </>
  );
};

export default PostsTab;