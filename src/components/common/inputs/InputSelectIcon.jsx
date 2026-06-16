import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

const InputSelectIcon = ({ label, options, value, onChange }) => {
  return (
    <div className={styles.iconSelectContainer}>
      {label && <label className={styles.label}>{typeof label === 'string' ? label.toUpperCase() : label}</label>}
      <div className={styles.optionsWrapper}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className={`${styles.optionBtn} ${value === option.value ? styles.selected : ''}`}
            style={value === option.value ? {
              borderColor: option.color || '#0253cc',
              color: option.color || '#0253cc',
              backgroundColor: option.bgColor || '#f4f8ff'
            } : {}}
            onClick={() => onChange(option.value)}
          >
            <BoxIcon name={option.icon} className={styles.selectIcon} type={option.iconType || 'regular'} />
            <span className={styles.optionLabel}>{option.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
};

export default InputSelectIcon;
