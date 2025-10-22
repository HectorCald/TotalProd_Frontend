import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
    text = null,
    fullScreen = false
}) => {
    if (fullScreen) {
        return (
            <div className={styles.fullScreenContainer}>
                <div className={styles.spinner}></div>
                {text && <p className={styles.text}>{text}</p>}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            <div className={styles.spinner}></div>
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
