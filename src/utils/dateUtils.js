const DEFAULT_FALLBACK = '--';

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const s = value.trim();
    // Solo fecha sin hora (exactamente YYYY-MM-DD): usar día como fecha local a medianoche
    const dateOnlyMatch = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dateOnlyMatch) {
      const [, year, month, day] = dateOnlyMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
    // Fecha con hora (ej. 2026-02-13 16:18:55.9+00 o ISO): normalizar a ISO para respetar hora y zona
    if (/^\d{4}-\d{2}-\d{2}[\sT]/.test(s)) {
      const iso = s
        .replace(/^(\d{4}-\d{2}-\d{2})\s+/, '$1T')
        .replace(/([+-])(\d{2})$/, '$1$2:00');
      const date = new Date(iso);
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateFormatter = (abreviarMes = false) =>
  new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: abreviarMes ? 'short' : 'long',
    year: 'numeric'
  });

const buildTimeFormatter = () =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

let dateFormatter;
let dateFormatterAbreviado;
let timeFormatter;

const getDateFormatter = (abreviarMes = false) => {
  if (abreviarMes) {
    if (!dateFormatterAbreviado) {
      dateFormatterAbreviado = buildDateFormatter(true);
    }
    return dateFormatterAbreviado;
  } else {
    if (!dateFormatter) {
      dateFormatter = buildDateFormatter(false);
    }
    return dateFormatter;
  }
};

const getTimeFormatter = () => {
  if (!timeFormatter) {
    timeFormatter = buildTimeFormatter();
  }
  return timeFormatter;
};

export const formatFechaLiteral = (value, abreviarMes = false) => {
  const date = parseDateValue(value);
  if (!date) return DEFAULT_FALLBACK;
  try {
    return getDateFormatter(abreviarMes).format(date);
  } catch (error) {
    return DEFAULT_FALLBACK;
  }
};

export const formatHoraSinSegundos = (value) => {
  const date = parseDateValue(value);
  if (!date) return DEFAULT_FALLBACK;
  try {
    return getTimeFormatter().format(date);
  } catch (error) {
    return DEFAULT_FALLBACK;
  }
};

export const formatFechaHoraLiteral = (value) => {
  const date = parseDateValue(value);
  if (!date) return DEFAULT_FALLBACK;
  try {
    const fecha = getDateFormatter().format(date);
    const hora = getTimeFormatter().format(date);
    if (!fecha && !hora) {
      return DEFAULT_FALLBACK;
    }
    if (!fecha) {
      return hora;
    }
    if (!hora) {
      return fecha;
    }
    return `${fecha} ${hora}`;
  } catch (error) {
    return DEFAULT_FALLBACK;
  }
};

export const parseDateWithoutOffset = parseDateValue;

