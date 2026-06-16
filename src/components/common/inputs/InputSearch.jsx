import React, { useState, useEffect, useRef, useCallback } from 'react';
import { BoxIcon } from 'boxicons-react';
import Skeleton from '../Skeleton';
import styles from './Input.module.css';
import selectStyles from './Input.module.css';

function InputSearch({
  type = 'text',
  value,
  onChange,
  onSelect,
  onSugerenciaSelect,
  label,
  placeholder = 'Buscar...',
  options = [],
  sugerencias,
  getOptionLabel,
  getOptionValue = (opt) => (typeof opt === 'object' && opt !== null && 'id' in opt ? opt.id : (opt?.value ?? String(opt))),
  mostrarCampo = 'name',
  buscarCampo = 'name',
  displayField,
  searchField,
  searchInDesc,
  descripcionCampo = 'descripcion',
  maxOptions,
  maxSugerencias,
  minChars = 1,
  minCaracteres,
  caseSensitive = false,
  required,
  error,
  onClearError,
  disabled = false,
  loading = false,
  onInvalidBlur
}) {
  const opts = options.length > 0 ? options : (sugerencias || []);
  const getLabel = getOptionLabel ?? (
    displayField
      ? (opt) => (typeof opt === 'object' && opt !== null && opt[displayField] != null ? opt[displayField] : String(opt))
      : (opt) => (typeof opt === 'object' && opt !== null && opt[mostrarCampo] != null ? opt[mostrarCampo] : String(opt))
  );
  const searchF = searchField ?? buscarCampo;
  const descF = searchInDesc ?? descripcionCampo;
  const minC = minCaracteres ?? minChars;
  const maxO = maxSugerencias ?? maxOptions;
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const inputRef = useRef(null);
  const containerRef = useRef(null);
  const justSelectedRef = useRef(false);

  const normalize = useCallback((text) => {
    if (!text) return '';
    const base = caseSensitive ? String(text) : String(text).toLowerCase();
    return base
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[-]/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
  }, [caseSensitive]);

  const normalizeNoSpaces = useCallback(
    (text) => normalize(text).replace(/\s+/g, ''),
    [normalize]
  );

  const displayOptions = React.useMemo(() => {
    const q = value ? String(value).trim() : '';
    const hasQuery = q.length >= minC;

    if (!hasQuery) return opts;

    const qNorm = normalize(value);
    const qNoSpaces = normalizeNoSpaces(value);
    const words = qNorm.split(' ').filter(Boolean);

    const matches = opts.filter((opt) => {
      const labelText = getLabel(opt);
      const searchVal = typeof opt === 'object' && opt !== null && opt[searchF] != null
        ? String(opt[searchF])
        : String(labelText);
      const descText = descF && typeof opt === 'object' && opt !== null && opt[descF]
        ? String(opt[descF])
        : '';
      const full = `${normalize(searchVal)} ${normalize(descText)}`.trim();
      const fullNoSpaces = normalizeNoSpaces(full);

      const byWords = words.some((w) => {
        const ws = w.replace(/\s+/g, '');
        return full.includes(w) || fullNoSpaces.includes(ws);
      });
      const byFull = qNoSpaces.length > 0 && fullNoSpaces.includes(qNoSpaces);
      return byWords || byFull;
    });

    const limited = typeof maxO === 'number' && maxO > 0
      ? matches.slice(0, maxO)
      : matches;
    return limited;
  }, [value, minC, opts, searchF, descF, maxO, getLabel, normalize, normalizeNoSpaces]);

  const isValueValid = React.useMemo(() => {
    const v = value ? String(value).trim() : '';
    if (!v) return true;
    return opts.some((opt) => getLabel(opt) === v);
  }, [value, opts, getLabel]);

  useEffect(() => {
    setActiveIndex(-1);
  }, [displayOptions]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('pointerdown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('pointerdown', handleClickOutside);
    };
  }, [isOpen]);

  const handleChange = (e) => {
    onChange?.(e);
    onClearError?.();
    setIsOpen(true);
  };

  const handleFocus = () => {
    setIsOpen(true);
  };

  const handleBlur = () => {
    if (justSelectedRef.current) {
      justSelectedRef.current = false;
      return;
    }
    const v = value ? String(value).trim() : '';
    if (v && !isValueValid) {
      onChange?.({ target: { value: '' } });
      onInvalidBlur?.();
    }
  };

  const handleSelectOption = (opt) => {
    justSelectedRef.current = true;
    const labelVal = getLabel(opt);
    onChange?.({ target: { value: labelVal } });
    (onSelect ?? onSugerenciaSelect)?.(opt);
    setIsOpen(false);
    setActiveIndex(-1);
    inputRef.current?.blur();
  };

  const handleKeyDown = (e) => {
    if (loading) return;

    if (displayOptions.length === 0) {
      if (e.key === 'Escape') {
        setIsOpen(false);
        inputRef.current?.blur();
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setActiveIndex((i) => (i < displayOptions.length - 1 ? i + 1 : 0));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : displayOptions.length - 1));
        break;
      case 'Enter':
        e.preventDefault();
        if (activeIndex >= 0) {
          handleSelectOption(displayOptions[activeIndex]);
        } else {
          setIsOpen(false);
          inputRef.current?.blur();
        }
        break;
      case 'Escape':
        e.preventDefault();
        setIsOpen(false);
        setActiveIndex(-1);
        inputRef.current?.blur();
        break;
      default:
        break;
    }
  };

  const showDropdown = isOpen && (loading || displayOptions.length > 0);

  return (
    <div className={styles.root} ref={containerRef}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {typeof label === 'string' ? label.toUpperCase() : label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={styles.inputWrap}>
        {loading ? (
          <Skeleton height="40px" width="100%" borderRadius="6px" />
        ) : (
          <>
            <input
              ref={inputRef}
              type={type}
              value={value ?? ''}
              onChange={handleChange}
              onFocus={handleFocus}
              onBlur={handleBlur}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              autoComplete="off"
              className={`${styles.input} ${error ? styles.inputError : ''} ${isOpen && !error ? styles.inputOpen : ''}`}
            />
            {error && (
              <span className={styles.errorIcon} aria-hidden>
                <BoxIcon name="error-circle" className={styles.icon} />
              </span>
            )}
            {!error && value && !disabled && (
              <button
                type="button"
                className={styles.clearBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  onChange?.({ target: { value: '' } });
                }}
                tabIndex={-1}
                aria-label="Limpiar búsqueda"
              >
                <BoxIcon name="x" className={styles.icon} />
              </button>
            )}
          </>
        )}
      </div>

      {showDropdown && (
        <ul className={selectStyles.dropdown} role="listbox">
          {loading ? (
            <li className={styles.skeletonList} style={{ padding: '8px', margin: 0, border: 'none' }}>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className={styles.skeletonRow}>
                  <Skeleton height="16px" width="100%" borderRadius="4px" />
                  <Skeleton height="12px" width="70%" borderRadius="4px" />
                </div>
              ))}
            </li>
          ) : (
            displayOptions.map((opt, idx) => {
              const labelVal = getLabel(opt);
              const desc = descF && typeof opt === 'object' && opt[descF]
                ? String(opt[descF])
                : null;
              return (
                <li
                  key={getOptionValue(opt) ?? idx}
                  role="option"
                  aria-selected={idx === activeIndex}
                  className={`${selectStyles.option} ${idx === activeIndex ? selectStyles.optionSelected : ''}`}
                  onMouseDown={(ev) => {
                    ev.preventDefault();
                    handleSelectOption(opt);
                  }}
                  onMouseEnter={() => setActiveIndex(idx)}
                >
                  {labelVal}
                  {desc && ` - ${desc}`}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}

export default InputSearch;
