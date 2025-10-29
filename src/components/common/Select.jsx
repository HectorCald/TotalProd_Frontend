import React, { useState, useRef, useEffect } from 'react';
import styles from './Select.module.css';
import { BoxIcon } from 'boxicons-react';
import { motion, AnimatePresence } from 'framer-motion';

function Select({ 
    placeholder = 'Seleccionar', 
    options = [], 
    value, 
    onChange,
    icon,
    iconOnly = false,
    dropdownDirection = 'left',
    activePlaceholder = false,
    containerStyle,
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const selectRef = useRef(null);
    const optionsRef = useRef(null);


    // Calcular la dirección de apertura
    useEffect(() => {
        if (isOpen && selectRef.current) {
            const selectRect = selectRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const spaceBelow = windowHeight - selectRect.bottom;
            const optionsHeight = optionsRef.current?.offsetHeight || 200; // valor por defecto si aún no está renderizado

            setOpenUpward(spaceBelow < optionsHeight && selectRect.top > spaceBelow);
            
            // Para el modo iconOnly, ajustar la posición horizontal según el prop dropdownDirection
            if (iconOnly && optionsRef.current) {
                if (dropdownDirection === 'right') {
                    optionsRef.current.style.left = 'auto';
                    optionsRef.current.style.right = '0';
                } else {
                    // Por defecto 'left'
                    optionsRef.current.style.left = '0';
                    optionsRef.current.style.right = 'auto';
                }
            }
        }
    }, [isOpen, iconOnly, dropdownDirection]);

    // Cerrar el select cuando se hace click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (selectRef.current && !selectRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSelect = (optionValue) => {
        onChange(optionValue);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);
    const isPlaceholder = !selectedOption && !activePlaceholder;
    const hasSingleOption = options.length === 1;

    return (
        <div className={`${styles.selectContainer} ${iconOnly ? styles.iconOnly : ''} ${disabled ? styles.disabled : ''}`} ref={selectRef} style={containerStyle}>
            
            <div 
                className={`${styles.selectButton} ${isOpen ? styles.active : ''} ${iconOnly ? styles.iconOnlyButton : ''} ${hasSingleOption ? styles.singleOption : ''}`}
                onClick={() => !hasSingleOption && !disabled && setIsOpen(!isOpen)}
            >
                {iconOnly ? (
                    // Modo solo icono
                    <BoxIcon 
                        name={(selectedOption && selectedOption.icon) ? selectedOption.icon : icon} 
                        className={styles.iconOnlyIcon} 
                    />
                ) : (
                    // Modo normal
                    <>
                        {icon && <BoxIcon name={icon} className={`${styles.icon} ${isPlaceholder ? styles.iconGray : ''}`} />}
                        <span className={`${styles.selectedText} ${isPlaceholder ? styles.textGray : ''}`}>
                            {selectedOption ? selectedOption.label : placeholder}
                        </span>
                        {!hasSingleOption && (
                            <motion.div
                                animate={{ rotate: isOpen ? 180 : 0 }}
                                transition={{ duration: 0.2 }}
                            >
                                <BoxIcon name='chevron-down' className={styles.arrow} />
                            </motion.div>
                        )}
                    </>
                )}
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        ref={optionsRef}
                        className={`${styles.optionsContainer} ${openUpward ? styles.openUpward : ''}`}
                        initial={{ opacity: 0, y: openUpward ? 10 : -10 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: {
                                duration: 0.2
                            }
                        }}
                        exit={{ 
                            opacity: 0, 
                            y: openUpward ? 10 : -10,
                            transition: {
                                duration: 0.15
                            }
                        }}
                    >
                        <div className={styles.optionsScroll}>
                            {options.map((option, index) => (
                                <motion.div
                                    key={option.value || option.id || index}
                                    className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                                    onClick={() => handleSelect(option.value)}
                                    whileTap={{ scale: 0.98 }}
                                >
                                    {option.icon && <BoxIcon name={option.icon} className={styles.optionIcon} />}
                                    {option.label}
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Select;