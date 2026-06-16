import React, { useState, useRef } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

// Formatea un valor numérico para mostrar: separador de miles "." y decimales ","
const formatDisplayValue = (raw) => {
  if (raw === '' || raw === null || raw === undefined) return '';
  const str = String(raw);
  const trailingComma = str.endsWith(',') || str.endsWith('.');
  const parts = str.replace(',', '.').split('.');
  const intPart = parts[0];
  const decPart = parts.length > 1 ? parts[1] : null;
  const intFormatted = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  if (trailingComma) return `${intFormatted},`;
  if (decPart !== null) return `${intFormatted},${decPart}`;
  return intFormatted;
};

const Input = ({
  type,
  tipo,
  value,
  onChange,
  label,
  placeholder,
  required,
  error,
  onClearError,
  readOnly,
  isSearch = false,   // ← nuevo: muestra X para limpiar cuando hay valor
  inputRef: externalRef,
  ...rest
}) => {
  const t = tipo ?? type ?? 'text';
  const isNumber = t === 'number';
  const isPassword = t === 'password';
  const isTextarea = t === 'textarea';
  const [showPassword, setShowPassword] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const internalRef = useRef(null);
  const ref = externalRef || internalRef;

  const handleInputChange = (e) => {
    if (isNumber) {
      const raw = e.target.value;
      const stripped = raw.replace(/\./g, '').replace(',', '.');
      if (stripped !== '' && !/^-?\d*\.?\d*$/.test(stripped)) return;
      onChange?.({ ...e, target: { ...e.target, value: stripped } });
      onClearError?.();
      return;
    }
    onChange?.(e);
    onClearError?.();
  };

  const handleClearSearch = () => {
    onChange?.({ target: { value: '' } });
    // Dar foco al input tras limpiar
    setTimeout(() => ref.current?.focus(), 0);
  };

  const displayValue = isNumber ? formatDisplayValue(value ?? '') : (value ?? '');
  const inputType = isNumber ? 'text' : (isPassword && showPassword ? 'text' : t);
  const showPasswordToggle = isPassword && !readOnly;
  const showClearBtn = isSearch && !isPassword && String(value ?? '').length > 0 && !readOnly;
  const hasRightIcon = showPasswordToggle || showClearBtn;

  return (
    <div className={styles.root}>
      {label && (
        <label className={styles.label}>
          {typeof label === 'string' ? label.toUpperCase() : label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${readOnly ? styles.inputWrapReadOnly : ''} ${hasRightIcon ? styles.inputWrapWithIcon : ''}`}>
        {isTextarea ? (
          <textarea
            ref={ref}
            value={value ?? ''}
            onChange={readOnly ? undefined : handleInputChange}
            placeholder={placeholder}
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            required={required}
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            rows={3}
            style={{ resize: 'none' }}
            {...rest}
          />
        ) : (
          <input
            ref={ref}
            type={inputType}
            inputMode={isNumber ? 'decimal' : undefined}
            value={displayValue}
            onChange={readOnly ? undefined : handleInputChange}
            placeholder={placeholder}
            className={`${styles.input} ${error ? styles.inputError : ''}`}
            onWheel={isNumber ? (e) => e.target.blur() : undefined}
            onFocus={readOnly ? (e) => e.target.blur() : () => setIsFocused(true)}
            onBlur={isNumber ? () => setIsFocused(false) : undefined}
            required={required}
            readOnly={readOnly}
            tabIndex={readOnly ? -1 : undefined}
            {...rest}
          />
        )}

        {/* Botón X: buscar con valor */}
        {showClearBtn && (
          <button
            type="button"
            className={styles.togglePassword}
            onClick={handleClearSearch}
            tabIndex={-1}
            aria-label="Limpiar búsqueda"
          >
            <BoxIcon name="x" className={styles.icon} />
          </button>
        )}

        {/* Toggle password */}
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
      </div>
      {error && (
        <div className={styles.errorTextMessage}>
          <BoxIcon name="error" className={styles.errorTextIcon} />
          <span>{typeof error === 'string' ? error : 'El campo es obligatorio'}</span>
        </div>
      )}
    </div>
  );
};

export default Input;
