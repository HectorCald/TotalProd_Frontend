import React, { useEffect, useState } from 'react';
import styles from './InputSearch.module.css';
import { BoxIcon } from 'boxicons-react';

function InputNormal({ tipo = 'text', placeholder, value, onChange, onClick }) {
    const [isFocused, setIsFocused] = useState(false);
    // Actualizar isFocused cuando value cambie
    useEffect(() => {
        setIsFocused(Boolean(value));
    }, [value]);

    const handleFocus = () => setIsFocused(true);
    const handleBlur = () => {
        if (!value) {
            setIsFocused(false);
        }
    };

    return (
        <div style={{ width: '100%', position: 'relative' }}>
            <input
                className={styles.input}
                type={tipo}
                placeholder={placeholder}
                value={value}
                onChange={onChange}
                onFocus={handleFocus}
                onBlur={handleBlur}
            />
            <button
                className={styles.inputView}
                type="button"
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