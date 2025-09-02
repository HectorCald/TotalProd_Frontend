import React from 'react';
import styles from './HeaderView.module.css';
import { BoxIcon } from 'boxicons-react';

const HeaderView = ({title, onBack}) => {
    return (
        <div className={styles.headerView}>
            <button className={styles.headerViewButton} onClick={onBack}>
                <BoxIcon name='left-arrow-alt' className={styles.icon}/>
            </button>
            {title && <h1 className={styles.headerViewTitle}>{title}</h1>}
        </div>
    );
};

export default HeaderView;