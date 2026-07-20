import React, { useState, useRef, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';
import BotonIcon from '../botones/BotonIcon';

const InputSelectBox = ({
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
  actionIcon,
  onActionClick,
  actionLoading,
  actionStyle,
  ...rest
}) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const isLocked = disabled || readOnly;

  const getLabel = (opt) => {
    if (getOptionLabel) return getOptionLabel(opt);
    return typeof opt === 'object' && opt !== null && 'label' in opt ? opt.label : String(opt);
  };
  const getVal = (opt) => {
    if (getOptionValue) return getOptionValue(opt);
    return typeof opt === 'object' && opt !== null && 'value' in opt ? opt.value : opt;
  };

  const selectedOption = options.find((opt) => String(getVal(opt)) === String(value));

  // Sincronizar el query con el valor seleccionado
  useEffect(() => {
    if (selectedOption != null) {
      setQuery(getLabel(selectedOption));
    } else {
      setQuery('');
    }
  }, [value, selectedOption, options]);

  useEffect(() => {
    if (isLocked) setOpen(false);
  }, [isLocked]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        // Revertir a la opción seleccionada si no se guardó ningún valor nuevo válido
        if (selectedOption != null) {
          setQuery(getLabel(selectedOption));
        } else {
          setQuery('');
        }
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, selectedOption]);

  const handleSelect = (opt) => {
    const val = getVal(opt);
    onChange?.(val);
    setQuery(getLabel(opt));
    setOpen(false);
  };

  const handleClear = (e) => {
    e.stopPropagation();
    onChange?.(null);
    setQuery('');
    setOpen(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const handleFocus = (e) => {
    if (!isLocked) {
      setOpen(true);
      e.target.select();
    }
  };

  const handleArrowClick = (e) => {
    e.stopPropagation();
    if (isLocked) return;
    if (open) {
      setOpen(false);
      if (inputRef.current) inputRef.current.blur();
    } else {
      setOpen(true);
      if (inputRef.current) inputRef.current.focus();
    }
  };

  // Filtrar las opciones según el query
  const filteredOptions = options.filter((opt) => {
    const labelText = getLabel(opt).toLowerCase();
    const searchVal = query.toLowerCase();
    return labelText.includes(searchVal);
  });

  const hasValue = (value != null && value !== '') || query.length > 0;

  return (
    <div className={styles.root} ref={rootRef} {...rest}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {typeof label === 'string' ? label.toUpperCase() : label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={onActionClick ? styles.inputActionContainer : ''}>
        <div className={`${styles.inputWrap} ${isLocked ? styles.inputWrapReadOnly : ''}`}>
          <input
            ref={inputRef}
            type="text"
            className={`${styles.input} ${error ? styles.inputError : ''} ${open ? styles.inputOpen : ''}`}
            style={{ paddingRight: 36, cursor: isLocked ? 'not-allowed' : 'text', background: 'none' }}
            value={query}
            onChange={handleInputChange}
            onFocus={handleFocus}
            placeholder={placeholder}
            disabled={isLocked}
            readOnly={readOnly}
          />

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
              onClick={handleArrowClick}
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
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
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
                })
              ) : (
                <li className={styles.option} style={{ cursor: 'default', opacity: 0.6 }}>
                  Sin resultados
                </li>
              )}
            </ul>
          )}
        </div>

        {onActionClick && (
          <BotonIcon
            className="btn-primary"
            iconName={actionIcon}
            onClick={onActionClick}
            disabled={isLocked}
            loading={actionLoading}
            style={{
              height: '40px',
              width: '40px',
              minWidth: '40px',
              maxWidth: '40px',
              borderRadius: '8px',
              ...actionStyle,
            }}
          />
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

export default InputSelectBox;
