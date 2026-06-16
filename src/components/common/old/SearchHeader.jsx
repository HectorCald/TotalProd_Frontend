import React, { useState, useRef, useEffect } from 'react';
import styles from './SearchHeader.module.css';
import { BoxIcon } from 'boxicons-react';

const SearchHeader = ({ 
    placeholder = 'Buscar...', 
    value = '', 
    onChange = () => {}, 
    onClear = () => {},
    isExpanded = false,
    onToggle = () => {}
}) => {
    const [isOpen, setIsOpen] = useState(isExpanded);
    const [inputValue, setInputValue] = useState(value);
    const inputRef = useRef(null);
    const containerRef = useRef(null);

    // Sincronizar con props externas
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        setIsOpen(isExpanded);
    }, [isExpanded]);

    // Enfocar input cuando se expande
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    const handleToggle = () => {
        const newIsOpen = !isOpen;
        setIsOpen(newIsOpen);
        onToggle(newIsOpen);
        
        // Si se cierra (presionando X), limpiar siempre el contenido
        if (!newIsOpen) {
            handleClear();
        }
    };

    // Limpiar cuando se cierra el componente (cuando isExpanded cambia a false)
    useEffect(() => {
        if (!isExpanded && isOpen) {
            // Si el componente se cierra externamente, limpiar el contenido
            handleClear();
        }
    }, [isExpanded]);

    // Cerrar automáticamente cuando se hace click fuera del contenedor y no hay valor
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                isOpen &&
                containerRef.current &&
                !containerRef.current.contains(event.target)
            ) {
                // Si no hay valor en el input, cerrar automáticamente
                if (!inputValue.trim()) {
                    handleToggle();
                }
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, inputValue]);

    const handleInputChange = (e) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);
    };

    const handleClear = () => {
        setInputValue('');
        onChange('');
        onClear();
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Escape') {
            handleToggle();
        }
    };

    return (
        <div ref={containerRef}>
            {/* Botón de lupa/X */}
            <button 
                className={styles.searchButton}
                onClick={handleToggle}
                type="button"
            >
                <BoxIcon 
                    name={isOpen ? 'x' : 'search'} 
                    className={styles.searchIcon} 
                />
                {!isOpen && <span className={styles.searchText}>Buscar</span>}
            </button>

            {/* Input expandible - fuera del contenedor del botón */}
            {isOpen && (
                <div className={styles.inputContainer}>
                    <input
                        ref={inputRef}
                        type="text"
                        placeholder={placeholder}
                        value={inputValue}
                        onChange={handleInputChange}
                        onKeyDown={handleKeyDown}
                        className={styles.searchInput}
                    />
                </div>
            )}
        </div>
    );
};

export default SearchHeader;
