import React from 'react';
import styles from './Tooltip.module.css';

const Tooltip = ({ children, text, items = [], position = 'top', align = 'center', className = '' }) => {
    if (!text && (!items || items.length === 0)) return children;

    return (
        <div className={`${styles.tooltipWrapper} ${styles[position]} ${styles[`align-${align}`]} ${className}`}>
            {children}
            <div className={styles.tooltipContent}>
                {(!items || items.length === 0) && text && (
                    <div className={styles.tooltipItem}>
                        <span className={styles.tooltipLabel}>{text}</span>
                    </div>
                )}
                {items && items.length > 0 && items.map((item, idx) => (
                    <div key={idx} className={styles.tooltipItem}>
                        <span className={styles.tooltipLabel}>{item.label}</span>
                        <span className={styles.tooltipValue}>{item.value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Tooltip;
