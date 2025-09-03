import React, { useState } from 'react';
import styles from './InputSearch.module.css';
import { BoxIcon } from 'boxicons-react';

function InputNormal({ tipo, placeholder, value, onChange, etiqueta, error, onClick }) {
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
                placeholder={placeholder}
                value={value}
                onChange={onChange}
            />
            <button
                className={styles.inputView}
                onClick={onClick}
                style={{
                    color: isFocused ? 'var(--primary-color)' : ''
                }}
            >
                <BoxIcon name="search" className={styles.inputViewIcon}/>
            </button>
        </div>
    );
}
export default InputNormal;