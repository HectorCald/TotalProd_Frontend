
import React, { useState, useRef, useEffect } from 'react';
import styles from './Carousel.module.css';

function Carousel({ children, onSlideChange }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isDragging, setIsDragging] = useState(false);
    const [startX, setStartX] = useState(0);
    const [currentX, setCurrentX] = useState(0);
    const [dragOffset, setDragOffset] = useState(0);
    const screens = React.Children.toArray(children);
    const containerRef = useRef(null);

    // Efecto para ir al primer slide cuando se elimina un slide
    useEffect(() => {
        if (screens.length > 0 && currentIndex >= screens.length) {
            setCurrentIndex(0);
            if (onSlideChange) onSlideChange(0);
        }
    }, [screens.length, currentIndex]);

    // Notificar el índice inicial
    useEffect(() => {
        if (onSlideChange) onSlideChange(0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const goNext = () => {
        setCurrentIndex((prev) => {
            const newIndex = (prev + 1) % screens.length;
            if (onSlideChange) onSlideChange(newIndex);
            return newIndex;
        });
    };

    const goPrev = () => {
        setCurrentIndex((prev) => {
            const newIndex = (prev - 1 + screens.length) % screens.length;
            if (onSlideChange) onSlideChange(newIndex);
            return newIndex;
        });
    };

    const goToSlide = (index) => {
        setCurrentIndex(index);
        if (onSlideChange) onSlideChange(index);
    };

    const handleMouseDown = (e) => {
        setIsDragging(true);
        setStartX(e.clientX);
        setCurrentX(e.clientX);
    };

    const handleMouseMove = (e) => {
        if (!isDragging) return;
        setCurrentX(e.clientX);
        const offset = e.clientX - startX;
        setDragOffset(offset);
    };

    const handleMouseUp = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const threshold = 50;
        const diff = currentX - startX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                goPrev();
            } else {
                goNext();
            }
        }
        
        setDragOffset(0);
    };

    const handleTouchStart = (e) => {
        setIsDragging(true);
        setStartX(e.touches[0].clientX);
        setCurrentX(e.touches[0].clientX);
    };

    const handleTouchMove = (e) => {
        if (!isDragging) return;
        setCurrentX(e.touches[0].clientX);
        const offset = e.touches[0].clientX - startX;
        setDragOffset(offset);
    };

    const handleTouchEnd = () => {
        if (!isDragging) return;
        setIsDragging(false);
        
        const threshold = 50;
        const diff = currentX - startX;
        
        if (Math.abs(diff) > threshold) {
            if (diff > 0) {
                goPrev();
            } else {
                goNext();
            }
        }
        
        setDragOffset(0);
    };

    useEffect(() => {
        const handleGlobalMouseMove = handleMouseMove;
        const handleGlobalMouseUp = handleMouseUp;

        if (isDragging) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
        };
    }, [handleMouseMove, handleMouseUp, isDragging]);

    const getTransform = () => {
        // Calcular el ancho total incluyendo el gap (20px)
        const slideWidth = 100; // 100% del contenedor
        const gapWidth = 20; // 20px de gap
        const totalWidth = slideWidth + (gapWidth / containerRef.current?.offsetWidth) * 100;
        
        const baseTransform = -currentIndex * totalWidth;
        const dragTransform = isDragging ? (dragOffset / containerRef.current?.offsetWidth) * 100 : 0;
        return `translateX(${baseTransform + dragTransform}%)`;
    };

    return (
        <div className={styles.carouselContainer}>
            <div 
                ref={containerRef}
                className={styles.carouselWrapper}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div 
                    className={styles.slidesContainer}
                    style={{ 
                        transform: getTransform(),
                        transition: isDragging ? 'none' : 'transform 0.3s ease-in-out',
                        cursor: isDragging ? 'grabbing' : 'grab'
                    }}
                >
                    {screens.map((screen, index) => (
                        <div key={index} className={styles.slide}>
                            {screen}
                        </div>
                    ))}
                </div>
            </div>
            
            {screens.length > 1 && (
                <div className={styles.dotsContainer}>
                    {screens.map((_, index) => (
                        <button
                            key={index}
                            className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                            onClick={() => goToSlide(index)}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}

export default Carousel;
