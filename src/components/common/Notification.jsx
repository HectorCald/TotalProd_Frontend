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
                    bgColor: 'var(--tertiary-color)', // green
                    borderColor: '#374151', // Lighter gray border
                    iconBgColor: 'var(--success-color)' // Medium gray for icon
                };
            case 'error':
                return {
                    icon: 'x',
                    bgColor: 'var(--tertiary-color)',
                    borderColor: '#374151',
                    iconBgColor: 'var(--error-color)'
                };
            case 'warning':
                return {
                    icon: 'error-circle',
                    bgColor: 'var(--tertiary-color)',
                    borderColor: '#374151',
                    iconBgColor: 'var(--warning-color)'
                };
            case 'info':
            default:
                return {
                    icon: 'info-circle',
                    bgColor: 'var(--tertiary-color)',
                    borderColor: '#374151',
                    iconBgColor: 'var(--info-color)'
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
                    borderColor: typeConfig.borderColor
                }}
            >
                <div 
                    className={styles.iconContainer}
                    style={{ backgroundColor: typeConfig.iconBgColor }}
                >
                    <BoxIcon name={typeConfig.icon} size="sm" />
                </div>
                <span className={styles.text}>{text}</span>
            </div>
        </div>
    );
}

export default Notification;
