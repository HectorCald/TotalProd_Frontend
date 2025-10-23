import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './NoData.module.css';

const NoData = ({ 
    icon = 'box', 
    title = 'No hay datos', 
    detail = 'No se encontraron elementos para mostrar',
    transparent = false,
    minHeight = '200px'
}) => {
    return (
        <div 
            className={`${styles.noDataContainer} ${transparent ? styles.transparent : styles.withBackground}`}
            style={{ minHeight }}
        >
            <div className={styles.noDataContent}>
                <div className={styles.noDataIconContainer}>
                    <BoxIcon 
                        name={icon} 
                        className={`${styles.noDataIcon} ${icon === 'loader-alt' ? styles.spinning : ''}`}
                    />
                </div>
                <h3 className={styles.noDataTitle}>{title}</h3>
                <p className={styles.noDataDetail}>{detail}</p>
            </div>
        </div>
    );
};

export default NoData;
