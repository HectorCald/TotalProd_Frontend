import React, { useState } from 'react';
import styles from './Carousel.module.css';
import { motion } from 'framer-motion';

function Carousel({ children }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const screens = React.Children.toArray(children);

    const handleNext = () => {
        setCurrentIndex((prev) => (prev + 1) % screens.length);
    };

    const handlePrev = () => {
        setCurrentIndex((prev) => (prev - 1 + screens.length) % screens.length);
    };

    const handleDotClick = (index) => {
        setCurrentIndex(index);
    };

    const handleDragEnd = (event, info) => {
        const swipeThreshold = 100;
        if (Math.abs(info.offset.x) > swipeThreshold) {
            if (info.offset.x > 0) {
                handlePrev();
            } else {
                handleNext();
            }
        }
    };

    return (
        <div className={styles.carouselContainer}>
            <div className={styles.carouselWrapper}>
                <motion.div
                    className={styles.slidesContainer}
                    animate={{ x: -currentIndex * 100 + '%' }}
                    transition={{
                        type: "tween",
                        duration: 0.3,
                        ease: "easeInOut"
                    }}
                    drag="x"
                    dragConstraints={{ 
                        left: -(screens.length - 1) * 100 + '%', 
                        right: 0 
                    }}
                    dragElastic={0.1}
                    onDragEnd={handleDragEnd}
                >
                    {screens.map((screen, index) => (
                        <div key={index} className={styles.slide}>
                            {screen}
                        </div>
                    ))}
                </motion.div>
            </div>
            
            <div className={styles.dotsContainer}>
                {screens.map((_, index) => (
                    <button
                        key={index}
                        className={`${styles.dot} ${index === currentIndex ? styles.activeDot : ''}`}
                        onClick={() => handleDotClick(index)}
                        aria-label={`Ir a pantalla ${index + 1}`}
                    />
                ))}
            </div>
        </div>
    );
}

export default Carousel;
