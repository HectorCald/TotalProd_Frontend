import React from 'react';
import styles from './ItemLine.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemLine = ({ icon, title, onClick, arrow }) => {
    return (
        <div className={styles.itemLine} onClick={onClick}>
            <div className={styles.icon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <p className={styles.title}>{title}</p>
            {arrow && (
                <div className={styles.arrow}>
                    <BoxIcon name="chevron-right" className={styles.icon} />
                </div>
            )}
        </div>
    );
};

export default ItemLine;