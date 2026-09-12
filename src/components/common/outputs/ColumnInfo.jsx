import React from 'react';
import styles from './ColumnInfo.module.css';

const ColumnInfo = ({ title, items = [], hasBorder = true, finance = false, financeLabel = 'Total:', financeTotal, variant = 'default' }) => {
    if (!items || items.length === 0) return null;

    if (variant === 'changes') {
        return (
            <div className={styles.changesBox}>
                {title && <h4 className={styles.changesTitle}>{title}</h4>}
                <ul className={styles.changesList}>
                    {items.map((item, index) => (
                        <li key={index}>{item}</li>
                    ))}
                </ul>
            </div>
        );
    }

    return (
        <div className={`${styles.container} ${hasBorder ? styles.withBorder : ''}`}>
            {title && <h4 className={styles.title}>{title}</h4>}
            <div className={styles.list}>
                {items.map((item, index) => (
                    <div key={index} className={styles.listItem}>
                        {item.icon && <i className={`bx bx-${item.icon} ${styles.icon}`}></i>}
                        {item.clave && item.valor !== undefined && item.valor !== null ? (
                            <div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
                                <span className={styles.text} style={{ fontWeight: 500, color: item.colorClave || 'inherit' }}>{item.clave}</span>
                                <span className={styles.text} style={{ fontWeight: 650, color: item.colorValor || 'inherit' }}>{item.valor}</span>
                            </div>
                        ) : (
                            <span className={styles.text} style={{ fontWeight: title ? 500 : 650 }}>{item.text}</span>
                        )}
                    </div>
                ))}
                
                {finance && (
                    <div style={{
                        paddingTop: '10px',
                        marginTop: '10px',
                        borderTop: '1px dashed var(--secondary-color)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        width: '100%'
                    }}>
                        <span style={{ fontSize: '13px', color: 'var(--secondary-color)', fontWeight: '700' }}>{financeLabel || 'Total:'}</span>
                        <span style={{ fontSize: '15px', fontWeight: 'bold', color: 'var(--secondary-color)' }}>{financeTotal}</span>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ColumnInfo;
