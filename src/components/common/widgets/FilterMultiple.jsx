import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './FilterMultiple.module.css';
import { BoxIcon } from 'boxicons-react';
import Accordion from './Accordion';
import Checkbox from '../inputs/Checkbox';
import Boton from '../botones/Boton';
import CalendarModal from './CalendarModal';
import useFechaLiteral from '../../../hooks/useFechaLiteral';
import clientService from '../../../services/clientService';
import proveedorService from '../../../services/proveedorService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import categoryAlmacenService from '../../../services/categoryAlmacenService';

const DateFilterField = ({ label, value, onClick, onClear }) => {
    const literal = useFechaLiteral(value);
    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '13px', width: '50px', color: 'var(--secondary-color)' }}>{label}:</span>
            <button 
                type="button" 
                onClick={onClick}
                style={{
                    flex: 1,
                    padding: '8px 12px',
                    borderRadius: '8px',
                    border: '1px solid var(--quaternary-color)',
                    backgroundColor: '#fff',
                    textAlign: 'left',
                    fontSize: '13px',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    minHeight: '36px'
                }}
            >
                <span style={{ color: value ? '#1a1a1a' : '#a0aec0' }}>{value ? literal || value : 'Seleccionar'}</span>
                {value && (
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onClear();
                        }}
                        style={{ display: 'flex', alignItems: 'center', padding: '2px' }}
                    >
                        <BoxIcon name="x" size="xs" color="#999" />
                    </div>
                )}
            </button>
        </div>
    );
};

const FilterMultiple = ({ filters = [], onApply, activeFilters = {} }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [selectedFilters, setSelectedFilters] = useState({});
    const [calendarOpen, setCalendarOpen] = useState(null); // { filterId, key: 'inicio' | 'fin' }

    const [dynamicOptions, setDynamicOptions] = useState({});
    const [loadingDynamic, setLoadingDynamic] = useState({});
    const fetchedFiltersRef = useRef(new Set());

    useEffect(() => {
        let active = true;

        filters.forEach(filter => {
            if (fetchedFiltersRef.current.has(filter.id)) {
                return;
            }

            let fetchFn = filter.fetchOptions;
            let cacheKey = null;

            if (!fetchFn) {
                if (filter.id === 'cliente_id') {
                    cacheKey = 'clientesListado';
                    fetchFn = async () => await clientService.getAll();
                } else if (filter.id === 'proveedor_id') {
                    cacheKey = 'proveedoresListado';
                    fetchFn = async () => await proveedorService.getAll();
                } else if (filter.id === 'category_id') {
                    const isAcopio = window.location.pathname.includes('materia-prima') || window.location.pathname.includes('acopio');
                    cacheKey = isAcopio ? 'categoriasAcopioListado' : 'categoriasAlmacenListado';
                    const service = isAcopio ? categoryAcopioService : categoryAlmacenService;
                    fetchFn = async () => await service.getAll();
                }
            }

            if (fetchFn) {
                if (!cacheKey) {
                    cacheKey = `FiltroListado_${filter.id}`;
                }

                const cached = sessionStorage.getItem(cacheKey);
                if (cached) {
                    try {
                        const parsed = JSON.parse(cached);
                        if (parsed && active) {
                            fetchedFiltersRef.current.add(filter.id);
                            let mappedOptions = parsed;
                            // Si son datos crudos (tienen id y name pero no label)
                            if (parsed.length > 0 && parsed[0].name && typeof parsed[0].label === 'undefined') {
                                mappedOptions = parsed.map(item => ({ label: item.name, value: String(item.id) }));
                            }
                            setDynamicOptions(prev => ({ ...prev, [filter.id]: mappedOptions }));
                            return; // Ya cargó de caché
                        }
                    } catch (e) {
                        console.error("Error parsing cache:", e);
                    }
                }

                setLoadingDynamic(prev => ({ ...prev, [filter.id]: true }));
                fetchFn().then(res => {
                    if (active) {
                        let mappedOptions = [];
                        let rawDataToCache = null;

                        if (filter.fetchOptions) {
                            mappedOptions = res || [];
                            rawDataToCache = mappedOptions;
                        } else {
                            if (res && res.success && res.data) {
                                mappedOptions = res.data.map(item => ({ label: item.name, value: String(item.id) }));
                                rawDataToCache = res.data;
                            }
                        }

                        fetchedFiltersRef.current.add(filter.id);
                        setDynamicOptions(prev => ({ ...prev, [filter.id]: mappedOptions }));
                        setLoadingDynamic(prev => ({ ...prev, [filter.id]: false }));
                        
                        if (cacheKey && rawDataToCache) {
                            sessionStorage.setItem(cacheKey, JSON.stringify(rawDataToCache));
                        }
                    }
                }).catch((err) => {
                    console.error(`Error loading options for filter ${filter.id}:`, err);
                    if (active) {
                        setLoadingDynamic(prev => ({ ...prev, [filter.id]: false }));
                    }
                });
            }
        });

        return () => {
            active = false;
        };
    }, [filters]);

    // Reset local state to applied filters when opening the menu
    useEffect(() => {
        if (isOpen) {
            setSelectedFilters(activeFilters || {});
        }
    }, [isOpen, activeFilters]);

    const handleToggle = () => setIsOpen(!isOpen);

    const handleCheckboxChange = (filterId, optionValue, isChecked) => {
        setSelectedFilters(prev => {
            const currentFilterSelections = prev[filterId] || [];
            let newSelections = [...currentFilterSelections];
            
            const filterConfig = filters.find(f => f.id === filterId);
            if (filterConfig && filterConfig.singleSelect) {
                newSelections = isChecked ? [optionValue] : [];
            } else {
                if (isChecked) {
                    newSelections.push(optionValue);
                } else {
                    newSelections = newSelections.filter(v => v !== optionValue);
                }
            }

            return {
                ...prev,
                [filterId]: newSelections
            };
        });
    };

    const handleDateChange = (filterId, key, val) => {
        setSelectedFilters(prev => {
            const currentVal = prev[filterId] || {};
            return {
                ...prev,
                [filterId]: {
                    ...currentVal,
                    [key]: val
                }
            };
        });
    };

    const handleClearDate = (filterId, key) => {
        setSelectedFilters(prev => {
            const currentVal = prev[filterId] || {};
            const newVal = { ...currentVal };
            delete newVal[key];
            if (Object.keys(newVal).length === 0) {
                const updated = { ...prev };
                delete updated[filterId];
                return updated;
            }
            return {
                ...prev,
                [filterId]: newVal
            };
        });
    };

    const handleApply = () => {
        if (onApply) {
            onApply(selectedFilters);
        }
        setIsOpen(false);
    };

    const handleClear = () => {
        setSelectedFilters({});
        if (onApply) {
            onApply({});
        }
        setIsOpen(false);
    };

    const totalSelected = Object.values(activeFilters).reduce((acc, curr) => {
        if (!curr) return acc;
        if (Array.isArray(curr)) return acc + curr.length;
        if (typeof curr === 'object') {
            return acc + (curr.inicio || curr.fin ? 1 : 0);
        }
        return acc;
    }, 0);

    return (
        <div className={styles.filterContainer}>
            <button className={styles.filterButton} onClick={handleToggle}>
                <div className={styles.filterIcon}>
                    <BoxIcon name="filter-alt" color="#4a5568" />
                </div>
                <span>Filtros</span>
                {totalSelected > 0 && (
                    <div className={styles.badge}>{totalSelected}</div>
                )}
            </button>

            {isOpen && createPortal(
                <div className={styles.dropdownOverlay} onClick={handleToggle}>
                    <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                        <div className={styles.header}>
                            <h3 className={styles.title}>Filtros</h3>
                            <div className={styles.closeBtn} onClick={handleToggle}>
                                <BoxIcon name="x" color="#999" />
                            </div>
                        </div>

                        <div className={styles.content}>
                            {filters.map(filter => (
                                <Accordion key={filter.id} title={filter.title} defaultOpen={true}>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', padding: '8px 0' }}>
                                        {filter.type === 'date' ? (
                                            <>
                                                <DateFilterField 
                                                    label="Desde"
                                                    value={selectedFilters[filter.id]?.inicio || ''}
                                                    onClick={() => setCalendarOpen({ filterId: filter.id, key: 'inicio' })}
                                                    onClear={() => handleClearDate(filter.id, 'inicio')}
                                                />
                                                <DateFilterField 
                                                    label="Hasta"
                                                    value={selectedFilters[filter.id]?.fin || ''}
                                                    onClick={() => setCalendarOpen({ filterId: filter.id, key: 'fin' })}
                                                    onClear={() => handleClearDate(filter.id, 'fin')}
                                                />
                                            </>
                                        ) : (filter.fetchOptions || ['cliente_id', 'proveedor_id', 'category_id'].includes(filter.id)) ? (
                                            loadingDynamic[filter.id] && (!dynamicOptions[filter.id] || dynamicOptions[filter.id].length === 0) ? (
                                                <div style={{ fontSize: '13px', color: 'var(--secondary-color)', paddingLeft: '4px' }}>Cargando...</div>
                                            ) : (
                                                [...(dynamicOptions[filter.id] || [])]
                                                    .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
                                                    .map(option => (
                                                        <Checkbox 
                                                            key={option.value}
                                                            label={option.label}
                                                            checked={(selectedFilters[filter.id] || []).includes(option.value)}
                                                            onChange={(isChecked) => handleCheckboxChange(filter.id, option.value, isChecked)}
                                                        />
                                                    ))
                                            )
                                        ) : (
                                            [...(filter.options || [])]
                                                .sort((a, b) => (a.label || '').localeCompare(b.label || ''))
                                                .map(option => (
                                                <Checkbox 
                                                    key={option.value}
                                                    label={option.label}
                                                    checked={(selectedFilters[filter.id] || []).includes(option.value)}
                                                    onChange={(isChecked) => handleCheckboxChange(filter.id, option.value, isChecked)}
                                                />
                                            ))
                                        )}
                                    </div>
                                </Accordion>
                            ))}
                            {filters.length === 0 && (
                                <p style={{ color: '#718096', fontSize: '14px', textAlign: 'center', margin: 0 }}>No hay filtros disponibles</p>
                            )}
                        </div>

                        <div className={styles.footer} style={{ gap: '12px', display: 'flex' }}>
                            <Boton 
                                label="Limpiar" 
                                className="btn-default" 
                                style={{ color: '#333', border: '1px solid transparent', backgroundColor: 'transparent' }}
                                onClick={handleClear} 
                            />
                            <Boton 
                                label="Aplicar" 
                                className="btn-original" 
                                onClick={handleApply} 
                            />
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {calendarOpen && (
                <CalendarModal 
                    isOpen={!!calendarOpen}
                    onClose={() => setCalendarOpen(null)}
                    selectedDate={selectedFilters[calendarOpen.filterId]?.[calendarOpen.key] || ''}
                    onSelectDate={(val) => handleDateChange(calendarOpen.filterId, calendarOpen.key, val)}
                />
            )}
        </div>
    );
};

export default FilterMultiple;
