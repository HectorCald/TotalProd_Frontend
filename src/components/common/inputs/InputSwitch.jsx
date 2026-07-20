import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

const InputSwitch = ({ label, subtitle, checked, onChange, disabled, id, icon, readOnly }) => {
  const isLocked = disabled || readOnly;

  return (
    <div className={`${styles.switchRoot} ${checked ? styles.checked : ''} ${disabled ? styles.disabled : ''} ${readOnly ? styles.readOnly : ''}`}>
      <label className={styles.switchContainer} htmlFor={id}>
        {icon && (
          <div className={styles.iconContainer}>
            <BoxIcon name={icon} className={styles.switchIcon} />
          </div>
        )}
        <div className={styles.textContainer}>
          {label && <p className={styles.switchLabel}>{typeof label === 'string' ? label.toUpperCase() : label}</p>}
          {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        </div>
        <div className={styles.switch}>
          <input
            id={id}
            type="checkbox"
            checked={checked || false}
            onChange={(e) => !isLocked && onChange?.(e.target.checked)}
            disabled={isLocked}
          />
          <span className={styles.slider}></span>
        </div>
      </label>
    </div>
  );
};

export default InputSwitch;
