import React, { useState } from 'react';
import styles from './DatoTiempo.module.css';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { registerLocale, setDefaultLocale } from 'react-datepicker';
import es from 'date-fns/locale/es';

registerLocale('es', es);
setDefaultLocale('es');

function DatoTiempo({ label, value, onChange }) {
    const [isOpen, setIsOpen] = useState(false);
    
    const [selectedDate, setSelectedDate] = useState(null);

    const formatDate = (date) => {
        if (!date) return 'Seleccione una fecha';
        const day = date.getDate();
        const month = date.toLocaleString('es-ES', { month: 'long' });
        const year = date.getFullYear();
        return `${day} de ${month} ${year}`;
    };

    const handleChange = (date) => {
        setSelectedDate(date);
        onChange(date ? formatDate(date) : 'Seleccione una fecha');
        setIsOpen(false);
    };

    return (
        <div className={styles.wrapper}>
            <div className={styles.container} onClick={() => setIsOpen(true)}>
                <div className={styles.content}>
                    <span className={styles.label}>{label}</span>
                    <p className={styles.value}>{value}</p>
                </div>
                <i className='bx bx-calendar'></i>
            </div>
            {isOpen && (
                <div className={styles.pickerContainer}>
                    <DatePicker
                        selected={selectedDate}
                        onChange={handleChange}
                        inline
                        locale="es"
                        dateFormat="dd 'de' MMMM yyyy"
                        calendarClassName={styles.calendar}
                        onClickOutside={() => setIsOpen(false)}
                        showPopperArrow={false}
                    />
                </div>
            )}
        </div>
    );
}

export default DatoTiempo;
