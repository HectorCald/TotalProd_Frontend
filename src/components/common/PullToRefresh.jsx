import React, { useState, useRef, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './PullToRefresh.module.css';

function PullToRefresh({ children, onRefresh, threshold = 120, maxPull = 180, screenName = 'pantalla', containerStyle = {} }) {
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
    
    // Variable para rastrear si estamos en el tope
    let isAtTop = true;

    // Listener para detectar cambios en el scroll
    const handleScroll = () => {
      isAtTop = scrollContainer.scrollTop === 0;
    };

    // Handlers para touch (móvil)
    const handleTouchStart = (e) => {
      startY.current = e.touches[0].clientY;
      isPullingDown.current = false;
      
      // Solo permitir si estamos en el tope
      if (!isAtTop) {
        return;
      }
    };

    const handleTouchMove = (e) => {
      currentY.current = e.touches[0].clientY;
      
      // Solo activar pull to refresh si estamos en el tope Y moviéndose hacia abajo
      if (isAtTop && currentY.current > startY.current) {
        // Establecer que estamos haciendo pull down
        if (!isPullingDown.current) {
          isPullingDown.current = true;
        }
        
        e.preventDefault();
        
        const distance = Math.min(currentY.current - startY.current, maxPull);
        setPullDistance(distance);
        
        if (distance > 20) {
          setIsPulling(true);
        }
      } else {
        // Si no estamos en el tope o no nos movemos hacia abajo, resetear
        setIsPulling(false);
        setPullDistance(0);
        isPullingDown.current = false;
      }
    };

    const handleTouchEnd = () => {
      if (isPullingDown.current && pullDistance >= threshold && onRefresh) {
        setIsRefreshing(true);
        
        // Llamar función de refresh y mantener visible hasta que termine
        onRefresh().finally(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
          isPullingDown.current = false;
        });
      } else {
        // Solo resetear si no se activó el refresh
        setIsPulling(false);
        setPullDistance(0);
        isPullingDown.current = false;
      }
    };

    // Handlers para mouse (desktop)
    const handleMouseDown = (e) => {
      startY.current = e.clientY;
      isPullingDown.current = false;
      
      // Solo permitir si estamos en el tope
      if (!isAtTop) {
        return;
      }
    };

    const handleMouseMove = (e) => {
      currentY.current = e.clientY;
      
      // Solo activar pull to refresh si estamos en el tope Y moviéndose hacia abajo
      if (isAtTop && currentY.current > startY.current) {
        // Establecer que estamos haciendo pull down
        if (!isPullingDown.current) {
          isPullingDown.current = true;
        }
        
        e.preventDefault();
        
        const distance = Math.min(currentY.current - startY.current, maxPull);
        setPullDistance(distance);
        
        if (distance > 20) {
          setIsPulling(true);
        }
      } else {
        // Si no estamos en el tope o no nos movemos hacia abajo, resetear
        setIsPulling(false);
        setPullDistance(0);
        isPullingDown.current = false;
      }
    };

    const handleMouseUp = () => {
      if (isPullingDown.current && pullDistance >= threshold && onRefresh) {
        setIsRefreshing(true);
        
        // Llamar función de refresh y mantener visible hasta que termine
        onRefresh().finally(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullDistance(0);
          isPullingDown.current = false;
        });
      } else {
        // Solo resetear si no se activó el refresh
        setIsPulling(false);
        setPullDistance(0);
        isPullingDown.current = false;
      }
    };

    // Event listeners para scroll
    scrollContainer.addEventListener('scroll', handleScroll);

    // Event listeners para touch
    container.addEventListener('touchstart', handleTouchStart, { passive: false });
    container.addEventListener('touchmove', handleTouchMove, { passive: false });
    container.addEventListener('touchend', handleTouchEnd);

    // Event listeners para mouse
    container.addEventListener('mousedown', handleMouseDown);
    container.addEventListener('mousemove', handleMouseMove);
    container.addEventListener('mouseup', handleMouseUp);

    return () => {
      // Cleanup scroll events
      scrollContainer.removeEventListener('scroll', handleScroll);
      
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
               <BoxIcon name="refresh" className={`${styles.pullIcon} ${styles.spinning}`}></BoxIcon>
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
        className={styles.containerContent}
        style={{ 
          transform: isPulling ? `translateY(${Math.min(pullDistance * 0.3, 50)}px)` : 'translateY(0)',
          transition: isPulling ? 'none' : 'transform 0.3s ease',
          ...containerStyle
        }}
      >
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;
