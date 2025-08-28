import React, { useState } from 'react';
import styles from './Carousel.module.css';
import { motion, AnimatePresence } from 'framer-motion';

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
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentIndex}
                        initial={{ opacity: 0, x: 300 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        transition={{
                            type: "spring",
                            stiffness: 300,
                            damping: 30
                        }}
                        drag="x"
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.5}
                        onDragEnd={handleDragEnd}
                        className={styles.screen}
                    >
                        {screens[currentIndex]}
                    </motion.div>
                </AnimatePresence>
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
