import React, { useState, useEffect, useRef } from 'react';
import styles from './InputSugerencias.module.css';
import { BoxIcon } from 'boxicons-react';

function InputSugerencias({ 
    type = 'text',
    placeholder, 
    value, 
    onChange, 
    label, 
    error,
    sugerencias = [], // Array de objetos o strings
    onSugerenciaSelect, // Callback cuando se selecciona una sugerencia
    mostrarCampo = 'nombre', // Campo a mostrar si sugerencias son objetos
    buscarCampo = 'nombre', // Campo por el cual buscar si sugerencias son objetos
    maxSugerencias = 5, // Máximo número de sugerencias a mostrar
    minCaracteres = 1, // Mínimo de caracteres para mostrar sugerencias
    caseSensitive = false, // Si la búsqueda es sensible a mayúsculas
    showIcon = false, // Mostrar icono de búsqueda
    iconName = 'search', // Nombre del icono
    disabled = false,
    loading = false // Estado de carga para mostrar indicador
}) {
    const [isFocused, setIsFocused] = useState(false);
    const [sugerenciasFiltradas, setSugerenciasFiltradas] = useState([]);
    const [indiceSugerenciaActiva, setIndiceSugerenciaActiva] = useState(-1);
    
    const inputRef = useRef(null);
    const sugerenciasRef = useRef(null);
    const containerRef = useRef(null);

    // Actualizar isFocused cuando value cambie
    useEffect(() => {
        if (value && value !== '') {
            setIsFocused(true);
        }
    }, [value]);

    // Función para normalizar texto (quitar acentos, guiones, convertir a minúsculas, mantener espacios)
    const normalizeText = (text) => {
        if (!text) return '';
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
            .replace(/[-]/g, ' ') // Convertir guiones a espacios
            .replace(/\s+/g, ' ') // Normalizar espacios múltiples a uno solo
            .trim();
    };

    // Filtrar sugerencias basado en el valor del input
    useEffect(() => {
        if (!value || value.length < minCaracteres || !isFocused) {
            setSugerenciasFiltradas([]);
            return;
        }

        const valorBusquedaNormalizado = normalizeText(value);
        // Dividir la búsqueda en palabras individuales
        const palabrasBusqueda = valorBusquedaNormalizado.split(' ').filter(palabra => palabra.length > 0);
        
        const filtradas = sugerencias.filter(sugerencia => {
            let textoComparar;
            let descripcionComparar = '';
            
            if (typeof sugerencia === 'string') {
                textoComparar = sugerencia;
            } else if (typeof sugerencia === 'object' && sugerencia[buscarCampo]) {
                textoComparar = sugerencia[buscarCampo].toString();
                // También buscar en la descripción si existe
                if (sugerencia.descripcion) {
                    descripcionComparar = sugerencia.descripcion.toString();
                }
            } else {
                return false;
            }
            
            const textoCompararNormalizado = normalizeText(textoComparar);
            const descripcionCompararNormalizada = normalizeText(descripcionComparar);
            
            // Combinar texto y descripción para buscar todas las palabras
            const textoCompleto = `${textoCompararNormalizado} ${descripcionCompararNormalizada}`;
            
            // Verificar que AL MENOS UNA palabra de búsqueda esté en el texto completo
            return palabrasBusqueda.some(palabra => textoCompleto.includes(palabra));
        }).slice(0, maxSugerencias);

        setSugerenciasFiltradas(filtradas);
        setIndiceSugerenciaActiva(-1);
    }, [value, sugerencias, minCaracteres, buscarCampo, maxSugerencias, isFocused]);

    // Manejar clicks fuera del componente
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsFocused(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleInputChange = (e) => {
        onChange(e);
        setIndiceSugerenciaActiva(-1);
    };

    const handleInputFocus = () => {
        setIsFocused(true);
    };

    const handleInputBlur = () => {
        // Delay para permitir click en sugerencias antes de perder el focus
        setTimeout(() => {
            setIsFocused(false);
        }, 150);
    };

    const handleSugerenciaClick = (sugerencia) => {
        let valorSeleccionado;
        
        if (typeof sugerencia === 'string') {
            valorSeleccionado = sugerencia;
        } else {
            valorSeleccionado = sugerencia[mostrarCampo] || '';
        }

        // Crear evento sintético para mantener consistencia
        const eventoSintetico = {
            target: {
                value: valorSeleccionado
            }
        };

        // Actualizar el valor
        onChange(eventoSintetico);
        
        if (onSugerenciaSelect) {
            onSugerenciaSelect(sugerencia);
        }
        
        // Quitar el focus para ocultar las sugerencias automáticamente
        setIsFocused(false);
        setIndiceSugerenciaActiva(-1);
        
        // Quitar el focus del input
        inputRef.current?.blur();
    };

    const handleKeyDown = (e) => {
        if (sugerenciasFiltradas.length === 0) return;

        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                setIndiceSugerenciaActiva(prev => 
                    prev < sugerenciasFiltradas.length - 1 ? prev + 1 : 0
                );
                break;
            case 'ArrowUp':
                e.preventDefault();
                setIndiceSugerenciaActiva(prev => 
                    prev > 0 ? prev - 1 : sugerenciasFiltradas.length - 1
                );
                break;
            case 'Enter':
                e.preventDefault();
                if (indiceSugerenciaActiva >= 0) {
                    handleSugerenciaClick(sugerenciasFiltradas[indiceSugerenciaActiva]);
                } else {
                    // Si no hay sugerencia activa, quitar focus
                    setIsFocused(false);
                    inputRef.current?.blur();
                }
                break;
            case 'Escape':
                setIsFocused(false);
                setIndiceSugerenciaActiva(-1);
                inputRef.current?.blur();
                break;
        }
    };

    const obtenerTextoSugerencia = (sugerencia) => {
        if (typeof sugerencia === 'string') {
            return sugerencia;
        }
        return sugerencia[mostrarCampo] || '';
    };

    return (
        <div className={styles.inputContainer} ref={containerRef}>
            {label && (
                <label 
                    className={styles.inputLabel + (isFocused ? ' ' + styles.inputLabelFocused : '')} 
                    style={{
                        color: error && value !== '' ? 'var(--error-color)' : ''
                    }} 
                    onClick={() => {
                        setIsFocused(true);
                        inputRef.current?.focus();
                    }}
                >
                    {label}
                </label>
            )}
            
            <div className={styles.inputWrapper}>
                <input
                    ref={inputRef}
                    className={styles.input}
                    type={type}
                    placeholder={placeholder}
                    value={value}
                    onChange={handleInputChange}
                    onFocus={handleInputFocus}
                    onBlur={handleInputBlur}
                    onKeyDown={handleKeyDown}
                    disabled={disabled}
                    autoComplete="off"
                    style={{
                        border: error ? '1px solid var(--error-color)' : ''
                    }}
                />
                
                {showIcon && (
                    <span 
                        className={styles.inputIcon}
                        style={{
                            color: (isFocused || (value && value !== '')) ? 'var(--primary-color)' : ''
                        }}
                    >
                        {loading ? (
                            <div className={styles.loadingSpinner}>
                                <div className={styles.spinner}></div>
                            </div>
                        ) : (
                            <BoxIcon name={iconName} className={styles.icon} />
                        )}
                    </span>
                )}
            </div>

            {isFocused && sugerenciasFiltradas.length > 0 && (
                <div className={styles.sugerenciasContainer} ref={sugerenciasRef}>
                    {sugerenciasFiltradas.map((sugerencia, index) => (
                        <div
                            key={index}
                            className={`${styles.sugerenciaItem} ${
                                index === indiceSugerenciaActiva ? styles.sugerenciaActiva : ''
                            }`}
                            onClick={() => handleSugerenciaClick(sugerencia)}
                            onMouseEnter={() => setIndiceSugerenciaActiva(index)}
                        >
                            <span className={styles.sugerenciaTexto}>
                                {obtenerTextoSugerencia(sugerencia)}
                            </span>
                            {typeof sugerencia === 'object' && sugerencia.descripcion && (
                                <span className={styles.sugerenciaDescripcion}>
                                    {sugerencia.descripcion}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {error && <p className={styles.inputError}>{error}</p>}
        </div>
    );
}

export default InputSugerencias;
