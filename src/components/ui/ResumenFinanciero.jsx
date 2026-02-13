import React from 'react';
import styles from './ResumenFinanciero.module.css';

/**
 * Componente para mostrar el resumen financiero de movimientos, cotizaciones o pedidos.
 * Soporta filas fijas (subtotal/total) y filas dinámicas (resumen.filas).
 * @param {Object} resumen - Objeto con los datos del resumen financiero
 * @param {string} resumen.subtotalFormatted - Subtotal formateado
 * @param {Array} [resumen.filas] - Filas opcionales entre subtotal y total. Cada item: { label, value, tipo?: 'red'|'green' }
 * @param {Object} [resumen.descuento] - (Compatibilidad) Si no hay filas, se usa descuento/aumento
 * @param {Object} [resumen.aumento]
 * @param {string} resumen.totalFormatted - Total formateado
 */
function ResumenFinanciero({ resumen }) {
    if (!resumen) {
        return null;
    }

    const tieneFilas = Array.isArray(resumen.filas) && resumen.filas.length > 0;

    const getValueClass = (tipo) => {
        if (tipo === 'red') return styles.resumenValueRed;
        if (tipo === 'green') return styles.resumenValueGreen;
        return '';
    };

    return (
        <div className={styles.resumenFinanciero}>
            <div className={styles.resumenRow}>
                <span className={styles.resumenLabel}>Subtotal:</span>
                <span className={styles.resumenValue}>{resumen.subtotalFormatted}</span>
            </div>
            {tieneFilas ? (
                resumen.filas.map((fila, idx) => (
                    <div key={idx} className={styles.resumenRow}>
                        <span className={styles.resumenLabel}>{fila.label}</span>
                        <span className={`${styles.resumenValue} ${getValueClass(fila.tipo)}`}>
                            {fila.value}
                        </span>
                    </div>
                ))
            ) : (
                <>
                    {resumen.descuento?.tieneDescuento && (
                        <div className={styles.resumenRow}>
                            <span className={styles.resumenLabel}>{resumen.descuento.label}</span>
                            <span className={`${styles.resumenValue} ${styles.resumenValueRed}`}>
                                {resumen.descuento.value}
                            </span>
                        </div>
                    )}
                    {resumen.aumento?.tieneAumento && (
                        <div className={styles.resumenRow}>
                            <span className={styles.resumenLabel}>{resumen.aumento.label}</span>
                            <span className={`${styles.resumenValue} ${styles.resumenValueGreen}`}>
                                {resumen.aumento.value}
                            </span>
                        </div>
                    )}
                </>
            )}
            <div className={styles.resumenSeparator}></div>
            <div className={styles.resumenRowTotal}>
                <span className={styles.resumenLabelTotal}>TOTAL GENERAL:</span>
                <span className={styles.resumenValueTotal}>{resumen.totalFormatted}</span>
            </div>
        </div>
    );
}

export default ResumenFinanciero;
