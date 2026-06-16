import React from 'react';
import styles from './Input.module.css';

const Checkbox = ({ label, checked, onChange, disabled, id }) => {
    return (
        <label className={`${styles.checkboxWrapper} ${disabled ? styles.disabled : ''}`} htmlFor={id}>
            <input 
                id={id}
                type="checkbox" 
                className={styles.checkboxInput} 
                checked={checked} 
                onChange={(e) => onChange(e.target.checked)}
                disabled={disabled}
            />
            <div className={styles.customCheckbox}>
                <i className={`bx bx-check ${styles.checkIcon}`}></i>
            </div>
            {label && <span className={styles.label}>{typeof label === 'string' ? label.toUpperCase() : label}</span>}
        </label>
    );
};

export default Checkbox;
