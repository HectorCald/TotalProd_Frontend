import styles from './ListData.module.css';
import { BoxIcon } from 'boxicons-react';

function ListData({ label, items = [], emptyText = 'Sin datos', icon, vertical = true, badgeColor = 'default', badgeIcon }) {
    const hasItems = items && items.length > 0;
    
    return (
        <div className={styles.listData}>
            <div className={styles.content} style={{ flexDirection: vertical ? 'column' : 'row', justifyContent: vertical ? 'flex-start' : 'space-between' }}>
                <span className={styles.label}>{label}</span>
                {hasItems ? (
                    <div className={styles.itemsContainer}>
                        {items.map((item, index) => {
                            const displayValue = typeof item === 'string' ? item : (item.name || item.label || item);
                            return (
                                <span key={index} className={`${styles.badge} ${styles[badgeColor]}`}>
                                    {badgeIcon && (
                                        <BoxIcon name={badgeIcon} className={styles.badgeIcon} />
                                    )}
                                    {displayValue}
                                </span>
                            );
                        })}
                    </div>
                ) : (
                    <span className={styles.emptyText}>{emptyText}</span>
                )}
            </div>
            {icon && (
                <div className={styles.iconContainer}>
                    {icon}
                </div>
            )}
        </div>
    );
}

export default ListData;

