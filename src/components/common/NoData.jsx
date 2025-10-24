import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './NoData.module.css';

const NoData = ({ 
    icon = 'box', 
    title = 'No hay datos', 
    detail = 'No se encontraron elementos para mostrar',
    transparent = false,
    minHeight = '200px',
    isError = false
}) => {
    return (
        <div 
            className={`${styles.noDataContainer} ${transparent ? styles.transparent : styles.withBackground} ${isError ? styles.errorContainer : ''}`}
            style={{ minHeight }}
        >
            <div className={styles.noDataContent}>
                <div className={styles.noDataIconContainer}>
                    <BoxIcon 
                        name={icon} 
                        className={`${styles.noDataIcon} ${icon === 'loader-alt' ? styles.spinning : ''} ${isError ? styles.errorIcon : ''}`}
                    />
                </div>
                <h3 className={`${styles.noDataTitle} ${isError ? styles.errorTitle : ''}`}>{title}</h3>
                <p className={`${styles.noDataDetail} ${isError ? styles.errorDetail : ''}`}>{detail}</p>
            </div>
        </div>
    );
};

export default NoData;
