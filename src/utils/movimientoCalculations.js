import { formatCurrency } from './numberUtils';

/**
 * Calcula y formatea los datos financieros de un movimiento (subtotal, descuentos, aumentos, total)
 * @param {Object} movimiento - Objeto del movimiento con productos, descuento, aumento, porcentaje
 * @returns {Object} - Objeto con todos los datos calculados y formateados:
 *   - subtotal: número
 *   - subtotalFormatted: string formateado
 *   - descuentoMonto: número
 *   - aumentoMonto: número
 *   - total: número
 *   - totalFormatted: string formateado
 *   - descuento: { monto, porcentaje, texto, label, value, tieneDescuento }
 *   - aumento: { monto, porcentaje, texto, label, value, tieneAumento }
 *   - esPorcentaje: boolean
 */
export const calcularResumenFinanciero = (movimiento) => {
    if (!movimiento?.productos || movimiento.productos.length === 0) {
        return {
            subtotal: 0,
            subtotalFormatted: formatCurrency(0),
            descuentoMonto: 0,
            aumentoMonto: 0,
            total: 0,
            totalFormatted: formatCurrency(0),
            descuento: {
                monto: 0,
                porcentaje: 0,
                texto: '',
                label: '',
                value: '',
                tieneDescuento: false
            },
            aumento: {
                monto: 0,
                porcentaje: 0,
                texto: '',
                label: '',
                value: '',
                tieneAumento: false
            },
            esPorcentaje: false
        };
    }

    // Calcular subtotal
    const subtotal = movimiento.productos.reduce((sum, producto) => {
        return sum + (parseFloat(producto.subtotal) || 0);
    }, 0);

    // Obtener descuento y aumento
    const descuentoMonto = parseFloat(movimiento?.descuento) || 0;
    const aumentoMonto = parseFloat(movimiento?.aumento) || 0;
    const esPorcentaje = movimiento?.porcentaje === true;
    const porcentajeEsNull = movimiento?.porcentaje === null;

    // Calcular total
    const total = subtotal - descuentoMonto + aumentoMonto;

    // Calcular y formatear descuento
    let descuentoPorcentaje = 0;
    let descuentoTexto = '';
    let descuentoLabel = '';
    let descuentoValue = '';

    if (descuentoMonto > 0) {
        if (esPorcentaje || porcentajeEsNull) {
            descuentoPorcentaje = subtotal > 0 ? ((descuentoMonto / subtotal) * 100) : 0;
            descuentoTexto = `${descuentoPorcentaje.toFixed(2)}%`;
            descuentoLabel = `Descuento (${descuentoTexto}):`;
            descuentoValue = `-${formatCurrency(descuentoMonto)}`;
        } else {
            descuentoTexto = formatCurrency(descuentoMonto);
            descuentoLabel = 'Descuento:';
            descuentoValue = `-${descuentoTexto}`;
        }
    }

    // Calcular y formatear aumento
    let aumentoPorcentaje = 0;
    let aumentoTexto = '';
    let aumentoLabel = '';
    let aumentoValue = '';

    if (aumentoMonto > 0) {
        if (esPorcentaje || porcentajeEsNull) {
            aumentoPorcentaje = subtotal > 0 ? ((aumentoMonto / subtotal) * 100) : 0;
            aumentoTexto = `${aumentoPorcentaje.toFixed(2)}%`;
            aumentoLabel = `Aumento (${aumentoTexto}):`;
            aumentoValue = `+${formatCurrency(aumentoMonto)}`;
        } else {
            aumentoTexto = formatCurrency(aumentoMonto);
            aumentoLabel = 'Aumento:';
            aumentoValue = `+${aumentoTexto}`;
        }
    }

    return {
        subtotal,
        subtotalFormatted: formatCurrency(subtotal),
        descuentoMonto,
        aumentoMonto,
        total,
        totalFormatted: formatCurrency(total),
        descuento: {
            monto: descuentoMonto,
            porcentaje: descuentoPorcentaje,
            texto: descuentoTexto,
            label: descuentoLabel,
            value: descuentoValue,
            tieneDescuento: descuentoMonto > 0
        },
        aumento: {
            monto: aumentoMonto,
            porcentaje: aumentoPorcentaje,
            texto: aumentoTexto,
            label: aumentoLabel,
            value: aumentoValue,
            tieneAumento: aumentoMonto > 0
        },
        esPorcentaje: esPorcentaje || porcentajeEsNull
    };
};
