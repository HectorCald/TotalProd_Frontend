import React, { useState, useEffect, useMemo, useRef } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import styles from './DateRangePicker.module.css';

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

const formatDate = (date, options = {}) => {
  if (!date) return '';
  return date.toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    ...options,
  });
};

const formatDateWithMonthName = (date) => {
  if (!date) return '';
  return date.toLocaleDateString('es-BO', {
    timeZone: 'America/La_Paz',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
};

const getRelativeDate = (date) => {
  if (!date) return '';

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dayBeforeYesterday = new Date(today);
  dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);

  const targetDate = new Date(date);
  targetDate.setHours(0, 0, 0, 0);

  if (targetDate.getTime() === today.getTime()) return 'Hoy';
  if (targetDate.getTime() === yesterday.getTime()) return 'Ayer';
  if (targetDate.getTime() === dayBeforeYesterday.getTime()) return 'Anteayer';

  return formatDateWithMonthName(targetDate);
};

export const formatDateRangeForDisplay = (start, end, placeholder = 'Seleccionar rango de fechas') => {
  if (!start && !end) return placeholder;

  if (start && end) {
    if (start.getTime() === end.getTime()) {
      return getRelativeDate(start);
    }
    return `${formatDate(start)} - ${formatDate(end)}`;
  }

  if (start) return getRelativeDate(start);
  if (end) return getRelativeDate(end);

  return placeholder;
};

const DateRangeModal = ({
  isOpen,
  startDate,
  endDate,
  onApply,
  onClose,
  onClear,
  placeholder = 'Seleccionar rango de fechas',
  disableFutureDates = true,
  minDate = null,
}) => {
  const [internalStartDate, setInternalStartDate] = useState(startDate || null);
  const [internalEndDate, setInternalEndDate] = useState(endDate || null);
  const modalRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      setInternalStartDate(startDate || null);
      setInternalEndDate(endDate || null);
    }
  }, [isOpen, startDate, endDate]);

  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }

    return undefined;
  }, [isOpen, onClose]);

  const maxSelectableDate = useMemo(() => {
    if (!disableFutureDates) return null;
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return today;
  }, [disableFutureDates]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={styles.modalWrapper}
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className={styles.datePickerContainer}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.quickActions}>
          <button
            className={styles.quickButton}
            onClick={() => {
              const today = new Date();
              setInternalStartDate(setStartOfDay(today));
              setInternalEndDate(setEndOfDay(today));
              onApply?.(setStartOfDay(today), setEndOfDay(today));
              onClose?.();
            }}
          >
            Hoy
          </button>
          <button
            className={styles.quickButton}
            onClick={() => {
              const today = new Date();
              const startOfWeek = new Date(today);
              const dayOfWeek = today.getDay();
              const daysToSubtract = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
              startOfWeek.setDate(today.getDate() - daysToSubtract);
              const endOfRange = new Date(today);

              const normalizedStart = setStartOfDay(startOfWeek);
              const normalizedEnd = setEndOfDay(endOfRange);

              setInternalStartDate(normalizedStart);
              setInternalEndDate(normalizedEnd);
              onApply?.(normalizedStart, normalizedEnd);
              onClose?.();
            }}
          >
            Esta Semana
          </button>
          <button
            className={styles.quickButton}
            onClick={() => {
              const today = new Date();
              const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
              const endOfRange = new Date(today);

              const normalizedStart = setStartOfDay(startOfMonth);
              const normalizedEnd = setEndOfDay(endOfRange);

              setInternalStartDate(normalizedStart);
              setInternalEndDate(normalizedEnd);
              onApply?.(normalizedStart, normalizedEnd);
              onClose?.();
            }}
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
          startDate={internalStartDate}
          endDate={internalEndDate}
          onChange={(dates) => {
            const [start, end] = dates;
            setInternalStartDate(start);
            setInternalEndDate(end);
          }}
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
          minDate={minDate}
          maxDate={maxSelectableDate}
          onChangeRaw={(e) => e.preventDefault()}
        />

        <div className={styles.actions}>
          {onClear && (
            <button
              className={styles.closeButton}
              onClick={() => {
                onClear();
                onClose?.();
              }}
            >
              Limpiar
            </button>
          )}
          <button
            className={styles.applyButton}
            onClick={() => {
              if (!internalStartDate) return;
              const start = setStartOfDay(internalStartDate);
              const end = setEndOfDay(internalEndDate || internalStartDate);
              onApply?.(start, end);
              onClose?.();
            }}
            disabled={!internalStartDate}
          >
            Aplicar
          </button>
          <button
            className={styles.closeButton}
            onClick={onClose}
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DateRangeModal;

