import React, { useState, useRef, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DateRangePicker.module.css';

const DateRangePicker = ({ 
  startDate, 
  endDate, 
  onChange, 
  placeholder = "Seleccionar rango de fechas",
  disabled = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [internalStartDate, setInternalStartDate] = useState(startDate);
  const [internalEndDate, setInternalEndDate] = useState(endDate);
  const datePickerRef = useRef(null);
  const buttonRef = useRef(null);

  // Sincronizar estado interno con props
  useEffect(() => {
    setInternalStartDate(startDate);
    setInternalEndDate(endDate);
  }, [startDate, endDate]);

  // Función para formatear el rango de fechas
  const formatDateRange = (start, end) => {
    if (!start && !end) return placeholder;
    
    const formatDate = (date) => {
      return date.toLocaleDateString('es-BO', { 
        timeZone: 'America/La_Paz',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    };

    const formatDateWithMonthName = (date) => {
      return date.toLocaleDateString('es-BO', { 
        timeZone: 'America/La_Paz',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });
    };

    const getRelativeDate = (date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      
      const dayBeforeYesterday = new Date(today);
      dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
      
      const targetDate = new Date(date);
      targetDate.setHours(0, 0, 0, 0);
      
      if (targetDate.getTime() === today.getTime()) {
        return 'Hoy';
      } else if (targetDate.getTime() === yesterday.getTime()) {
        return 'Ayer';
      } else if (targetDate.getTime() === dayBeforeYesterday.getTime()) {
        return 'Anteayer';
      } else {
        return formatDateWithMonthName(date);
      }
    };

    if (start && end) {
      // Si es el mismo día, mostrar solo la fecha individual
      if (start.getTime() === end.getTime()) {
        return getRelativeDate(start);
      }
      // Si es un rango, mostrar el rango
      return `${formatDate(start)} - ${formatDate(end)}`;
    }
    
    if (start) return getRelativeDate(start);
    if (end) return getRelativeDate(end);
    
    return placeholder;
  };


  // Función para manejar el click del botón
  const handleButtonClick = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  // Función para cerrar el calendario
  const handleClose = () => {
    setIsOpen(false);
  };

  // Función para establecer fecha de hoy
  const handleToday = () => {
    const today = new Date();
    onChange(today, today);
    setIsOpen(false);
  };

  // Función para establecer rango de esta semana
  const handleThisWeek = () => {
    const today = new Date();
    const startOfWeek = new Date(today);
    
    // Calcular el lunes de esta semana
    // today.getDay() devuelve 0=domingo, 1=lunes, ..., 6=sábado
    // Para que la semana empiece en lunes: restar (day - 1) días, pero manejar domingo como caso especial
    const dayOfWeek = today.getDay();
    const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Domingo = 6 días atrás, lunes = 0 días
    startOfWeek.setDate(today.getDate() - daysToSubtract);
    startOfWeek.setHours(0, 0, 0, 0);
    
    // Solo hasta hoy, no incluir días futuros
    const endOfWeek = new Date(today);
    endOfWeek.setHours(23, 59, 59, 999);
    
    onChange(startOfWeek, endOfWeek);
    setIsOpen(false);
  };

  // Función para establecer rango de este mes
  const handleThisMonth = () => {
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    
    // Solo hasta hoy, no incluir días futuros del mes
    const endOfMonth = new Date(today);
    endOfMonth.setHours(23, 59, 59, 999);
    
    onChange(startOfMonth, endOfMonth);
    setIsOpen(false);
  };

  // Cerrar calendario al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        datePickerRef.current && 
        !datePickerRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className={styles.container}>
      <button
        ref={buttonRef}
        className={`${styles.dateButton} ${disabled ? styles.disabled : ''}`}
        onClick={handleButtonClick}
        disabled={disabled}
      >
        <i className="bx bx-calendar" style={{ color: 'var(--primary-color)' }}></i>
        <span className={styles.dateText}>
          {formatDateRange(internalStartDate, internalEndDate)}
        </span>
        <span className={styles.arrowIcon}>
          {isOpen ? '▲' : '▼'}
        </span>
      </button>

      {isOpen && (
        <div 
          className={styles.modalWrapper}
          onClick={handleClose}
        >
          <div 
            ref={datePickerRef} 
            className={styles.datePickerContainer}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.quickActions}>
              <button 
                className={styles.quickButton}
                onClick={handleToday}
              >
                Hoy
              </button>
              <button 
                className={styles.quickButton}
                onClick={handleThisWeek}
              >
                Esta Semana
              </button>
              <button 
                className={styles.quickButton}
                onClick={handleThisMonth}
              >
                Este Mes
              </button>
            </div>
            
            {internalStartDate && !internalEndDate && (
              <div className={styles.selectionHint}>
                <span>Selecciona la fecha de fin o aplica para usar solo esta fecha</span>
              </div>
            )}
            
            <DatePicker
              selected={internalStartDate}
              onChange={(dates) => {
                const [start, end] = dates;
                setInternalStartDate(start);
                setInternalEndDate(end);
              }}
              startDate={internalStartDate}
              endDate={internalEndDate}
              selectsRange
              inline
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              locale="es"
              dateFormat="dd/MM/yyyy"
              className={styles.datePicker}
              isClearable={false}
              shouldCloseOnSelect={false}
              monthsShown={1}
              fixedHeight
              withPortal={false}
              calendarStartDay={1}
              minDate={null}
              maxDate={new Date()} // No permitir fechas futuras
              onChangeRaw={(e) => e.preventDefault()}
            />
            
            <div className={styles.actions}>
              <button 
                className={styles.applyButton}
                onClick={() => {
                  if (internalStartDate) {
                    // Si solo hay fecha de inicio, usar la misma fecha como fin
                    const endDate = internalEndDate || internalStartDate;
                    onChange(internalStartDate, endDate);
                    setIsOpen(false);
                  }
                }}
                disabled={!internalStartDate}
              >
                Aplicar
              </button>
              <button 
                className={styles.closeButton}
                onClick={handleClose}
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DateRangePicker;
