import React, { useEffect, useState, forwardRef } from 'react';
import styles from './InputNormal.module.css';
import { BoxIcon } from 'boxicons-react';

const InputNormal = forwardRef(({ tipo, placeholder, value, onChange, icon, label, error, buttonIcon, buttonIconClick, onKeyPress, readonly = false, disabled = false, onClick }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const isDisabled = readonly || disabled;
    
    // Determinar si la label debe estar arriba (cuando hay valor o está en foco)
    const hasValue = value !== '' && value !== null && value !== undefined;
    const labelUp = hasValue || isFocused;

    // Actualizar isFocused cuando value cambie
    useEffect(() => {
        if (hasValue) {
            setIsFocused(true);
        }
    }, [hasValue]);

    useEffect(() => {
        if (isDisabled) {
            setIsFocused(false);
        }
    }, [isDisabled]);

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const handleFocus = (e) => {
        if (isDisabled) {
            e.target.blur();
            return;
        }
        setIsFocused(true);
    }

    const handleBlur = () => {
        if (isDisabled) {
            return;
        }
        if (!hasValue) {
            setIsFocused(false);
        }
    }

    const inputType = tipo === 'password'
        ? (showPassword ? 'text' : 'password')
        : (tipo === 'number' ? 'text' : tipo);

    const handleNormalizedChange = (e) => {
        if (tipo === 'number') {
            const raw = e.target.value;
            const normalized = raw.replace(/,/g, '.');
            if (onChange) {
                onChange({
                    ...e,
                    target: {
                        ...e.target,
                        value: normalized
                    }
                });
            }
            return;
        }
        if (onChange) onChange(e);
    };

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            {icon && (
                <span
                    className={`${styles.inputIcon} ${isDisabled ? styles.inputIconDisabled : ''}`}
                    style={{
                        color: isDisabled ? '' : (isFocused ? 'var(--primary-color)' : ''),
                        pointerEvents: isDisabled ? 'none' : undefined
                    }}
                >
                    <BoxIcon name={icon} className={styles.icon} />
                </span>
            )}
            {placeholder && (
                <label 
                    className={`${styles.inputLabel} ${labelUp ? styles.inputLabelUp : ''} ${isDisabled ? styles.inputLabelDisabled : ''}`}
                    style={{
                        paddingLeft: icon ? '50px' : '15px'
                    }}
                >
                    {placeholder}
                </label>
            )}
            <input
                ref={ref}
                className={`${styles.input} ${isDisabled ? styles.inputDisabled : ''}`}
                type={inputType}
                {...(tipo === 'number'
                    ? { inputMode: 'decimal' }
                    : {})}
                value={value}
                onChange={handleNormalizedChange}
                onKeyPress={onKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onClick={onClick}
                readOnly={readonly}
                disabled={disabled}
                tabIndex={isDisabled ? -1 : undefined}
                onWheel={(e) => {
                    // Prevenir que el scroll cambie el valor en inputs de tipo number
                    if (tipo === 'number') {
                        e.target.blur();
                    }
                }}
                style={{
                    paddingRight: buttonIcon ? '50px' : '15px',
                    paddingLeft: icon ? '50px' : '15px',
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'text'
                }}

            />
            {tipo === 'password' && (
                <span
                    className={styles.inputView}
                    onClick={handleShowPassword}
                    style={{
                        color: isDisabled ? 'var(--quinary-color)' : (isFocused ? 'var(--primary-color)' : ''),
                        pointerEvents: isDisabled ? 'none' : undefined,
                        opacity: isDisabled ? 0.6 : 1
                    }}
                >
                    {showPassword ? <BoxIcon name="hide" /> : <BoxIcon name="show" />}
                </span>
            )}
            {buttonIcon && (
                <span
                    className={styles.inputButton}
                    onClick={buttonIconClick}
                >
                    <BoxIcon name={buttonIcon} />
                </span>
            )}
        </div>
    );
});

InputNormal.displayName = 'InputNormal';

export default InputNormal;