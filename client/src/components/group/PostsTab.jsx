import React from 'react';
import { useTranslation } from 'react-i18next';
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
  page,
  onError
}) => {
  // Фільтрування постів
  const { t } = useTranslation();
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
                placeholder={t('groups.posts_tab.search_placeholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              {searchQuery && (
                <div className="search-actions">
                  <button type="submit" className="search-action-btn submit" title={t('groups.posts_tab.search_btn_title')}>
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
                    title={t('groups.posts_tab.clear_search_btn_title')}
                  >
                    <X size={20} />
                  </button>
                </div>
              )}
            </form>
            
            <select className="filter-select" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="new_published">{t('groups.posts_tab.sort_new_published')}</option>
              <option value="event_new">{t('groups.posts_tab.sort_event_new')}</option>
              <option value="event_old">{t('groups.posts_tab.sort_event_old')}</option>
              <option value="popular">{t('groups.posts_tab.sort_popular')}</option>
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
          onError={onError}
        />
      )}

      <div>
        {regularPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            {searchQuery 
              ? t('groups.posts_tab.empty_search') 
              : (pinnedPosts.length > 0 ? t('groups.posts_tab.empty_no_more') : t('groups.posts_tab.empty_no_posts'))}
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
                  onError={onError}
                />
              </div>
            );
          })
        )}
      </div>

      {isLoadingMore && page > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '2rem 0', color: 'var(--text-muted)' }}>
          <Sparkles className="spin" size={20} style={{ marginRight: '0.5rem' }} />
          <span style={{ fontStyle: 'italic' }}>{t('groups.posts_tab.loading_more')}</span>
        </div>
      )}
    </>
  );
};

export default PostsTab;