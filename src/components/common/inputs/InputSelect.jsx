import React, { useState, useRef, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';

const InputSelect = ({
  label,
  value,
  onChange,
  options = [],
  placeholder = 'Seleccionar...',
  required,
  error,
  disabled,
  readOnly,
  clearable = true,       // muestra X para limpiar cuando hay valor
  getOptionLabel,
  getOptionValue,
  openDirection = 'down', // 'down' | 'up'
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const getLabel = (opt) => {
    if (getOptionLabel) return getOptionLabel(opt);
    return typeof opt === 'object' && opt !== null && 'label' in opt ? opt.label : String(opt);
  };
  const getVal = (opt) => {
    if (getOptionValue) return getOptionValue(opt);
    return typeof opt === 'object' && opt !== null && 'value' in opt ? opt.value : opt;
  };

  const isSingleOption = options.length === 1;
  const isLocked = disabled || readOnly || isSingleOption;

  useEffect(() => {
    if (isSingleOption) {
      const singleVal = getVal(options[0]);
      if (String(value) !== String(singleVal)) {
        // setTimeout para evitar warnings de react por actualización de estado durante renderizado de otros componentes
        setTimeout(() => {
          if (onChange) onChange(singleVal);
        }, 0);
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, value]);



  const selectedOption = options.find((opt) => String(getVal(opt)) === String(value));
  const displayValue = selectedOption != null ? getLabel(selectedOption) : '';
  const hasValue = displayValue !== '';

  useEffect(() => {
    if (isLocked) setOpen(false);
  }, [isLocked]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (opt) => {
    onChange?.(getVal(opt));
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation(); // no abrir el dropdown
    onChange?.(null);
    setOpen(false);
  };

  const handleToggle = () => {
    if (!isLocked) setOpen((o) => !o);
  };

  return (
    <div className={styles.root} ref={rootRef} {...rest}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {typeof label === 'string' ? label.toUpperCase() : label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${isLocked ? styles.inputWrapReadOnly : ''}`}>
        <button
          type="button"
          className={`${styles.input} ${error ? styles.inputError : ''} ${open ? styles.inputOpen : ''}`}
          style={{ paddingRight: 36 }}
          onClick={handleToggle}
          disabled={isLocked}
        >
          <span className={displayValue ? styles.value : styles.placeholder}>
            {displayValue || placeholder}
          </span>
        </button>

        {/* Ícono derecho: X (limpiar si hay valor y clearable) > flecha */}
        {hasValue && clearable && !isLocked ? (
          <button
            type="button"
            className={styles.clearBtn}
            onClick={handleClear}
            tabIndex={-1}
            aria-label="Limpiar selección"
          >
            <BoxIcon name="x" className={styles.icon} />
          </button>
        ) : (
          <span 
            className={styles.arrowWrap} 
            aria-hidden 
            onClick={handleToggle}
            style={{ cursor: isLocked ? 'not-allowed' : 'pointer', pointerEvents: isLocked ? 'none' : 'auto' }}
          >
            <BoxIcon
              name="chevron-down"
              className={`${styles.arrowIcon} ${open ? styles.arrowOpen : ''}`}
            />
          </span>
        )}

        {open && !isLocked && (
          <ul className={`${styles.dropdown} ${openDirection === 'up' ? styles.dropdownUp : ''}`} role="listbox">
            {options.map((opt, idx) => {
              const val = getVal(opt);
              const isSelected = String(val) === String(value);
              return (
                <li
                  key={val ?? idx}
                  role="option"
                  aria-selected={isSelected}
                  className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
                  onClick={() => handleSelect(opt)}
                >
                  {getLabel(opt)}
                </li>
              );
            })}
          </ul>
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

export default InputSelect;
