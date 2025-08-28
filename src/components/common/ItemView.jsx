import React from 'react';
import styles from './ItemView.module.css';
import { BoxIcon } from 'boxicons-react';

const ItemView = ({title, description, icon, onClick, arrow}) => {
    return (
        <div className={styles.itemView} onClick={onClick}>
            <div className={styles.itemViewIcon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <div className={styles.itemViewContent}>
                <h1>{title}</h1>
                <p>{description}</p>
            </div>
            {arrow && (
                <div className={styles.itemViewArrow}>
                    <BoxIcon name='chevron-right' className={styles.icon} />
                </div>
            )}
        </div>
    );
};

export default ItemView;