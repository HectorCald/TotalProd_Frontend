import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

const Radiobox = ({ title, options = [], selectedValues = [], onChange, disabled }) => {
  const handleToggle = (optionValue) => {
    if (disabled) return;
    if (selectedValues.includes(optionValue)) {
      onChange(selectedValues.filter(value => value !== optionValue));
    } else {
      onChange([...selectedValues, optionValue]);
    }
  };

  const isSelected = (optionValue) => {
    return selectedValues.includes(optionValue);
  };

  return (
    <div className={`${styles.root} ${disabled ? styles.disabled : ''}`}>
      {title && <label className={styles.title}>{typeof title === 'string' ? title.toUpperCase() : title}</label>}
      <div className={styles.grid}>
        {options.map((option) => {
          const active = isSelected(option.value);
          return (
            <button
              key={option.value}
              type="button"
              className={`${styles.box} ${active ? styles.boxSelected : ''}`}
              onClick={() => handleToggle(option.value)}
              disabled={disabled}
            >
              <div className={styles.inner}>
                <div className={`${styles.checkIndicator} ${active ? styles.checkActive : ''}`}>
                  {active && <BoxIcon name="check" className={styles.checkIcon} />}
                </div>
                <span className={styles.optionLabel}>{option.name || option.title}</span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default Radiobox;
