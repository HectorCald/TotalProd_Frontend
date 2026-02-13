import React, { useState } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

const Input = ({ type, tipo, value, onChange, label, placeholder, required, error, onClearError, readOnly, ...rest }) => {
  const t = tipo ?? type ?? 'text';
  const isNumber = t === 'number';
  const isPassword = t === 'password';
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    if (isNumber) {
      const v = e.target.value.replace(/,/g, '.');
      if (v !== '' && !/^-?\d*\.?\d*$/.test(v)) return;
      onChange?.({ ...e, target: { ...e.target, value: v } });
      onClearError?.();
      return;
    }
    onChange?.(e);
    onClearError?.();
  };

  const inputType = isNumber ? 'text' : (isPassword && showPassword ? 'text' : t);
  const showPasswordToggle = isPassword && !readOnly && !error;
  const hasRightIcon = error || showPasswordToggle;

  return (
    <div className={styles.root}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${readOnly ? styles.inputWrapReadOnly : ''} ${hasRightIcon ? styles.inputWrapWithIcon : ''}`}>
        <input
          type={inputType}
          inputMode={isNumber ? 'decimal' : undefined}
          value={value ?? ''}
          onChange={readOnly ? undefined : handleChange}
          placeholder={placeholder}
          className={`${styles.input} ${error ? styles.inputError : ''}`}
          onWheel={isNumber ? (e) => e.target.blur() : undefined}
          required={required}
          readOnly={readOnly}
          {...rest}
        />
        {showPasswordToggle && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={() => setShowPassword((v) => !v)}
            tabIndex={-1}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            <BoxIcon name={showPassword ? 'hide' : 'show'} className={styles.icon} />
          </button>
        )}
        {error && (
          <span className={styles.errorIcon} aria-hidden>
            <BoxIcon name="error-circle" className={styles.icon} />
          </span>
        )}
      </div>
    </div>
  );
};

export default Input;
