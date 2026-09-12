import React, { useRef, useLayoutEffect, useState } from 'react';
import styles from './BotonCuadrante.module.css';

const BotonCuadrante = ({
  icon,
  title,
  description,
  onClick,
  isNew,
  isBuilding,
  anuncio,
  badge,
  badgeStatus = 'warning'
}) => {
  const textRef = useRef(null);
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const getBadgeClass = (status) => {
    switch (status) {
      case 'error': return styles.badgeError;
      case 'success': return styles.badgeSuccess;
      case 'info': return styles.badgeInfo;
      case 'warning':
      default: return styles.badgeWarning;
    }
  };

  const badgeText = typeof badge === 'object' ? badge.text : badge;
  const badgeType = typeof badge === 'object' ? (badge.status || badgeStatus) : badgeStatus;

  useLayoutEffect(() => {
    if (anuncio) return;

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
  }, [title, anuncio]);

  if (anuncio) {
    return (
      <div className={`${styles.menuItem} ${styles.anuncio}`} onClick={onClick}>
        {isNew && <span className={styles.newBadge}>NEW</span>}
        {isBuilding && <span className={styles.buildingBadge}><i className='bx bx-wrench'></i></span>}
        <div className={styles.anuncioIconWrapper}>
          <i className={`bx bx-${icon} ${styles.anuncioIcon}`}></i>
        </div>
        <div className={styles.anuncioContent}>
          <div className={styles.titleWrapper}>
            <h4 className={styles.anuncioTitle}>{title}</h4>
            {badgeText && (
              <span className={`${styles.badge} ${getBadgeClass(badgeType)}`}>
                {badgeText}
              </span>
            )}
          </div>
          {description && <p className={styles.anuncioDescription}>{description}</p>}
        </div>
      </div>
    );
  }

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
