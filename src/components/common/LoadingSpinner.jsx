import React from 'react';
import { motion } from 'framer-motion';
import { BoxIcon } from 'boxicons-react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
    color = 'primary', 
    text = null,
    fullScreen = false,
    overlay = false,
    centerIcon = null,
    iconName = null
}) => {
    const spinnerClasses = [
        styles.spinner,
        styles[color]
    ].join(' ');

    const containerClasses = [
        styles.loadingContainer,
        fullScreen ? styles.fullScreen : '',
        overlay ? styles.overlay : ''
    ].join(' ');

    // Animación del spinner con escala
    const spinnerVariants = {
        animate: {
            rotate: 360,
            scale: [1, 1.5, 1],
            transition: {
                duration: 1,
                ease: "linear",
                repeat: Infinity
            }
        }
    };

    if (fullScreen) {
        return (
            <div className={containerClasses}>
                <div className={styles.spinnerWrapper}>
                    <div className={spinnerClasses}>
                        {/* Spinner que gira */}
                        <motion.div 
                            className={styles.spinnerRing}
                            variants={spinnerVariants}
                            animate="animate"
                        ></motion.div>
                        
                        {/* Círculo central con icono */}
                        <div className={styles.centerCircle}>
                            {centerIcon ? (
                                <div className={styles.centerIcon}>
                                    {centerIcon}
                                </div>
                            ) : iconName ? (
                                <div className={styles.centerIcon}>
                                    <BoxIcon name={iconName} className={styles.icon} />
                                </div>
                            ) : (
                                <div className={styles.defaultIcon}>
                                    <div className={styles.bar}></div>
                                    <div className={styles.bar}></div>
                                    <div className={styles.bar}></div>
                                </div>
                            )}
                        </div>
                    </div>
                    {text && <motion.p 
                        className={styles.loadingText}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                    >
                        {text}
                    </motion.p>}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className={spinnerClasses}>
                {/* Spinner que gira */}
                <motion.div 
                    className={styles.spinnerRing}
                    variants={spinnerVariants}
                    animate="animate"
                ></motion.div>
                
                {/* Círculo central con icono */}
                <div className={styles.centerCircle}>
                    {centerIcon ? (
                        <div className={styles.centerIcon}>
                            {centerIcon}
                        </div>
                    ) : iconName ? (
                        <div className={styles.centerIcon}>
                            <BoxIcon name={iconName} className={styles.icon} />
                        </div>
                    ) : (
                        <div className={styles.defaultIcon}>
                            <div className={styles.bar}></div>
                            <div className={styles.bar}></div>
                            <div className={styles.bar}></div>
                        </div>
                    )}
                </div>
            </div>
            {text && <motion.p 
                className={styles.loadingText}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
            >
                {text}
            </motion.p>}
        </div>
    );
};

export default LoadingSpinner;
