import React, { useMemo, useEffect, useState } from 'react';
import styles from './InputDate.module.css';
import Select from './Select';

function clamp(value, min, max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

function parseValueByMode(mode, value) {
    if (!value) {
        if (mode === 'month') return { year: '', month: '' };
        if (mode === 'date') return { year: '', month: '', day: '' };
        if (mode === 'time') return { hour: '', minute: '' };
        return { year: '', month: '', day: '', hour: '', minute: '' };
    }

    try {
        if (mode === 'month') {
            const [y, m] = value.split('-');
            return { year: y || '', month: m || '' };
        }
        if (mode === 'date') {
            const [y, m, d] = value.split('-');
            return { year: y || '', month: m || '', day: d || '' };
        }
        if (mode === 'time') {
            const [h, mm] = value.split(':');
            return { hour: h || '', minute: mm || '' };
        }
        // datetime (YYYY-MM-DDTHH:mm)
        const [datePart, timePart] = value.split('T');
        const [y, m, d] = (datePart || '').split('-');
        const [h, mm] = (timePart || '').split(':');
        return { year: y || '', month: m || '', day: d || '', hour: h || '', minute: mm || '' };
    } catch (_) {
        if (mode === 'month') return { year: '', month: '' };
        if (mode === 'date') return { year: '', month: '', day: '' };
        if (mode === 'time') return { hour: '', minute: '' };
        return { year: '', month: '', day: '', hour: '', minute: '' };
    }
}

function formatValueByMode(mode, parts) {
    const pad2 = (n) => (n === '' || n == null ? '' : String(n).padStart(2, '0'));
    const y = parts.year;
    const m = pad2(parts.month);
    const d = pad2(parts.day);
    const h = pad2(parts.hour);
    const mm = pad2(parts.minute);

    if (mode === 'month') {
        if (!y || !m) return '';
        return `${y}-${m}`;
    }
    if (mode === 'date') {
        if (!y || !m || !d) return '';
        return `${y}-${m}-${d}`;
    }
    if (mode === 'time') {
        if (h === '' || mm === '') return '';
        return `${h}:${mm}`;
    }
    if (!y || !m || !d || h === '' || mm === '') return '';
    return `${y}-${m}-${d}T${h}:${mm}`;
}

function getDaysInMonth(year, month) {
    const y = parseInt(year, 10);
    const m = parseInt(month, 10);
    if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return 31;
    return new Date(y, m, 0).getDate();
}

// Props: mode: 'month' | 'date' | 'time' | 'datetime'
// value: string; onChange: (valueString) => void
// optional: minYear=2000, maxYear=2100, minDate, maxDate (formato YYYY-MM-DD)
function InputDate({
    mode = 'date',
    value,
    onChange,
    minYear,
    maxYear,
    placeholder,
    icon,
    minDate,
    maxDate
}) {
    const parsedFromValue = useMemo(() => parseValueByMode(mode, value), [mode, value]);
    const [parts, setParts] = useState(parsedFromValue);

    // Sync local parts when external value changes (e.g., form reset)
    useEffect(() => {
        setParts(parsedFromValue);
    }, [parsedFromValue]);

    const years = useMemo(() => {
        const now = new Date();
        const current = now.getFullYear();
        let start = current; // no años anteriores
        let end = current + 10; // 10 años más
        
        // Si hay minDate, no permitir años anteriores al año mínimo
        if (minDate) {
            const minDateParsed = parseValueByMode('date', minDate);
            if (minDateParsed.year) {
                const minYearInt = parseInt(minDateParsed.year, 10);
                if (minYearInt > start) {
                    start = minYearInt;
                }
            }
        }
        
        // Si hay maxDate, no permitir años posteriores al año máximo
        if (maxDate) {
            const maxDateParsed = parseValueByMode('date', maxDate);
            if (maxDateParsed.year) {
                const maxYearInt = parseInt(maxDateParsed.year, 10);
                if (maxYearInt < end) {
                    end = maxYearInt;
                }
            }
        }
        
        const list = [];
        for (let y = start; y <= end; y++) list.push(String(y));
        return list;
    }, [minDate, maxDate]);

    const months = useMemo(() => {
        const allMonths = [
            { value: '01', label: 'Enero' },
            { value: '02', label: 'Febrero' },
            { value: '03', label: 'Marzo' },
            { value: '04', label: 'Abril' },
            { value: '05', label: 'Mayo' },
            { value: '06', label: 'Junio' },
            { value: '07', label: 'Julio' },
            { value: '08', label: 'Agosto' },
            { value: '09', label: 'Septiembre' },
            { value: '10', label: 'Octubre' },
            { value: '11', label: 'Noviembre' },
            { value: '12', label: 'Diciembre' }
        ];
        
        // Si hay minDate y el año seleccionado es el mismo que el año mínimo
        if (minDate && parts.year) {
            const minDateParsed = parseValueByMode('date', minDate);
            const selectedYear = parseInt(parts.year, 10);
            const minYear = parseInt(minDateParsed.year, 10);
            
            // Si el año seleccionado es mayor que el año mínimo, mostrar todos los meses
            if (selectedYear > minYear) {
                return allMonths;
            }
            
            // Si el año seleccionado es igual al año mínimo, filtrar meses
            if (selectedYear === minYear && minDateParsed.month) {
                const minMonth = parseInt(minDateParsed.month, 10);
                return allMonths.filter(m => parseInt(m.value, 10) >= minMonth);
            }
        }
        
        // Si hay maxDate y el año seleccionado es el mismo que el año máximo
        if (maxDate && parts.year) {
            const maxDateParsed = parseValueByMode('date', maxDate);
            const selectedYear = parseInt(parts.year, 10);
            const maxYear = parseInt(maxDateParsed.year, 10);
            
            if (selectedYear === maxYear && maxDateParsed.month) {
                const maxMonth = parseInt(maxDateParsed.month, 10);
                return allMonths.filter(m => parseInt(m.value, 10) <= maxMonth);
            }
        }
        
        return allMonths;
    }, [minDate, maxDate, parts.year]);
    const daysCount = useMemo(() => getDaysInMonth(parts.year, parts.month), [parts.year, parts.month]);
    const days = useMemo(() => {
        const allDays = Array.from({ length: daysCount }, (_, i) => String(i + 1).padStart(2, '0'));
        
        // Si hay minDate y el año y mes seleccionados coinciden con el mínimo
        if (minDate && parts.year && parts.month) {
            const minDateParsed = parseValueByMode('date', minDate);
            const selectedYear = parseInt(parts.year, 10);
            const selectedMonth = parseInt(parts.month, 10);
            const minYear = parseInt(minDateParsed.year, 10);
            const minMonth = parseInt(minDateParsed.month, 10);
            
            // Si el año es mayor que el mínimo, no filtrar días
            if (selectedYear > minYear) {
                return allDays;
            }
            
            // Si el año es igual pero el mes es mayor, no filtrar días
            if (selectedYear === minYear && selectedMonth > minMonth) {
                return allDays;
            }
            
            // Si el año y mes son iguales, filtrar días
            if (selectedYear === minYear && selectedMonth === minMonth && minDateParsed.day) {
                const minDay = parseInt(minDateParsed.day, 10);
                return allDays.filter(d => parseInt(d, 10) >= minDay);
            }
        }
        
        // Si hay maxDate y el año y mes seleccionados coinciden con el máximo
        if (maxDate && parts.year && parts.month) {
            const maxDateParsed = parseValueByMode('date', maxDate);
            const selectedYear = parseInt(parts.year, 10);
            const selectedMonth = parseInt(parts.month, 10);
            const maxYear = parseInt(maxDateParsed.year, 10);
            const maxMonth = parseInt(maxDateParsed.month, 10);
            
            if (selectedYear === maxYear && selectedMonth === maxMonth && maxDateParsed.day) {
                const maxDay = parseInt(maxDateParsed.day, 10);
                return allDays.filter(d => parseInt(d, 10) <= maxDay);
            }
        }
        
        return allDays;
    }, [daysCount, minDate, maxDate, parts.year, parts.month]);
    const hours = useMemo(() => Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0')), []);
    const minutes = useMemo(() => Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')), []);

    function emit(nextParts) {
        const next = formatValueByMode(mode, nextParts);
        if (next) {
            onChange && onChange(next);
        }
    }

    function selectChange(field, nextValue) {
        let normalizedValue = nextValue;

        // Para el mes, siempre usar el value del objeto, no el label
        if (field === 'month') {
            const found = months.find(m => m.value === nextValue);
            normalizedValue = found ? found.value : String(clamp(parseInt(nextValue, 10) || 1, 1, 12)).padStart(2, '0');
        }

        const next = { ...parts, [field]: normalizedValue };

        // Clamp day when month/year change
        if ((field === 'month' || field === 'year') && (mode === 'date' || mode === 'datetime')) {
            const maxDay = getDaysInMonth(next.year, next.month);
            if (next.day) {
                const d = clamp(parseInt(next.day, 10), 1, maxDay);
                next.day = String(d).padStart(2, '0');
            }
        }
        setParts(next);
        emit(next);
    }

    return (
        <div className={`${styles.container} ${icon ? styles.containerWithIcon : ''}`} title={placeholder}>
            <div className={styles.group}>
                {(mode === 'date' || mode === 'datetime') && (
                    <Select
                        placeholder="Día"
                        options={days.map(d => ({ value: d, label: d }))}
                        value={parts.day || ''}
                        onChange={(val) => selectChange('day', val)}
                        iconOnly={false}
                        activePlaceholder={true}
                        containerStyle={{ borderRadius: '10px', maxHeight: '50px', backgroundColor: 'var(--tertiary-color)', maxWidth: '80px' }}
                    />
                )}

                {(mode === 'month' || mode === 'date' || mode === 'datetime') && (
                    <>
                        <Select
                            placeholder="Mes"
                            options={months}
                            value={parts.month || ''}
                            onChange={(val) => selectChange('month', val)}
                            iconOnly={false}
                            activePlaceholder={true}
                            containerStyle={{ borderRadius: '10px', maxHeight: '50px', backgroundColor: 'var(--tertiary-color)' }}
                        />
                        <Select
                            placeholder="Año"
                            options={years.map(y => ({ value: y, label: y }))}
                            value={parts.year || ''}
                            onChange={(val) => selectChange('year', val)}
                            iconOnly={false}
                            activePlaceholder={true}
                            containerStyle={{ borderRadius: '10px', maxHeight: '50px', backgroundColor: 'var(--tertiary-color)', maxWidth: '100px' }}
                        />

                    </>
                )}

                {(mode === 'time' || mode === 'datetime') && (
                    <>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Select
                                placeholder="Hora"
                                options={hours.map(h => ({ value: h, label: h }))}
                                value={parts.hour ?? ''}
                                onChange={(val) => selectChange('hour', val)}
                                iconOnly={false}
                            />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <Select
                                placeholder="Min"
                                options={minutes.map(mm => ({ value: mm, label: mm }))}
                                value={parts.minute ?? ''}
                                onChange={(val) => selectChange('minute', val)}
                                iconOnly={false}
                            />
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

export default InputDate;


