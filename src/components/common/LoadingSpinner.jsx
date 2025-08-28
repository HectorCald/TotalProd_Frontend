import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
    size = 'medium', 
    color = 'primary', 
    text = 'Cargando...',
    fullScreen = false,
    overlay = false 
}) => {
    const spinnerClasses = [
        styles.spinner,
        styles[size],
        styles[color]
    ].join(' ');

    const containerClasses = [
        styles.loadingContainer,
        fullScreen ? styles.fullScreen : '',
        overlay ? styles.overlay : ''
    ].join(' ');

    if (fullScreen) {
        return (
            <div className={containerClasses}>
                <div className={styles.spinnerWrapper}>
                    <div className={spinnerClasses}></div>
                    {text && <p className={styles.loadingText}>{text}</p>}
                </div>
            </div>
        );
    }

    return (
        <div className={containerClasses}>
            <div className={spinnerClasses}></div>
            {text && <p className={styles.loadingText}>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
