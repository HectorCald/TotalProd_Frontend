import React from 'react';
import styles from './ItemLine.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemLine = ({ icon, title, onClick }) => {
    return (
        <div className={styles.itemLine} onClick={onClick}>
            <div className={styles.icon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <p className={styles.title}>{title}</p>
        </div>
    );
};

export default ItemLine;