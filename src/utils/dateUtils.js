/**
 * Obtiene el timestamp completo (fecha y hora exacta local) a partir de una fecha seleccionada.
 * - Si la fecha es hoy, retorna el timestamp exacto actual.
 * - Si es otra fecha manual (ej: 2024-10-15), le agrega la hora exacta actual para evitar 
 *   que se envíe a medianoche (UTC).
 * - Si ya es un ISO string, lo retorna tal cual.
 */
export const getFullTimestamp = (dateString) => {
    if (!dateString) return new Date().toISOString();
  
    const hoy = new Date();
    const strHoy = hoy.getFullYear() + '-' + String(hoy.getMonth() + 1).padStart(2, '0') + '-' + String(hoy.getDate()).padStart(2, '0');
    
    if (dateString === strHoy) {
      // Si seleccionó la fecha de hoy, enviamos el momento exacto
      return hoy.toISOString();
    } else if (typeof dateString === 'string' && dateString.length === 10) {
      // Si seleccionó manualmente un día pasado o futuro, le inyectamos la hora actual local
      const horaActual = String(hoy.getHours()).padStart(2, '0') + ':' + String(hoy.getMinutes()).padStart(2, '0') + ':' + String(hoy.getSeconds()).padStart(2, '0');
      const dLocal = new Date(`${dateString}T${horaActual}`);
      return dLocal.toISOString();
    }
    
    // Si ya es un formato ISO u otro diferente, lo retornamos tal cual
    return dateString;
  };

export const parseDateWithoutOffset = (dateString) => {
    if (!dateString) return null;
    const parts = dateString.split('T')[0].split('-');
    if (parts.length === 3) {
        return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date(dateString);
};

export const formatFechaLiteral = (dateString, includeTime = false) => {
    if (!dateString) return '--';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return '--';
    
    const opciones = { day: 'numeric', month: 'short', year: 'numeric' };
    if (includeTime) {
        opciones.hour = 'numeric';
        opciones.minute = '2-digit';
        opciones.hour12 = true;
    }
    return date.toLocaleDateString('es-ES', opciones);
};

export const formatFechaHoraLiteral = (dateString) => {
    return formatFechaLiteral(dateString, true);
};
