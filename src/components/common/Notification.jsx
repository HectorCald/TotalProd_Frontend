import React from 'react';
import styles from './Notification.module.css';
import { BoxIcon } from 'boxicons-react';

function Notification({ 
    type = 'success', 
    text, 
    isVisible = false,
    onClose 
}) {
    if (!isVisible || !text) return null;

    // Configuración según el tipo
    const getTypeConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: 'check',
                    bgColor: 'rgba(34, 197, 94, 0.1)', // Verde suave
                    iconBgColor: 'var(--success-color)',
                    textColor: 'white'
                };
            case 'error':
                return {
                    icon: 'x',
                    bgColor: 'rgba(239, 68, 68, 0.1)', // Rojo suave
                    iconBgColor: 'var(--error-color)',
                    textColor: 'white'
                };
            case 'warning':
                return {
                    icon: 'error-circle',
                    bgColor: 'rgba(245, 158, 11, 0.1)', // Amarillo suave
                    iconBgColor: 'var(--warning-color)',
                    textColor: 'white'
                };
            case 'info':
            default:
                return {
                    icon: 'info-circle',
                    bgColor: 'rgba(59, 130, 246, 0.1)', // Azul suave
                    iconBgColor: 'var(--info-color)',
                    textColor: 'white'
                };
        }
    };

    const typeConfig = getTypeConfig();

    return (
        <div className={styles.overlay}>
            <div 
                className={styles.notification}
                style={{ 
                    backgroundColor: typeConfig.bgColor,
                    border: 'none'
                }}
            >
                <div 
                    className={styles.iconContainer}
                    style={{ backgroundColor: typeConfig.iconBgColor }}
                >
                    <BoxIcon name={typeConfig.icon} size="sm" />
                </div>
                <span 
                    className={styles.text}
                    style={{ color: typeConfig.textColor }}
                >
                    {text}
                </span>
            </div>
        </div>
    );
}

export default Notification;
