import { useState, useEffect, useRef, useCallback } from 'react';

const PAGE_SIZE = 12;

export function useInfiniteScroll(items) {
  const [page, setPage] = useState(1);
  const sentinelRef = useRef(null);

  // Reset to page 1 whenever the source list changes (filter/sort)
  useEffect(() => {
    setPage(1);
  }, [items]);

  const loadMore = useCallback(() => {
    setPage((p) => p + 1);
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) loadMore(); },
      { rootMargin: '200px' }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  const visibleItems = items.slice(0, page * PAGE_SIZE);
  const hasMore = visibleItems.length < items.length;

  return { visibleItems, hasMore, sentinelRef };
}
