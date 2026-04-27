import { useState, useRef, useCallback } from 'react';

export const useGroupPosts = (groupId, API_URL) => {
  const [posts, setPosts] = useState([]);
  const [sortBy, setSortBy] = useState('new_published');
  const [searchQuery, setSearchQuery] = useState('');
  const [hasAnyPosts, setHasAnyPosts] = useState(true);

  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  
  const observer = useRef();
  const POSTS_PER_PAGE = 10;

  const loadPosts = async (isNewSearch = false, query = searchQuery) => {
    try {
      const token = localStorage.getItem('token');
      const currentPage = isNewSearch ? 1 : page; 
      const offset = (currentPage - 1) * POSTS_PER_PAGE;
      
      setIsLoadingMore(true); 

      const response = await fetch(
        `${API_URL}/posts/group/${groupId}?sortBy=${sortBy}&search=${encodeURIComponent(query)}&limit=${POSTS_PER_PAGE}&offset=${offset}`, 
        { headers: { 'Authorization': `Bearer ${token}` } }
      );
      
      const data = await response.json();
      
      if (response.ok) {
        if (query === '') {
          setHasAnyPosts(data.totalPosts > 0); 
        }
        
        if (isNewSearch) {
          setPosts(data.posts);
        } else {
          setPosts(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const newPosts = data.posts.filter(p => !existingIds.has(p.id));
            return [...prev, ...newPosts];
          });
        }
        setHasMore(data.hasMore);
        setPage(currentPage + 1);
      }
    } catch (err) {
      console.error('Помилка завантаження публікацій', err);
    } finally {
      setIsLoadingMore(false);
    }
  };

  const executeSearch = (eOrQuery) => {
    if (eOrQuery && eOrQuery.preventDefault) eOrQuery.preventDefault();
    const query = typeof eOrQuery === 'string' ? eOrQuery : searchQuery;
    setPage(1);
    loadPosts(true, query);
  };

  const lastPostElementRef = useCallback(node => {
    if (isLoadingMore) return; 
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadPosts(false, searchQuery);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [isLoadingMore, hasMore, searchQuery, page]);

  return {
    posts, setPosts,
    sortBy, setSortBy,
    searchQuery, setSearchQuery,
    hasAnyPosts, page, setPage,
    isLoadingMore, loadPosts, executeSearch, lastPostElementRef
  };
};