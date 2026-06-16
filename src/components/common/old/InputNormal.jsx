import React, { useEffect, useState, forwardRef } from 'react';
import styles from './InputNormal.module.css';
import { BoxIcon } from 'boxicons-react';

const InputNormal = forwardRef(({
    tipo,
    placeholder,
    value,
    onChange,
    icon,
    label,
    error,
    buttonIcon,
    buttonIconClick,
    onKeyPress,
    readonly = false,
    disabled = false,
    onClick,
    style: inputStyle = {}
}, ref) => {
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

    const handleKeyDown = (e) => {
        // Si se presiona Enter, quitar el focus del input
        if (e.key === 'Enter') {
            e.target.blur();
        }
    }

    const handleKeyPress = (e) => {
        // Si hay un onKeyPress personalizado, llamarlo
        if (onKeyPress) {
            onKeyPress(e);
        }
    }

    const inputType = tipo === 'password'
        ? (showPassword ? 'text' : 'password')
        : (tipo === 'number' ? 'text' : tipo);

    const handleNormalizedChange = (e) => {
        if (tipo === 'number') {
            const raw = e.target.value;
            const normalized = raw.replace(/,/g, '.');
            const isValidNumber = normalized === '' || /^-?\d*\.?\d*$/.test(normalized);
            if (!isValidNumber) {
                return;
            }
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

    const inputClasses = [
        styles.input,
        icon ? styles.inputWithIcon : styles.inputWithoutIcon,
        isDisabled ? styles.inputDisabled : ''
    ].filter(Boolean).join(' ');

    return (
        <div
            style={{
                width: '100%',
                position: 'relative',
                opacity: isDisabled ? 0.6 : 1
            }}
        >
            {icon && (
                <span
                    className={styles.inputIcon}
                    style={{
                        color: isFocused ? 'var(--primary-color)' : undefined,
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
                className={inputClasses}
                type={inputType}
                {...(tipo === 'number'
                    ? { inputMode: 'decimal' }
                    : {})}
                enterKeyHint="done"
                value={value}
                onChange={handleNormalizedChange}
                onKeyDown={handleKeyDown}
                onKeyPress={handleKeyPress}
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
                    opacity: isDisabled ? 0.5 : 1,
                    cursor: isDisabled ? 'not-allowed' : 'text',
                    ...inputStyle
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