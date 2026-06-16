import React from 'react';
import styles from './Filtros.module.css';

function Filtros({ options }) {
    return (
        <div className={styles.container}>
            {options.map((option, index) => (
                <button
                    key={index}
                    className={`${styles.filter} ${option.active ? styles.active : ''}`}
                    onClick={option.onClick}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
}

export default Filtros;
