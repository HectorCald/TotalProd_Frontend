import React, { useMemo, useEffect, useState } from 'react';
import InputSelect from './InputSelect';
import styles from './InputFecha.module.css';

function parseDate(value, mode) {
  if (!value || typeof value !== 'string') {
    return { year: '', month: '', day: '' };
  }
  const parts = value.trim().split('-');
  if (mode === 'month') {
    const [y, m] = parts;
    return { year: y || '', month: m || '', day: '' };
  }
  const [y, m, d] = parts;
  return { year: y || '', month: m || '', day: d || '' };
}

function formatDate(parts, mode) {
  const pad2 = (n) => (n === '' || n == null ? '' : String(n).padStart(2, '0'));
  const { year, month, day } = parts;
  if (mode === 'month') {
    if (!year || !month) return '';
    return `${year}-${pad2(month)}`;
  }
  if (!year || !month || !day) return '';
  return `${year}-${pad2(month)}-${pad2(day)}`;
}

function getDaysInMonth(year, month) {
  const y = parseInt(year, 10);
  const m = parseInt(month, 10);
  if (isNaN(y) || isNaN(m) || m < 1 || m > 12) return 31;
  return new Date(y, m, 0).getDate();
}

function clamp(value, min, max) {
  if (value < min) return min;
  if (value > max) return max;
  return value;
}

const MESES = [
  { value: '01', label: 'Enero' }, { value: '02', label: 'Febrero' }, { value: '03', label: 'Marzo' },
  { value: '04', label: 'Abril' }, { value: '05', label: 'Mayo' }, { value: '06', label: 'Junio' },
  { value: '07', label: 'Julio' }, { value: '08', label: 'Agosto' }, { value: '09', label: 'Septiembre' },
  { value: '10', label: 'Octubre' }, { value: '11', label: 'Noviembre' }, { value: '12', label: 'Diciembre' }
];

const InputFecha = ({
  label,
  value,
  onChange,
  required,
  error,
  onClearError,
  readOnly,
  minDate,
  maxDate,
  yearDirection = 'future',
  mode = 'date', // 'date' | 'month' - mes y año solo
  openDirection = 'down' // 'down' | 'up' - para InputSelects internos
}) => {
  const parsed = useMemo(() => parseDate(value, mode), [value, mode]);
  const [parts, setParts] = useState(parsed);

  useEffect(() => {
    setParts(parsed);
  }, [parsed]);

  const years = useMemo(() => {
    const now = new Date();
    const current = now.getFullYear();
    const start = yearDirection === 'past' ? current - 10 : current;
    const end = yearDirection === 'past' ? current : current + 10;
    const list = [];
    for (let y = start; y <= end; y++) list.push({ value: String(y), label: String(y) });
    return list;
  }, [yearDirection]);

  const daysCount = useMemo(() => getDaysInMonth(parts.year, parts.month), [parts.year, parts.month]);
  const days = useMemo(() => {
    const list = [];
    for (let i = 1; i <= daysCount; i++) {
      const v = String(i).padStart(2, '0');
      list.push({ value: v, label: v });
    }
    return list;
  }, [daysCount]);

  const months = useMemo(() => MESES, []);

  const emit = (nextParts) => {
    const next = formatDate(nextParts, mode);
    if (next) {
      onChange?.(next);
      onClearError?.();
    }
  };

  const isMonthOnly = mode === 'month';

  const handleDay = (val) => {
    const next = { ...parts, day: val || '' };
    setParts(next);
    if (next.year && next.month && next.day) emit(next);
  };

  const handleMonth = (val) => {
    const monthVal = val ? String(val).padStart(2, '0') : '';
    const next = { ...parts, month: monthVal };
    if (!isMonthOnly && next.year && next.month && next.day) {
      const maxD = getDaysInMonth(next.year, next.month);
      next.day = String(clamp(parseInt(parts.day, 10) || 1, 1, maxD)).padStart(2, '0');
    }
    setParts(next);
    if (isMonthOnly && next.year && next.month) emit(next);
    else if (next.year && next.month && next.day) emit(next);
  };

  const handleYear = (val) => {
    const next = { ...parts, year: val || '' };
    if (!isMonthOnly && next.year && next.month && next.day) {
      const maxD = getDaysInMonth(next.year, next.month);
      next.day = String(clamp(parseInt(parts.day, 10) || 1, 1, maxD)).padStart(2, '0');
    }
    setParts(next);
    if (isMonthOnly && next.year && next.month) emit(next);
    else if (next.year && next.month && next.day) emit(next);
  };

  return (
    <div className={styles.root}>
      {label && (
        <label className={`${styles.label} ${error ? styles.labelError : ''}`}>
          {label}
          {required && <span className={styles.required}> *</span>}
        </label>
      )}
      <div className={`${styles.inputWrap} ${readOnly ? styles.inputWrapReadOnly : ''}`}>
        <div
          className={`${styles.input} ${styles.dateRow} ${readOnly ? styles.dateRowReadOnly : ''}`}
        >
          {!isMonthOnly && (
            <InputSelect
              placeholder="Día"
              value={parts.day}
              onChange={handleDay}
              options={days}
              disabled={readOnly}
              readOnly={readOnly}
              openDirection={openDirection}
              error={error}
            />
          )}
          <InputSelect
            placeholder="Mes"
            value={parts.month}
            onChange={handleMonth}
            options={months}
            disabled={readOnly}
            readOnly={readOnly}
            openDirection={openDirection}
            error={error}
          />
          <InputSelect
            placeholder="Año"
            value={parts.year}
            onChange={handleYear}
            options={years}
            disabled={readOnly}
            readOnly={readOnly}
            openDirection={openDirection}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default InputFecha;
