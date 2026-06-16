import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

const InputCall = ({ value, onClick, onClear, label, placeholder, required, readOnly, error, ...rest }) => {
  const hasValue = value != null && value !== '';

  return (
    <div className={styles.root} {...rest}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {typeof label === 'string' ? label.toUpperCase() : label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${readOnly ? styles.inputWrapReadOnly : ''} ${error ? styles.inputWrapError : ''}`}>
        <button
          type="button"
          onClick={readOnly ? undefined : onClick}
          className={`${styles.input} ${hasValue ? styles.inputWithClear : ''} ${error ? styles.inputError : ''}`}
          disabled={readOnly}
        >
          <span className={hasValue ? styles.value : styles.placeholder}>
            {hasValue ? value : placeholder}
          </span>
        </button>
        {hasValue && onClear && !readOnly && (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
            aria-label="Limpiar selección"
          >
            <BoxIcon name="x" className={styles.icon} />
          </button>
        )}
        {error && (
          <span className={styles.errorIcon} aria-hidden>
            <BoxIcon name="error-circle" className={styles.iconError} />
          </span>
        )}
      </div>
    </div>
  );
};

export default InputCall;
