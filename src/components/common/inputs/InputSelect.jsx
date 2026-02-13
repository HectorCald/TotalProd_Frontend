import React, { useState, useRef, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './InputSelect.module.css';

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
  getOptionLabel,
  getOptionValue,
  openDirection = 'down', // 'down' | 'up'
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const rootRef = useRef(null);
  const isLocked = disabled || readOnly;

  const getLabel = (opt) => {
    if (getOptionLabel) return getOptionLabel(opt);
    return typeof opt === 'object' && opt !== null && 'label' in opt ? opt.label : String(opt);
  };
  const getVal = (opt) => {
    if (getOptionValue) return getOptionValue(opt);
    return typeof opt === 'object' && opt !== null && 'value' in opt ? opt.value : opt;
  };

  const selectedOption = options.find((opt) => getVal(opt) === value);
  const displayValue = selectedOption != null ? getLabel(selectedOption) : '';

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

  return (
    <div className={styles.root} ref={rootRef} {...rest}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${isLocked ? styles.inputWrapReadOnly : ''}`}>
        <button
          type="button"
          className={`${styles.input} ${error ? styles.inputError : ''} ${open ? styles.inputOpen : ''}`}
          style={{ paddingRight: 36 }}
          onClick={() => !isLocked && setOpen((o) => !o)}
          disabled={isLocked}
        >
          <span className={displayValue ? styles.value : styles.placeholder}>
            {displayValue || placeholder}
          </span>
        </button>
        {error ? (
          <span className={styles.errorIcon} aria-hidden>
            <BoxIcon name="error-circle" className={styles.icon} />
          </span>
        ) : (
          <span className={styles.arrowWrap} aria-hidden>
            <BoxIcon
              name="chevron-down"
              className={`${styles.arrowIcon} ${open ? styles.arrowOpen : ''}`}
            />
          </span>
        )}
      </div>
      {open && !isLocked && (
        <ul className={`${styles.dropdown} ${openDirection === 'up' ? styles.dropdownUp : ''}`} role="listbox">
          {options.map((opt, idx) => {
            const val = getVal(opt);
            const isSelected = val === value;
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
  );
};

export default InputSelect;
