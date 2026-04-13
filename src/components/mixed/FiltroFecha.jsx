import React, { useEffect, useState } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import InputDate from '../common/InputDate';
import Text from '../common/Text';
import styles from '../../styles/Inicial.module.css';
import { parseDateWithoutOffset, formatFechaLiteral } from '../../utils/dateUtils';

const setStartOfDay = (date) => {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(0, 0, 0, 0);
    return normalized;
};

const setEndOfDay = (date) => {
    if (!date) return null;
    const normalized = new Date(date);
    normalized.setHours(23, 59, 59, 999);
    return normalized;
};

const formatInputDate = (date) => {
    if (!date) return '';
    const instance = new Date(date);
    instance.setHours(0, 0, 0, 0);
    const offsetDate = new Date(instance.getTime() - instance.getTimezoneOffset() * 60000);
    return offsetDate.toISOString().slice(0, 10);
};

export const formatDateRangeForDisplay = (start, end, placeholder = 'Seleccionar fechas') => {
    if (!start && !end) return placeholder;

    const format = (date) => {
        const parsed = parseDateWithoutOffset(date);
        if (!parsed) return '';
        return parsed.toLocaleDateString('es-BO', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    // Función para normalizar una fecha a inicio del día para comparación
    const normalizeToStartOfDay = (date) => {
        if (!date) return null;
        const parsed = parseDateWithoutOffset(date);
        if (!parsed) return null;
        const normalized = new Date(parsed);
        normalized.setHours(0, 0, 0, 0);
        return normalized;
    };

    // Función para verificar si el rango corresponde a un mes completo
    const isFullMonth = (startDate, endDate) => {
        if (!startDate || !endDate) return false;
        
        const startParsed = parseDateWithoutOffset(startDate);
        const endParsed = parseDateWithoutOffset(endDate);
        
        if (!startParsed || !endParsed) return false;
        
        const startYear = startParsed.getFullYear();
        const startMonth = startParsed.getMonth();
        const startDay = startParsed.getDate();
        
        const endYear = endParsed.getFullYear();
        const endMonth = endParsed.getMonth();
        const endDay = endParsed.getDate();
        
        // Verificar que ambas fechas estén en el mismo mes y año
        if (startYear !== endYear || startMonth !== endMonth) return false;
        
        // Verificar que la fecha de inicio sea el día 1
        if (startDay !== 1) return false;
        
        // Verificar que la fecha de fin sea el último día del mes
        const lastDayOfMonth = new Date(startYear, startMonth + 1, 0).getDate();
        if (endDay !== lastDayOfMonth) return false;
        
        return true;
    };

    // Función para verificar si el rango corresponde a un año completo
    const isFullYear = (startDate, endDate) => {
        if (!startDate || !endDate) return false;
        
        const startParsed = parseDateWithoutOffset(startDate);
        const endParsed = parseDateWithoutOffset(endDate);
        
        if (!startParsed || !endParsed) return false;
        
        const startYear = startParsed.getFullYear();
        const startMonth = startParsed.getMonth();
        const startDay = startParsed.getDate();
        
        const endYear = endParsed.getFullYear();
        const endMonth = endParsed.getMonth();
        const endDay = endParsed.getDate();
        
        // Verificar que ambas fechas estén en el mismo año
        if (startYear !== endYear) return false;
        
        // Verificar que la fecha de inicio sea el 1 de enero
        if (startMonth !== 0 || startDay !== 1) return false;
        
        // Verificar que la fecha de fin sea el 31 de diciembre
        if (endMonth !== 11 || endDay !== 31) return false;
        
        return true;
    };

    if (start && end) {
        // Normalizar ambas fechas al inicio del día para comparar solo la fecha (sin hora)
        const startNormalized = normalizeToStartOfDay(start);
        const endNormalized = normalizeToStartOfDay(end);
        
        // Si las fechas son iguales (mismo día), usar formato literal
        if (startNormalized && endNormalized && startNormalized.getTime() === endNormalized.getTime()) {
            return formatFechaLiteral(start);
        }
        
        // Si es un año completo, mostrar solo "Año 2025"
        if (isFullYear(start, end)) {
            const parsed = parseDateWithoutOffset(start);
            if (parsed) {
                const year = parsed.getFullYear();
                return `Año ${year}`;
            }
        }
        
        // Si es un mes completo, mostrar solo el nombre del mes y año
        if (isFullMonth(start, end)) {
            const parsed = parseDateWithoutOffset(start);
            if (parsed) {
                const monthYear = parsed.toLocaleDateString('es-ES', {
                    month: 'long',
                    year: 'numeric'
                });
                // Capitalizar la primera letra del mes
                return monthYear.charAt(0).toUpperCase() + monthYear.slice(1);
            }
        }
        
        // Si es un rango, formatear según si están en el mismo mes o no
        const startParsed = parseDateWithoutOffset(start);
        const endParsed = parseDateWithoutOffset(end);
        
        if (startParsed && endParsed) {
            const startYear = startParsed.getFullYear();
            const startMonth = startParsed.getMonth();
            const startDay = startParsed.getDate();
            
            const endYear = endParsed.getFullYear();
            const endMonth = endParsed.getMonth();
            const endDay = endParsed.getDate();
            
            // Si están en el mismo mes y año: "25 al 30 de Noviembre de 2025"
            if (startYear === endYear && startMonth === endMonth) {
                const monthName = startParsed.toLocaleDateString('es-ES', {
                    month: 'long'
                });
                const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
                return `${startDay} al ${endDay} de ${capitalizedMonth} de ${startYear}`;
            }
            
            // Si están en meses diferentes: "20 de mayo al 3 de junio de 2025" (abreviando)
            const startMonthShort = startParsed.toLocaleDateString('es-ES', {
                month: 'short'
            });
            const endMonthShort = endParsed.toLocaleDateString('es-ES', {
                month: 'short'
            });
            
            // Capitalizar primera letra de cada mes
            const startMonthCapitalized = startMonthShort.charAt(0).toUpperCase() + startMonthShort.slice(1);
            const endMonthCapitalized = endMonthShort.charAt(0).toUpperCase() + endMonthShort.slice(1);
            
            // Si están en el mismo año, solo mostrar el año al final
            if (startYear === endYear) {
                return `${startDay} de ${startMonthCapitalized} al ${endDay} de ${endMonthCapitalized} de ${startYear}`;
            }
            
            // Si están en años diferentes, mostrar ambos años
            return `${startDay} de ${startMonthCapitalized} de ${startYear} al ${endDay} de ${endMonthCapitalized} de ${endYear}`;
        }
        
        // Fallback al formato anterior si algo falla
        return `${format(start)} - ${format(end)}`;
    }

    // Si solo hay una fecha, usar formato literal
    if (start) return formatFechaLiteral(start);
    if (end) return formatFechaLiteral(end);

    return placeholder;
};

const FiltroFecha = ({
    isOpen,
    setIsOpen,
    startDate = null,
    endDate = null,
    onApply,
    onClear,
    title = 'Seleccionar rango de fechas',
    defaultToToday = true
}) => {
    const [inicio, setInicio] = useState('');
    const [fin, setFin] = useState('');
    const [errorFecha, setErrorFecha] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const todayFormatted = formatInputDate(new Date());

        if (startDate) {
            setInicio(formatInputDate(startDate));
        } else {
            setInicio(defaultToToday ? todayFormatted : '');
        }

        if (endDate) {
            setFin(formatInputDate(endDate));
        } else {
            setFin(defaultToToday ? todayFormatted : '');
        }
        
        // Limpiar error al abrir el modal
        setErrorFecha('');
    }, [defaultToToday, endDate, isOpen, startDate]);

    // Validar fechas cuando cambian y ajustar fecha de fin si es necesario
    useEffect(() => {
        if (!inicio) {
            setErrorFecha('');
            return;
        }

        if (!fin) {
            setErrorFecha('');
            return;
        }

        const parsedStart = inicio ? setStartOfDay(`${inicio}T00:00:00`) : null;
        const parsedEnd = fin ? setEndOfDay(`${fin}T00:00:00`) : null;

        if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
            // Si la fecha de fin es anterior a la de inicio, ajustarla automáticamente
            setFin(inicio);
            setErrorFecha('');
        } else {
            setErrorFecha('');
        }
    }, [inicio, fin]);

    const handleQuickRange = (range) => {
        const now = new Date();
        let start = new Date(now);
        let end = new Date(now);

        switch (range) {
            case 'today': {
                break;
            }
            case 'week': {
                const day = now.getDay();
                const diffToMonday = (day + 6) % 7;
                start = new Date(now);
                start.setDate(now.getDate() - diffToMonday);
                end = new Date(start);
                end.setDate(start.getDate() + 6);
                break;
            }
            case 'month': {
                start = new Date(now.getFullYear(), now.getMonth(), 1);
                end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
                break;
            }
            case 'year': {
                start = new Date(now.getFullYear(), 0, 1); // 1 de enero
                end = new Date(now.getFullYear(), 11, 31); // 31 de diciembre
                break;
            }
            default:
                return;
        }

        const normalizedStart = setStartOfDay(start);
        const normalizedEnd = setEndOfDay(end);
        setInicio(formatInputDate(normalizedStart));
        setFin(formatInputDate(normalizedEnd));
        onApply?.(normalizedStart, normalizedEnd);
        setIsOpen(false);
    };

    const handleApply = () => {
        const parsedStart = inicio ? setStartOfDay(`${inicio}T00:00:00`) : null;
        const parsedEnd = fin ? setEndOfDay(`${fin}T00:00:00`) : null;

        if (!parsedStart && !parsedEnd) {
            onClear?.();
            setIsOpen(false);
            return;
        }

        // Validar que la fecha de fin no sea anterior a la de inicio
        if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
            setErrorFecha('La fecha de fin no puede ser anterior a la fecha de inicio');
            return;
        }

        // Si hay error, no aplicar
        if (errorFecha) {
            return;
        }

        onApply?.(parsedStart, parsedEnd || parsedStart);
        setIsOpen(false);
    };

    const handleClear = () => {
        setInicio('');
        setFin('');
        setErrorFecha('');
        onClear?.();
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen} overflowVisible={true}>
            <HeaderModal
                title={title}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent} style={{ overflow: 'visible', maxHeight: 'none' }}>

                <p className={styles.subTitle}>Selecciona la fecha de inicio</p>

                <InputDate
                    mode="date"
                    value={inicio}
                    onChange={setInicio}
                    placeholder="Desde"
                    yearDirection="past"
                />
                <p className={styles.subTitle}>Selecciona la fecha de fin</p>
                <InputDate
                    mode="date"
                    value={fin}
                    onChange={setFin}
                    placeholder="Hasta"
                    minDate={inicio || undefined}
                    yearDirection="past"
                />
                {errorFecha && (
                    <div style={{ marginTop: '10px', width: '100%' }}>
                        <Text type="error" align="left">
                            {errorFecha}
                        </Text>
                    </div>
                )}
                <p className={styles.subTitle}>Accesos rápidos</p>
                <div className={styles.horizontal}>
                    <Boton
                        className='btn-gray'
                        label='Hoy'
                        onClick={() => handleQuickRange('today')}
                    />
                    <Boton
                        className='btn-gray'
                        label='Esta semana'
                        onClick={() => handleQuickRange('week')}
                    />
                </div>
                <div className={styles.horizontal}>
                    <Boton
                        className='btn-gray'
                        label='Este mes'
                        onClick={() => handleQuickRange('month')}
                    />
                    <Boton
                        className='btn-gray'
                        label='Este año'
                        onClick={() => handleQuickRange('year')}
                    />
                </div>
                <div className={styles.buttons} style={{marginTop: '30px'}}>
                    <Boton
                        className='btn-default'
                        label='Limpiar'
                        onClick={handleClear}
                    />
                    <Boton
                        className='btn-original'
                        label='Aplicar'
                        onClick={handleApply}
                        disabled={(!inicio && !fin) || !!errorFecha}
                    />
                </div>
            </div>
        </ViewModal>
    );
};

export default FiltroFecha;
