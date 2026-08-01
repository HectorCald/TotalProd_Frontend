import React, { useRef, useLayoutEffect, useState } from 'react';
import styles from './BotonCuadrante.module.css';

const BotonCuadrante = ({ icon, title, onClick, isNew, isBuilding }) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const adjustScale = () => {
      if (textRef.current && containerRef.current) {
        textRef.current.style.transform = 'none';
        
        const containerWidth = containerRef.current.clientWidth - 10;
        const textWidth = textRef.current.scrollWidth;
        
        if (textWidth > containerWidth && containerWidth > 0) {
          setScale(containerWidth / textWidth);
        } else {
          setScale(1);
        }
      }
    };

    adjustScale();
    
    const observer = new ResizeObserver(() => adjustScale());
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    
    return () => observer.disconnect();
  }, [title]);

  const displayTitle = typeof title === 'string' ? title.toUpperCase() : title;

  return (
    <div className={styles.menuItem} onClick={onClick} ref={containerRef}>
      {isNew && <span className={styles.newBadge}>NEW</span>}
      {isBuilding && <span className={styles.buildingBadge}><i className='bx bx-wrench'></i></span>}
      <i className={`bx bx-${icon} ${styles.icon}`}></i>
      <div style={{ width: '100%', overflow: 'hidden', display: 'flex', justifyContent: 'center' }}>
        <span 
          ref={textRef} 
          className={styles.title}
          style={{
            whiteSpace: 'nowrap',
            transform: `scale(${scale})`,
            transformOrigin: 'center',
            display: 'inline-block'
          }}
        >
          {displayTitle}
        </span>
      </div>
    </div>
  );
};

export default BotonCuadrante;
