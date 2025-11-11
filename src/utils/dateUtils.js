const DEFAULT_FALLBACK = '--';

const parseDateValue = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  if (typeof value === 'string') {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) {
      const [, year, month, day] = match;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return Number.isNaN(date.getTime()) ? null : date;
    }
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const buildDateFormatter = () =>
  new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

const buildTimeFormatter = () =>
  new Intl.DateTimeFormat('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });

let dateFormatter;
let timeFormatter;

const getDateFormatter = () => {
  if (!dateFormatter) {
    dateFormatter = buildDateFormatter();
  }
  return dateFormatter;
};

const getTimeFormatter = () => {
  if (!timeFormatter) {
    timeFormatter = buildTimeFormatter();
  }
  return timeFormatter;
};

export const formatFechaLiteral = (value) => {
  const date = parseDateValue(value);
  if (!date) return DEFAULT_FALLBACK;
  try {
    return getDateFormatter().format(date);
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

