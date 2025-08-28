import React, { useState, useRef, useEffect } from 'react';
import styles from './Select.module.css';
import { BoxIcon } from 'boxicons-react';
import { motion, AnimatePresence } from 'framer-motion';

function Select({ 
    placeholder = 'Seleccionar', 
    options = [], 
    value, 
    onChange,
    icon
}) {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

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

    const handleSelect = (option) => {
        onChange(option);
        setIsOpen(false);
    };

    const selectedOption = options.find(opt => opt.value === value);

    return (
        <div className={styles.selectContainer} ref={selectRef}>
            <div 
                className={`${styles.selectButton} ${isOpen ? styles.active : ''}`}
                onClick={() => setIsOpen(!isOpen)}
            >
                {icon && <BoxIcon name={icon} className={styles.icon} />}
                <span className={styles.selectedText}>
                    {selectedOption ? selectedOption.label : placeholder}
                </span>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                >
                    <BoxIcon name='chevron-down' className={styles.arrow} />
                </motion.div>
            </div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.optionsContainer}
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ 
                            opacity: 1, 
                            y: 0,
                            transition: {
                                duration: 0.2
                            }
                        }}
                        exit={{ 
                            opacity: 0, 
                            y: -10,
                            transition: {
                                duration: 0.15
                            }
                        }}
                    >
                        {options.map((option) => (
                            <motion.div
                                key={option.value}
                                className={`${styles.option} ${option.value === value ? styles.selected : ''}`}
                                onClick={() => handleSelect(option.value)}
                                whileTap={{ scale: 0.98 }}
                            >
                                {option.icon && <BoxIcon name={option.icon} className={styles.optionIcon} />}
                                {option.label}
                            </motion.div>
                        ))}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default Select;
