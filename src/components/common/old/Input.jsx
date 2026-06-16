import React, { useState } from 'react';
import styles from './Input.module.css';
import { BoxIcon } from 'boxicons-react';


function Input({ type, placeholder, value, onChange, label, error }) {
    const [isFocused, setIsFocused] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

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
        <div className={styles.inputContainer}>
            <label className={styles.inputLabel + (isFocused ? ' ' + styles.inputLabelFocused : '')} style={{
                color: error && value !== '' ? 'var(--error-color)' : ''
            }} onClick={()=>setIsFocused(true)}>{label}</label>
            <input
                className={styles.input}
                type={type === 'password' && showPassword ? 'text' : type}
                placeholder={placeholder}
                inputMode={type === 'number' || type ==='tel'? 'numeric' : 'text'}
                value={value}
                onChange={onChange}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                    if (value !== '') {
                        setIsFocused(true);
                    } else {
                        setIsFocused(false);
                    }
                }}
                style={{
                    border: error ? '1px solid var(--error-color)' : ''
                }}
            />
            {error && <p className={styles.inputError}>{error}</p>}
            {type === 'password' && (
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
        </div>
    );
}

export default Input;