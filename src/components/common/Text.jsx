import React from 'react';
import styles from './Text.module.css';
import { BoxIcon } from 'boxicons-react';

function Text({ 
    children, 
    type = 'info', 
    icon,
    align = 'center',
    style = {}
}) {
    const getTypeConfig = () => {
        switch (type) {
            case 'error':
                return {
                    icon: icon || 'info-circle',
                    color: '#dc2626',
                    bgColor: 'rgba(220, 38, 38, 0.1)'
                };
            case 'success':
                return {
                    icon: icon || 'info-circle',
                    color: '#16a34a',
                    bgColor: 'rgba(22, 163, 74, 0.1)'
                };
            case 'warning':
                return {
                    icon: icon || 'info-circle',
                    color: '#ea990c',
                    bgColor: 'rgba(234, 142, 12, 0.1)'
                };
            case 'info':
            default:
                return {
                    icon: icon || 'info-circle',
                    color: '#3b82f6',
                    bgColor: 'rgba(59, 130, 246, 0.1)'
                };
        }
    };

    const typeConfig = getTypeConfig();

    return (
        <div 
            className={`${styles.text} ${styles[type]}`}
            style={{
                color: typeConfig.color,
                backgroundColor: typeConfig.bgColor,
                textAlign: align,
                ...style
            }}
        >
            <BoxIcon 
                name={typeConfig.icon} 
                className={styles.icon}
                style={{ color: typeConfig.color }}
            />
            <span>{children}</span>
        </div>
    );
}

export default Text;

