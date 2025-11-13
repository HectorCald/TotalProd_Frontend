/**
 * Formatea un número como moneda boliviana
 * Separa miles con punto (.) y decimales con coma (,)
 * @param {number|string} value - Valor numérico a formatear
 * @param {boolean} includePrefix - Si incluir el prefijo "Bs. " (default: true)
 * @returns {string} - Valor formateado (ej: "Bs. 1.234,56")
 */
export const formatCurrency = (value, includePrefix = true) => {
    if (value === null || value === undefined || value === '') {
        return includePrefix ? 'Bs. 0,00' : '0,00';
    }

    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    
    if (isNaN(numValue)) {
        return includePrefix ? 'Bs. 0,00' : '0,00';
    }

    // Separar parte entera y decimal
    const partes = numValue.toFixed(2).split('.');
    const parteEntera = partes[0];
    const parteDecimal = partes[1] || '00';

    // Agregar separadores de miles (puntos)
    const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // Combinar con coma para decimales
    const valorFormateado = `${parteEnteraFormateada},${parteDecimal}`;

    return includePrefix ? `Bs. ${valorFormateado}` : valorFormateado;
};

/**
 * Formatea un número sin el prefijo "Bs. "
 * @param {number|string} value - Valor numérico a formatear
 * @returns {string} - Valor formateado (ej: "1.234,56")
 */
export const formatNumber = (value) => {
    return formatCurrency(value, false);
};

