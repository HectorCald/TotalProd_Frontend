import React, { useState } from 'react';
import styles from './InputNormal.module.css';
import { BoxIcon } from 'boxicons-react';

function InputNormal({ tipo, placeholder, value, onChange, etiqueta, error }) {
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
            <input
                className={styles.input}
                type={tipo === 'password' && showPassword ? 'text' : tipo}
                {...(tipo === 'number'
                    ? { inputMode: 'numeric', pattern: '[0-9]*' }
                    : {})}
                placeholder={placeholder}
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
        </div>
    );
}
export default InputNormal;