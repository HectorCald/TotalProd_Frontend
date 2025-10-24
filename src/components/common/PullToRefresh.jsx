import React, { useState, useRef, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './PullToRefresh.module.css';

function PullToRefresh({ children, onRefresh, threshold = 120, maxPull = 180, screenName = 'pantalla' }) {
  const [isPulling, setIsPulling] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [pullDistance, setPullDistance] = useState(0);
  const containerRef = useRef(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const isPullingDown = useRef(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Buscar el contenedor de scroll real (puede ser el container o un padre)
    const getScrollContainer = () => {
      let element = container;
      while (element && element !== document.body) {
        const style = window.getComputedStyle(element);
        if (style.overflowY === 'auto' || style.overflowY === 'scroll' || 
            style.overflow === 'auto' || style.overflow === 'scroll') {
          return element;
        }
        element = element.parentElement;
      }
      return container;
    };

    const scrollContainer = getScrollContainer();

    // Handlers para touch (móvil)
    const handleTouchStart = (e) => {
      startY.current = e.touches[0].clientY;
      isPullingDown.current = false;
      
      // Verificar si estamos en la parte superior al iniciar el touch
      const scrollTop = scrollContainer.scrollTop;
      if (scrollTop > 5) {
        // Si no estamos en la parte superior, no permitir pull-to-refresh
        return;
      }
    };

    const handleTouchMove = (e) => {
      currentY.current = e.touches[0].clientY;
      const scrollTop = scrollContainer.scrollTop;
      
      // Solo activar pull to refresh si estamos en la parte superior (con tolerancia de 5px)
      if (scrollTop <= 5 && currentY.current > startY.current) {
        e.preventDefault();
        isPullingDown.current = true;
        
        const distance = Math.min(currentY.current - startY.current, maxPull);
        setPullDistance(distance);
        
        if (distance > 20) {
          setIsPulling(true);
        }
      } else if (scrollTop > 5) {
        // Si no estamos en la parte superior, resetear el estado
        setIsPulling(false);
        setPullDistance(0);
        isPullingDown.current = false;
      }
    };

    const handleTouchEnd = () => {
      if (isPullingDown.current && pullDistance >= threshold && onRefresh) {
        setIsRefreshing(true);
        
        // Llamar función de refresh
        onRefresh().finally(() => {
          setIsRefreshing(false);
        });
      }
      
      // Reset
      setIsPulling(false);
      setPullDistance(0);
      isPullingDown.current = false;
    };

    // Handlers para mouse (desktop)
    const handleMouseDown = (e) => {
      startY.current = e.clientY;
      isPullingDown.current = false;
      
      // Verificar si estamos en la parte superior al iniciar el mouse
      const scrollTop = scrollContainer.scrollTop;
      if (scrollTop > 5) {
        // Si no estamos en la parte superior, no permitir pull-to-refresh
        return;
      }
    };

    const handleMouseMove = (e) => {
      currentY.current = e.clientY;
      const scrollTop = scrollContainer.scrollTop;
      
      // Solo activar pull to refresh si estamos en la parte superior (con tolerancia de 5px)
      if (scrollTop <= 5 && currentY.current > startY.current) {
        e.preventDefault();
        isPullingDown.current = true;
        
        const distance = Math.min(currentY.current - startY.current, maxPull);
        setPullDistance(distance);
        
        if (distance > 20) {
          setIsPulling(true);
        }
      } else if (scrollTop > 5) {
        // Si no estamos en la parte superior, resetear el estado
        setIsPulling(false);
        setPullDistance(0);
        isPullingDown.current = false;
      }
    };

    const handleMouseUp = () => {
      if (isPullingDown.current && pullDistance >= threshold && onRefresh) {
        setIsRefreshing(true);
        
        // Llamar función de refresh
        onRefresh().finally(() => {
          setIsRefreshing(false);
        });
      }
      
      // Reset
      setIsPulling(false);
      setPullDistance(0);
      isPullingDown.current = false;
    };

    // Event listeners para touch
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Event listeners para mouse
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Cleanup touch events
      container.removeEventListener('touchstart', handleTouchStart);
      container.removeEventListener('touchmove', handleTouchMove);
      container.removeEventListener('touchend', handleTouchEnd);
      
      // Cleanup mouse events
      container.removeEventListener('mousedown', handleMouseDown);
      container.removeEventListener('mousemove', handleMouseMove);
      container.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pullDistance, onRefresh, threshold, maxPull]);

  // Función para obtener el icono según la pantalla
  const getScreenIcon = () => {
    switch (screenName.toLowerCase()) {
      case 'inicio':
        return 'home';
      case 'clientes':
        return 'user';
      case 'proveedores':
        return 'truck';
      case 'almacen':
        return 'package';
      case 'movimientos':
        return 'transfer';
      case 'pedidos':
        return 'shopping-bag';
      case 'precios':
        return 'dollar';
      case 'gastos':
        return 'receipt';
      case 'deudas':
        return 'receipt';
      case 'reportes':
        return 'bar-chart-alt-2';
      case 'balance':
        return 'trending-up';
      default:
        return 'refresh';
    }
  };

  return (
    <div className={styles.pullToRefreshContainer}>
      {/* Área de pull to refresh que se expande desde arriba */}
      <div 
        className={styles.pullArea}
        style={{ 
          height: isPulling ? `${Math.min(pullDistance * 0.5, 70)}px` : '0px',
          opacity: isPulling ? 1 : 0,
          transition: isPulling ? 'none' : 'height 0.3s ease, opacity 0.3s ease'
        }}
      >
        <div className={styles.pullContent}>
          {isRefreshing ? (
            <>
              <BoxIcon name="refresh" style={{ animation: 'spin 1s linear infinite' }} className={styles.pullIcon}></BoxIcon>
              <span>Recargando {screenName}...</span>
            </>
          ) : pullDistance >= threshold ? (
            <>
              <BoxIcon name={getScreenIcon()} className={styles.pullIcon} />
              <span>Suelta para recargar {screenName}</span>
            </>
          ) : (
            <BoxIcon name="down-arrow-alt" className={styles.pullIconArrow} />
          )}
        </div>
      </div>

      {/* Contenido */}
      <div 
        ref={containerRef}
        style={{ 
          transform: isPulling ? `translateY(${Math.min(pullDistance * 0.3, 50)}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease'
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
