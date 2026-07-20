import React, { useState, useRef } from 'react';
import styles from './Carousel.module.css';

const Carousel = ({ items, itemsPerPage = 4, renderItem }) => {
  const [currentPage, setCurrentPage] = useState(0);
  const containerRef = useRef(null);

  const pages = [];
  for (let i = 0; i < items.length; i += itemsPerPage) {
    pages.push(items.slice(i, i + itemsPerPage));
  }

  const handleScroll = () => {
    if (containerRef.current) {
      const scrollLeft = containerRef.current.scrollLeft;
      const clientWidth = containerRef.current.clientWidth;
      const pageIndex = Math.round(scrollLeft / clientWidth);
      if (pageIndex !== currentPage) {
        setCurrentPage(pageIndex);
      }
    }
  };

  return (
    <div className={styles.carouselWrapper}>
      <div 
        className={styles.carouselContainer} 
        ref={containerRef}
        onScroll={handleScroll}
      >
        {pages.map((page, pageIndex) => (
          <div key={pageIndex} className={styles.carouselPage}>
            {page.map((item, index) => renderItem(item, index))}
          </div>
        ))}
      </div>
      
      {pages.length > 1 && (
        <div className={styles.dots}>
          {pages.map((_, index) => (
            <div 
              key={index} 
              className={`${styles.dot} ${index === currentPage ? styles.active : ''}`} 
              onClick={() => {
                if (containerRef.current) {
                  containerRef.current.scrollTo({
                    left: index * containerRef.current.clientWidth,
                    behavior: 'smooth'
                  });
                }
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default Carousel;
