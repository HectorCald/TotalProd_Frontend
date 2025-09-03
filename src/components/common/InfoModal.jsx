import React from 'react';
import styles from './InfoModal.module.css';
import { BoxIcon } from 'boxicons-react';

function InfoModal({ 
    isOpen, 
    setIsOpen, 
    type = 'info', 
    title, 
    description, 
    showButton = false,
    buttonText = 'Aceptar',
    onButtonClick,
    buttonClassName = 'btn-original'
}) {
    if (!isOpen) return null;

    // Configuración según el tipo
    const getTypeConfig = () => {
        switch (type) {
            case 'error':
                return {
                    icon: 'x-circle',
                    color: '#ef4444',
                    bgColor: '#fef2f2'
                };
            case 'warning':
                return {
                    icon: 'error-circle',
                    color: '#f59e0b',
                    bgColor: '#fffbeb'
                };
            case 'success':
                return {
                    icon: 'check-circle',
                    color: '#10b981',
                    bgColor: '#f0fdf4'
                };
            case 'info':
            default:
                return {
                    icon: 'info-circle',
                    color: '#3b82f6',
                    bgColor: '#eff6ff'
                };
        }
    };

    const typeConfig = getTypeConfig();

    const handleButtonClick = () => {
        if (onButtonClick) {
            onButtonClick();
        }
        setIsOpen(false);
    };

    const handleBackdropClick = (e) => {
        if (e.target === e.currentTarget) {
            setIsOpen(false);
        }
    };

    return (
        <div className={styles.overlay} onClick={handleBackdropClick}>
            <div className={styles.modal}>
                {/* Header con icono */}
                <div 
                    className={styles.header}
                    style={{ backgroundColor: typeConfig.bgColor }}
                >
                    <div 
                        className={styles.iconContainer}
                        style={{ color: typeConfig.color }}
                    >
                        <BoxIcon name={typeConfig.icon} size="lg" />
                    </div>
                </div>

                {/* Contenido */}
                <div className={styles.content}>
                    {title && (
                        <h3 className={styles.title}>{title}</h3>
                    )}
                    
                    {description && (
                        <p className={styles.description}>{description}</p>
                    )}
                </div>

                {/* Botón (opcional) */}
                {showButton && (
                    <div className={styles.footer}>
                        <button
                            className={`${styles.button} ${buttonClassName}`}
                            onClick={handleButtonClick}
                        >
                            {buttonText}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

export default InfoModal;
