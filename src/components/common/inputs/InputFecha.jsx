import React, { useState } from 'react';
import { BoxIcon } from 'boxicons-react';
import inputStyles from './Input.module.css';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import CalendarModal from '../widgets/CalendarModal';

const InputFecha = ({
    label,
    value,
    onChange,
    required,
    error,
    onClearError,
    readOnly,
    placeholder = "Seleccionar fecha",
    mode = "date",
    abbreviate = false,
    ...rest
}) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleInputClick = () => {
        if (!readOnly) {
            setIsOpen(true);
            if (error && onClearError) onClearError();
        }
    };

    const displayValue = useFechaLiteral(value, abbreviate);

    return (
        <div className={inputStyles.root}>
            {label && (
                <label className={inputStyles.label}>
                    {typeof label === 'string' ? label.toUpperCase() : label}
                    {required && <span className={inputStyles.required}> *</span>}
                </label>
            )}
            <div 
                className={`${inputStyles.inputWrap} ${readOnly ? inputStyles.inputWrapReadOnly : ''}`}
                onClick={handleInputClick}
            >
                <input 
                    type="text" 
                    className={`${inputStyles.input} ${error ? inputStyles.inputError : ''}`}
                    value={displayValue}
                    readOnly
                    placeholder={placeholder}
                    disabled={readOnly}
                    style={{ cursor: readOnly ? 'not-allowed' : 'pointer', paddingRight: value && !readOnly ? 36 : undefined }}
                />
                {!!value && !readOnly && (
                    <button
                        type="button"
                        className={inputStyles.clearBtn}
                        onClick={(e) => {
                            e.stopPropagation();
                            onChange(null);
                        }}
                        tabIndex={-1}
                        aria-label="Limpiar selección"
                    >
                        <BoxIcon name="x" className={inputStyles.icon} />
                    </button>
                )}
            </div>
            {error && (
                <div className={inputStyles.errorTextMessage}>
                    <BoxIcon name="error" className={inputStyles.errorTextIcon} />
                    <span>{typeof error === 'string' ? error : 'El campo es obligatorio'}</span>
                </div>
            )}
            <CalendarModal 
                isOpen={isOpen} 
                onClose={() => setIsOpen(false)} 
                selectedDate={value} 
                onSelectDate={onChange} 
                mode={mode}
                {...rest}
            />
        </div>
    );
};

export default InputFecha;
