import React from 'react';
import styles from './ListaProfesional.module.css';

function ListaProfesional({ title = '', items = [] }) {
    const renderItems = (list, level = 0) => {
        if (!Array.isArray(list) || list.length === 0) return null;
        return (
            <ul className={styles.list}>
                {list.map((item, index) => {
                    const isObject = item && typeof item === 'object' && !Array.isArray(item);
                    const label = isObject ? (item.label || '') : String(item);
                    const children = isObject ? (item.children || item.items || []) : [];
                    return (
                        <li key={`${level}-${index}`} className={styles.item}>
                            <div className={styles.row}>
                                <span className={level === 0 ? styles.labelRoot : styles.labelNested}>{label}</span>
                            </div>
                            {children && children.length > 0 ? renderItems(children, level + 1) : null}
                        </li>
                    );
                })}
            </ul>
        );
    };

    return (
        <div className={styles.container}>
            {title ? (
                <h3 className={styles.title}>{title}</h3>
            ) : null}
            {renderItems(items, 0)}
        </div>
    );
}

export default ListaProfesional;


