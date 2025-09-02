import React, { useState, forwardRef } from 'react';
import styles from './InputNormal.module.css';
import { BoxIcon } from 'boxicons-react';

const InputNormal = forwardRef(({ tipo, placeholder, value, onChange, icon, label, error, buttonIcon, buttonIconClick, onKeyPress }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    // Actualizar isFocused cuando value cambie
    React.useEffect(() => {
        if (value && value !== '') {
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
                    <BoxIcon name={icon} />
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
                    if (value !== '') {
                        setIsFocused(true);
                    } else {
                        setIsFocused(false);
                    }
                }}
                style={{
                    paddingRight: buttonIcon ? '50px' : '15px',
                    paddingLeft: icon ? '50px' : '15px'
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