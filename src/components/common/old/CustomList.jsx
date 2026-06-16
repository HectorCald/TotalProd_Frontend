import React from 'react';
import styles from './CustomList.module.css';
import { BoxIcon } from 'boxicons-react';
import { useLayout } from '../../context/LayoutContext';

function CustomList({ items = [], columns = 2 }) {
    const { isLargeScreen } = useLayout();
    const actualColumns = isLargeScreen ? columns : 1;

    const getIconConfig = (item) => {
        if (item.disabled) {
            return {
                icon: item.iconType === 'error' ? 'x' : item.iconType === 'warning' ? 'error-circle' : 'check',
                bgColor: 'rgba(156, 163, 175, 0.2)',
                iconColor: '#9ca3af',
                opacity: 0.5
            };
        }

        switch (item.iconType) {
            case 'error':
                return {
                    icon: 'x',
                    bgColor: 'rgba(220, 38, 38, 0.2)',
                    iconColor: '#dc2626'
                };
            case 'warning':
                return {
                    icon: 'error-circle',
                    bgColor: 'rgba(234, 142, 12, 0.2)',
                    iconColor: '#ea8a0c'
                };
            case 'success':
            default:
                return {
                    icon: 'check',
                    bgColor: '#16a34a',
                    iconColor: '#ffffff'
                };
        }
    };

    return (
        <div 
            className={styles.listContainer}
            style={{ 
                gridTemplateColumns: `repeat(${actualColumns}, 1fr)`,
                gap: '10px'
            }}
        >
            {items.map((item, index) => {
                const iconConfig = getIconConfig(item);
                
                return (
                    <div
                        key={index}
                        className={`${styles.listItem} ${item.disabled ? styles.disabled : ''}`}
                        style={{ opacity: item.disabled ? 0.5 : 1 }}
                    >
                        <div 
                            className={styles.iconWrapper}
                            style={{ 
                                backgroundColor: iconConfig.bgColor,
                            }}
                        >
                            <BoxIcon 
                                name={iconConfig.icon} 
                                className={styles.icon}
                                style={{ color: iconConfig.iconColor }}
                            />
                        </div>
                        <span className={styles.label}>{item.label}</span>
                    </div>
                );
            })}
        </div>
    );
}

export default CustomList;
