import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = ({ 
    text = null,
    fullScreen = false,
    icon = null
}) => {
    if (fullScreen) {
        return (
            <div className={styles.fullScreenContainer}>
                {icon && (
                    <div className={styles.iconContainer}>
                        <BoxIcon name={icon} className={styles.icon} />
                    </div>
                )}
                <div className={styles.dots}>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                    <div className={styles.dot}></div>
                </div>
                {text && <p className={styles.text}>{text}</p>}
            </div>
        );
    }

    return (
        <div className={styles.container}>
            {icon && (
                <div className={styles.iconContainer}>
                    <BoxIcon name={icon} className={styles.icon} />
                </div>
            )}
            <div className={styles.dots}>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
                <div className={styles.dot}></div>
            </div>
            {text && <p className={styles.text}>{text}</p>}
        </div>
    );
};

export default LoadingSpinner;
