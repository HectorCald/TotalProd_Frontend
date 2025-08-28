import React from 'react';
import styles from './MultiSelect.module.css';

function MultiSelect({ title, options = [], selectedValues = [], onChange }) {
    const handleToggle = (value) => {
        if (selectedValues.includes(value)) {
            onChange(selectedValues.filter(v => v !== value));
        } else {
            onChange([...selectedValues, value]);
        }
    };

    return (
        <div className={styles.container}>
            {title && <h3 className={styles.title}>{title}</h3>}
            <div className={styles.optionsGrid}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        className={`${styles.option} ${
                            selectedValues.includes(option.value) ? styles.selected : ''
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
