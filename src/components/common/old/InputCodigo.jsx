import React, { useCallback, useEffect, useRef, useState } from 'react';
import styles from './InputCodigo.module.css';

const InputCodigo = ({ 
  cantidad = 6, 
  value = '', 
  onChange, 
  onComplete,
  disabled = false,
  placeholder = ''
}) => {
  const inputRefs = useRef([]);
  const [localValues, setLocalValues] = useState(Array(cantidad).fill(''));

  // Sincronizar el value externo con los valores locales
  useEffect(() => {
    if (value && value.length <= cantidad) {
      const newValues = value.split('').slice(0, cantidad);
      // Rellenar el resto con strings vacíos
      const filledValues = [...newValues, ...Array(cantidad - newValues.length).fill('')];
      setLocalValues(filledValues);
    } else if (!value) {
      setLocalValues(Array(cantidad).fill(''));
    }
  }, [value, cantidad]);

  // Función para manejar cambios en cada input individual
  const handleInputChange = (index, inputValue) => {
    // Solo permitir números
    if (!/^\d*$/.test(inputValue)) return;

    const newValues = [...localValues];
    newValues[index] = inputValue;
    setLocalValues(newValues);

    // Concatenar todos los valores
    const fullCode = newValues.join('');
    
    // Llamar al onChange del padre
    if (onChange) {
      onChange(fullCode);
    }

    // Si se completó el código, llamar a onComplete
    if (fullCode.length === cantidad && onComplete) {
      onComplete(fullCode);
      // Agregar clase de completado al último input
      if (inputRefs.current[index]) {
        inputRefs.current[index].classList.add('completed');
        setTimeout(() => {
          inputRefs.current[index].classList.remove('completed');
        }, 600);
      }
    }

    // Mover al siguiente input si se ingresó un dígito
    if (inputValue && index < cantidad - 1) {
      // Pequeño delay para asegurar que el valor se actualice
      setTimeout(() => {
        inputRefs.current[index + 1]?.focus();
      }, 10);
    }
  };

  // Función para manejar el keydown (backspace, flechas, etc.)
  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (localValues[index] === '') {
        // Si el input actual está vacío, ir al anterior
        if (index > 0) {
          inputRefs.current[index - 1]?.focus();
        }
      } else {
        // Limpiar el input actual
        const newValues = [...localValues];
        newValues[index] = '';
        setLocalValues(newValues);
        
        const fullCode = newValues.join('');
        if (onChange) {
          onChange(fullCode);
        }
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < cantidad - 1) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Función para manejar el foco
  const handleFocus = (index) => {
    // Seleccionar todo el contenido del input
    inputRefs.current[index]?.select();
  };

  // Función para manejar el click
  const handleClick = (index) => {
    // Si el input está vacío, ir al primer input vacío
    if (localValues[index] === '') {
      const firstEmptyIndex = localValues.findIndex(val => val === '');
      if (firstEmptyIndex !== -1) {
        inputRefs.current[firstEmptyIndex]?.focus();
        return;
      }
    }
    inputRefs.current[index]?.focus();
  };

  // Función para limpiar todos los inputs
  const clearInputs = useCallback(() => {
    setLocalValues(Array(cantidad).fill(''));
    if (onChange) {
      onChange('');
    }
  }, [cantidad, onChange]);

  // Limpiar inputs cuando se desmonte el componente
  useEffect(() => {
    return () => {
      clearInputs();
    };
  }, [clearInputs]);

  return (
    <div className={styles.container}>
      {Array.from({ length: cantidad }).map((_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={1}
          value={localValues[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onFocus={() => handleFocus(index)}
          onClick={() => handleClick(index)}
          disabled={disabled}
          placeholder={placeholder}
          className={styles.input}
          autoComplete="off"
        />
      ))}
    </div>
  );
};

export default InputCodigo;
