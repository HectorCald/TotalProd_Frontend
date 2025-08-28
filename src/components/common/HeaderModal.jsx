import React from 'react';
import styles from './HeaderModal.module.css';
import { BoxIcon } from 'boxicons-react';

const HeaderModal = ({ title, onClose }) => {
    return (
        <div className={styles.headerModal}>
            <h1 className={styles.headerModalTitle}>{title}</h1>
            <button className={styles.headerModalButton} onClick={onClose}>
                <BoxIcon name='x' className={styles.icon}/>
            </button>
        </div>
    );
};

export default HeaderModal;
