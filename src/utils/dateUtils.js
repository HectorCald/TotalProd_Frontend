const DEFAULT_FALLBACK = '--';

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
  if (!value) return DEFAULT_FALLBACK;
  try {
    return getDateFormatter().format(new Date(value));
  } catch (error) {
    return DEFAULT_FALLBACK;
  }
};

export const formatHoraSinSegundos = (value) => {
  if (!value) return DEFAULT_FALLBACK;
  try {
    return getTimeFormatter().format(new Date(value));
  } catch (error) {
    return DEFAULT_FALLBACK;
  }
};

export const formatFechaHoraLiteral = (value) => {
  if (!value) return DEFAULT_FALLBACK;
  try {
    const date = new Date(value);
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

