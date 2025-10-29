import React, { useState, forwardRef } from 'react';
import styles from './InputNormal.module.css';
import { BoxIcon } from 'boxicons-react';

const InputNormal = forwardRef(({ tipo, placeholder, value, onChange, icon, label, error, buttonIcon, buttonIconClick, onKeyPress, readonly = false }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    
    // Determinar si la label debe estar arriba (cuando hay valor o está en foco)
    const hasValue = value !== '' && value !== null && value !== undefined;
    const labelUp = hasValue || isFocused;

    // Actualizar isFocused cuando value cambie
    React.useEffect(() => {
        if (hasValue) {
            setIsFocused(true);
        }
    }, [value]);

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
    }

    const handleFocus = () => {
        setIsFocused(true);
    }

    const handleBlur = () => {
        if (!hasValue) {
            setIsFocused(false);
        }
    }

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            {icon && (
                <span
                    className={styles.inputIcon}
                    style={{
                        color: isFocused ? 'var(--primary-color)' : ''
                    }}
                >
                    <BoxIcon name={icon} className={styles.icon} />
                </span>
            )}
            {placeholder && (
                <label 
                    className={`${styles.inputLabel} ${labelUp ? styles.inputLabelUp : ''}`}
                    style={{
                        paddingLeft: icon ? '50px' : '15px'
                    }}
                >
                    {placeholder}
                </label>
            )}
            <input
                ref={ref}
                className={styles.input}
                type={tipo === 'password' && showPassword ? 'text' : tipo}
                {...(tipo === 'number'
                    ? { inputMode: 'numeric' }
                    : {})}
                value={value}
                onChange={onChange}
                onKeyPress={onKeyPress}
                onFocus={handleFocus}
                onBlur={handleBlur}
                onWheel={(e) => {
                    // Prevenir que el scroll cambie el valor en inputs de tipo number
                    if (tipo === 'number') {
                        e.target.blur();
                    }
                }}
                readOnly={readonly}
                style={{
                    paddingRight: buttonIcon ? '50px' : '15px',
                    paddingLeft: icon ? '50px' : '15px',
                    opacity: readonly ? 0.5 : 1,
                    cursor: readonly ? 'not-allowed' : 'text'
                }}

            />
            {tipo === 'password' && (
                <span
                    className={styles.inputView}
                    onClick={handleShowPassword}
                    style={{
                        color: isFocused ? 'var(--primary-color)' : ''
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