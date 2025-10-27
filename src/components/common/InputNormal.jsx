import React, { useState, forwardRef } from 'react';
import styles from './InputNormal.module.css';
import { BoxIcon } from 'boxicons-react';

const InputNormal = forwardRef(({ tipo, placeholder, value, onChange, icon, label, error, buttonIcon, buttonIconClick, onKeyPress, readonly = false }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    // Actualizar isFocused cuando value cambie
    React.useEffect(() => {
        if (value !== '' && value !== null && value !== undefined) {
            setIsFocused(true);
        }
    }, [value]);

    const handleShowPassword = () => {
        setShowPassword(!showPassword);
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
            <input
                ref={ref}
                className={styles.input}
                type={tipo === 'password' && showPassword ? 'text' : tipo}
                {...(tipo === 'number'
                    ? { inputMode: 'numeric' }
                    : {})}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onKeyPress={onKeyPress}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    if (value !== '' && value !== null && value !== undefined) {
                        setIsFocused(true);
                    } else {
                        setIsFocused(false);
                    }
                }}
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