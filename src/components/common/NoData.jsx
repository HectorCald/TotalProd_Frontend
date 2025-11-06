import React from 'react';
import { BoxIcon } from 'boxicons-react';
import Boton from './Boton';
import styles from './NoData.module.css';

const NoData = ({ 
    icon = 'box', 
    title = 'No hay datos', 
    detail = 'No se encontraron elementos para mostrar',
    transparent = false,
    minHeight = '200px',
    isError = false,
    showRetryButton = false,
    showLoginButton = false,
    onRetry = null,
    onLogin = null
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
                
                {(showRetryButton || showLoginButton) && (
                    <div className={styles.buttonsContainer}>
                        {showRetryButton && (
                            <Boton
                                label="Reintentar"
                                onClick={onRetry || (() => {})}
                                className="btn-default"
                            />
                        )}
                        {showLoginButton && (
                            <Boton
                                label="Cerrar Seión"
                                onClick={onLogin || (() => {})}
                                className="btn-red"
                                style={{ marginTop: '15px' }}
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default NoData;
