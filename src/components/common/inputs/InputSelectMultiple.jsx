import React, { useState, useRef, useEffect } from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Input.module.css';
import BotonIcon from '../botones/BotonIcon';

const InputSelectMultiple = ({
  label,
  value = [],       // array de IDs seleccionados
  onChange,          // callback que devuelve array de IDs
  options = [],      // [{ value, label }]
  placeholder = 'Buscar y agregar...',
  required,
  error,
  disabled,
  readOnly,
  getOptionLabel,
  getOptionValue,
  openDirection = 'down',
  actionIcon,
  onActionClick,
  actionLoading,
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

  // Opciones seleccionadas (como objetos completos)
  const selectedOptions = (value || []).map(v =>
    options.find(opt => String(getVal(opt)) === String(v))
  ).filter(Boolean);

  // Opciones disponibles (excluir ya seleccionadas)
  const availableOptions = options.filter(opt =>
    !(value || []).some(v => String(v) === String(getVal(opt)))
  );

  // Filtrar por query
  const filteredOptions = availableOptions.filter(opt => {
    const labelText = getLabel(opt).toLowerCase();
    return labelText.includes(query.toLowerCase());
  });

  useEffect(() => {
    if (isLocked) setOpen(false);
  }, [isLocked]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (rootRef.current && !rootRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleSelect = (opt) => {
    const val = getVal(opt);
    const newValues = [...(value || []), val];
    onChange?.(newValues);
    setQuery('');
    // Mantener abierto para seleccionar más
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleRemove = (valToRemove) => {
    if (isLocked) return;
    const newValues = (value || []).filter(v => String(v) !== String(valToRemove));
    onChange?.(newValues);
  };

  const handleInputChange = (e) => {
    setQuery(e.target.value);
    if (!open) setOpen(true);
  };

  const handleFocus = () => {
    if (!isLocked) {
      setOpen(true);
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

  const handleKeyDown = (e) => {
    // Backspace cuando query está vacío → quitar último chip
    if (e.key === 'Backspace' && query === '' && value && value.length > 0) {
      const newValues = value.slice(0, -1);
      onChange?.(newValues);
    }
  };

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
          {/* Contenedor que simula un input con chips dentro */}
          <div
            className={`${styles.input} ${error ? styles.inputError : ''} ${open ? styles.inputOpen : ''}`}
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: '4px',
              padding: '6px 36px 6px 8px',
              minHeight: '41.6px',
              alignItems: 'center',
              cursor: isLocked ? 'not-allowed' : 'text',
              background: 'none',
            }}
            onClick={() => {
              if (!isLocked && inputRef.current) {
                inputRef.current.focus();
              }
            }}
          >
            {/* Chips */}
            {selectedOptions.map(opt => {
              const val = getVal(opt);
              return (
                <span
                  key={val}
                  onClick={(e) => { 
                    if (!isLocked) {
                      e.stopPropagation(); 
                      handleRemove(val); 
                    }
                  }}
                  title={isLocked ? '' : "Haz clic para quitar"}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    backgroundColor: 'var(--primary-color-light, rgba(45, 190, 161, 0.1))',
                    color: 'var(--primary-color, #2dbea1)',
                    padding: '6px 12px',
                    borderRadius: '10px',
                    fontSize: '13px',
                    fontWeight: '500',
                    lineHeight: '1.4',
                    whiteSpace: 'nowrap',
                    maxWidth: '180px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                  }}
                >
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {getLabel(opt)}
                  </span>
                </span>
              );
            })}

            {/* Input de búsqueda inline */}
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleFocus}
              onKeyDown={handleKeyDown}
              placeholder={selectedOptions.length === 0 ? placeholder : ''}
              disabled={isLocked}
              style={{
                border: 'none',
                outline: 'none',
                background: 'none',
                flex: '1 1 60px',
                minWidth: '60px',
                fontSize: '13px',
                color: 'var(--dark-color)',
                padding: '2px 0',
                fontFamily: 'inherit',
              }}
            />
          </div>

          {/* Flecha */}
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

          {/* Dropdown */}
          {open && !isLocked && (
            <ul className={`${styles.dropdown} ${openDirection === 'up' ? styles.dropdownUp : ''}`} role="listbox">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((opt, idx) => {
                  const val = getVal(opt);
                  return (
                    <li
                      key={val ?? idx}
                      role="option"
                      className={styles.option}
                      onClick={() => handleSelect(opt)}
                    >
                      {getLabel(opt)}
                    </li>
                  );
                })
              ) : (
                <li className={styles.option} style={{ cursor: 'default', opacity: 0.6 }}>
                  {availableOptions.length === 0 ? 'Todas seleccionadas' : 'Sin resultados'}
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
              height: '41.6px',
              width: '41.6px',
              minWidth: '41.6px',
              maxWidth: '41.6px',
              borderRadius: '8px',
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

export default InputSelectMultiple;
