import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { BoxIcon } from 'boxicons-react';
import styles from './CalendarModal.module.css';

const CalendarModal = ({ isOpen, onClose, selectedDate, onSelectDate, mode = 'date' }) => {
    const [viewDate, setViewDate] = useState(new Date());

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            if (selectedDate && (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || /^\d{4}-\d{2}$/.test(selectedDate))) {
                const parts = selectedDate.split('-');
                const y = parseInt(parts[0]);
                const m = parseInt(parts[1]) - 1;
                const d = parts.length === 3 ? parseInt(parts[2]) : 1;
                setViewDate(new Date(y, m, d));
            } else {
                setViewDate(new Date());
            }
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, selectedDate]);

    if (!isOpen) return null;

    const currentMonth = viewDate.getMonth();
    const currentYear = viewDate.getFullYear();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const handlePrevMonth = (e) => {
        e.stopPropagation();
        if (mode === 'month') {
            setViewDate(new Date(currentYear - 1, currentMonth, 1));
        } else {
            setViewDate(new Date(currentYear, currentMonth - 1, 1));
        }
    };

    const handleNextMonth = (e) => {
        e.stopPropagation();
        if (mode === 'month') {
            setViewDate(new Date(currentYear + 1, currentMonth, 1));
        } else {
            setViewDate(new Date(currentYear, currentMonth + 1, 1));
        }
    };

    const handleSelectDay = (day) => {
        const y = currentYear;
        const m = String(currentMonth + 1).padStart(2, '0');
        const d = String(day).padStart(2, '0');
        onSelectDate(`${y}-${m}-${d}`);
        onClose();
    };

    const handleSelectMonth = (monthIndex) => {
        const y = currentYear;
        const m = String(monthIndex + 1).padStart(2, '0');
        onSelectDate(`${y}-${m}`);
        onClose();
    };

    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    const diasSemana = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];

    let selectedY, selectedM, selectedD;
    if (selectedDate && (/^\d{4}-\d{2}-\d{2}$/.test(selectedDate) || /^\d{4}-\d{2}$/.test(selectedDate))) {
        const parts = selectedDate.split('-');
        selectedY = parseInt(parts[0]);
        selectedM = parseInt(parts[1]) - 1;
        if (parts.length === 3) {
            selectedD = parseInt(parts[2]);
        }
    }

    return createPortal(
        <div className={styles.overlay} onClick={onClose}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>Seleccionar Fecha</h2>
                    <div className={styles.closeBtn} onClick={onClose}>
                        <BoxIcon name="x" color="#999" />
                    </div>
                </div>
                
                <div className={styles.content}>
                    <div className={styles.calendarNav}>
                        <button className={styles.navBtn} onClick={handlePrevMonth} type="button">
                            <BoxIcon name="chevron-left" />
                        </button>
                        <span className={styles.monthYearText}>
                            {mode === 'month' ? currentYear : `${meses[currentMonth]} ${currentYear}`}
                        </span>
                        <button className={styles.navBtn} onClick={handleNextMonth} type="button">
                            <BoxIcon name="chevron-right" />
                        </button>
                    </div>
                    
                    {mode === 'month' ? (
                        <div className={styles.monthGrid}>
                            {meses.map((mes, index) => {
                                const isSelected = selectedY === currentYear && selectedM === index;
                                const isCurrentMonth = new Date().getFullYear() === currentYear && new Date().getMonth() === index;
                                return (
                                    <div 
                                        key={mes} 
                                        className={`${styles.monthCell} ${isSelected ? styles.selectedDay : ''} ${isCurrentMonth && !isSelected ? styles.todayDay : ''}`}
                                        onClick={() => handleSelectMonth(index)}
                                    >
                                        {mes.slice(0, 3)}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className={styles.calendarGrid}>
                            {diasSemana.map(d => (
                                <div key={d} className={styles.weekDay}>{d}</div>
                            ))}
                            {Array.from({ length: startOffset }).map((_, i) => (
                                <div key={`empty-${i}`} className={styles.emptyDay} />
                            ))}
                            {Array.from({ length: daysInMonth }).map((_, i) => {
                                const day = i + 1;
                                const isSelected = selectedY === currentYear && selectedM === currentMonth && selectedD === day;
                                const isToday = new Date().getFullYear() === currentYear && new Date().getMonth() === currentMonth && new Date().getDate() === day;
                                return (
                                    <div 
                                        key={day} 
                                        className={`${styles.dayCell} ${isSelected ? styles.selectedDay : ''} ${isToday && !isSelected ? styles.todayDay : ''}`}
                                        onClick={() => handleSelectDay(day)}
                                    >
                                        {day}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

export default CalendarModal;
