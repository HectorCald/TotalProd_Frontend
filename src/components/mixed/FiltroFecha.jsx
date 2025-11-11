import React, { useEffect, useState } from 'react';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import InputDate from '../common/InputDate';
import styles from '../../styles/Inicial.module.css';
import { parseDateWithoutOffset } from '../../utils/dateUtils';

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

    if (start && end) {
        const startTime = parseDateWithoutOffset(start)?.getTime();
        const endTime = parseDateWithoutOffset(end)?.getTime();
        if (startTime && endTime && startTime === endTime) {
            return format(start);
        }
        return `${format(start)} - ${format(end)}`;
    }

    if (start) return format(start);
    if (end) return format(end);

    return placeholder;
};

const FiltroFecha = ({
    isOpen,
    setIsOpen,
    startDate = null,
    endDate = null,
    onApply,
    onClear,
    title = 'Seleccionar rango de fechas'
}) => {
    const [inicio, setInicio] = useState('');
    const [fin, setFin] = useState('');

    useEffect(() => {
        if (!isOpen) return;

        const todayFormatted = formatInputDate(new Date());

        if (startDate) {
            setInicio(formatInputDate(startDate));
        } else {
            setInicio(todayFormatted);
        }

        if (endDate) {
            setFin(formatInputDate(endDate));
        } else {
            setFin(todayFormatted);
        }
    }, [isOpen, startDate, endDate]);

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

        if (parsedStart && parsedEnd && parsedStart > parsedEnd) {
            return;
        }

        onApply?.(parsedStart, parsedEnd || parsedStart);
        setIsOpen(false);
    };

    const handleClear = () => {
        setInicio('');
        setFin('');
        onClear?.();
        setIsOpen(false);
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title={title}
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>

                <p className={styles.subTitle}>Selecciona la fecha de inicio</p>

                <InputDate
                    mode="date"
                    value={inicio}
                    onChange={setInicio}
                    placeholder="Desde"
                />
                <p className={styles.subTitle}>Selecciona la fecha de fin</p>
                <InputDate
                    mode="date"
                    value={fin}
                    onChange={setFin}
                    placeholder="Hasta"
                />
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
                <Boton
                        className='btn-gray'
                        label='Este mes'
                        onClick={() => handleQuickRange('month')}
                    />
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
                        disabled={!inicio && !fin}
                    />
                </div>
            </div>
        </ViewModal>
    );
};

export default FiltroFecha;
