import { useState, useCallback } from 'react';

/**
 * Hook para paginación virtual (lazy loading)
 * Muestra elementos de 20 en 20 conforme el usuario hace scroll
 */
const useVirtualPagination = (items, itemsPerPage = 20) => {
  const [currentPage, setCurrentPage] = useState(1);

  // Calcular elementos visibles directamente (sin useEffect)
  const visibleItems = items.slice(0, currentPage * itemsPerPage);
  const hasMore = visibleItems.length < items.length;

  // Función para cargar más elementos
  const loadMore = useCallback(() => {
    if (hasMore) {
      setCurrentPage(prev => prev + 1);
    }
  }, [hasMore]);

  // Función para detectar si el usuario llegó al final del scroll
  const handleScroll = useCallback((e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    
    if (scrollHeight - scrollTop <= clientHeight + 100 && hasMore) {
      loadMore();
    }
  }, [hasMore, loadMore]);

  // Resetear cuando cambien los items
  if (currentPage > 1 && items.length <= itemsPerPage) {
    setCurrentPage(1);
  }

  return {
    visibleItems,
    hasMore,
    loadMore,
    handleScroll,
    totalItems: items.length,
    visibleCount: visibleItems.length
  };
};

export default useVirtualPagination;
