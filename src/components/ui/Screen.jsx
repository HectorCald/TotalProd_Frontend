import React from 'react';
import styles from './Screen.module.css';

function Screen({ title, children }) {
    return (
        <div className={styles.screen}>
            <h1 className={styles.title}>{title}</h1>
            {children}
        </div>
    );
}

export default Screen;
