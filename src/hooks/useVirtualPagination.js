import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook para paginación virtual (lazy loading)
 * Muestra elementos de 20 en 20 (u otro valor asignado) conforme el usuario hace scroll
 */
const useVirtualPagination = (items, itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);
  const prevItemsLengthRef = useRef(items.length);

  // Resetear cuando cambien los items (por ejemplo, cuando cambian los filtros)
  useEffect(() => {
    // Si la longitud de items cambió, resetear a la primera página
    if (prevItemsLengthRef.current !== items.length) {
      setCurrentPage(1);
      prevItemsLengthRef.current = items.length;
    }
  }, [items.length]);

  // Calcular elementos visibles directamente (sin useEffect)
  const visibleItems = items.slice(0, currentPage * itemsPerPage);
  const hasMore = visibleItems.length < items.length;

  // Función para cargar más elementos
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  // Soporte para IntersectionObserver
  const loaderRef = useRef(null);

  useEffect(() => {
    const currentLoader = loaderRef.current;
    if (!currentLoader || !hasMore) return;

    const observer = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting) {
        loadMore();
      }
    }, {
      root: null, // usa el viewport del ancestro scrollable más cercano
      rootMargin: '100px', // cargar un poco antes de llegar al final
      threshold: 0.1
    });

    observer.observe(currentLoader);

    return () => {
      if (currentLoader) {
        observer.unobserve(currentLoader);
      }
    };
  }, [loadMore, hasMore, visibleItems]);

  // Función para detectar si el usuario llegó al final del scroll (por retrocompatibilidad)
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  return {
    visibleItems,
    hasMore,
    loadMore,
    handleScroll,
    loaderRef,
    totalItems: items.length,
    visibleCount: visibleItems.length
  };
};

export default useVirtualPagination;
