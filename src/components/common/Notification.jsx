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
                    bgColor: 'var(--tertiary-color)',
                    iconBgColor: 'var(--success-color)',
                    textColor: 'var(--white-color)'
                };
            case 'error':
                return {
                    icon: 'x',
                    bgColor: 'var(--tertiary-color)',
                    iconBgColor: 'var(--error-color)',
                    textColor: 'var(--white-color)'
                };
            case 'warning':
                return {
                    icon: 'error-circle',
                    bgColor: 'var(--tertiary-color)',
                    iconBgColor: 'var(--warning-color)',
                    textColor: 'var(--white-color)'
                };
            case 'info':
            default:
                return {
                    icon: 'info-circle',
                    bgColor: 'var(--tertiary-color)',
                    iconBgColor: 'var(--info-color)',
                    textColor: 'var(--white-color)'
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
                    <BoxIcon name={typeConfig.icon} size="sm" className={styles.icon} />
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
