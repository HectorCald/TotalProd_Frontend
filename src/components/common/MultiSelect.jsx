import React from 'react';
import styles from './MultiSelect.module.css';

function MultiSelect({ title, options = [], selectedValues = [], onChange }) {
    const handleToggle = (optionValue) => {
        // Si el plugin ya está seleccionado, lo quitamos
        if (selectedValues.includes(optionValue)) {
            onChange(selectedValues.filter(value => value !== optionValue));
        } else {
            // Si no está seleccionado, lo añadimos
            onChange([...selectedValues, optionValue]);
        }
    };

    // Helper function to check if una opción está seleccionada comparando su value con los plugins del usuario
    const isOptionSelected = (optionValue) => {
        return selectedValues.includes(optionValue);
    };

    return (
        <div className={styles.container}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <div className={styles.optionsGrid}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        className={`${styles.option} ${
                            isOptionSelected(option.value) ? styles.selected : ''
                        }`}
                        onClick={() => handleToggle(option.value)}
                        type="button"
                    >
                        {option.name}
                    </button>
                ))}
            </div>
        </div>
    );
}

export default MultiSelect;
