import React from 'react';
import styles from './StatusBadge.module.css';

function StatusBadge({ estado, pendienteColor = 'red', variant }) {
    // pendienteColor: 'red' (pedidos) | 'orange' (cotizaciones)
    // variant: 'produccion' → pendiente rojo, verificado verde, ingresado azul
    const pendienteEsNaranja = pendienteColor === 'orange';
    const esProduccion = variant === 'produccion';

    const getBadgeConfig = () => {
        if (estado === 'anulado') {
            return {
                text: 'Anulado',
                color: 'var(--error-color)', // rojo
                backgroundColor: '#e74c3c3a'
            };
        }
        if (estado === 'aprobada') {
            return {
                text: 'Aprobada',
                color: 'var(--success-color)', // verde
                backgroundColor: '#28a7453a'
            };
        }
        if (estado === 'completado' || estado === 'Completado') {
            return {
                text: 'Completado',
                color: 'var(--info-color)', // azul
                backgroundColor: '#1f74fe3a'
            };
        }
        if (estado === 'pendiente' || estado === 'Pendiente') {
            return pendienteEsNaranja
                ? { text: 'Pendiente', color: 'var(--warning-color)', backgroundColor: '#ff98003a' }
                : { text: 'Pendiente', color: 'var(--error-color)', backgroundColor: '#e74c3c3a' };
        }
        if (estado === 'Entregado') {
            return {
                text: 'Entregado',
                color: 'var(--warning-color)', // naranja
                backgroundColor: '#ff98003a'
            };
        }
        if (estado === 'Finalizado' || estado === 'finalizado') {
            return {
                text: 'Finalizado',
                color: 'var(--info-color)', // azul
                backgroundColor: '#1f74fe3a'
            };
        }
        if (estado === 'verificado' || estado === 'Verificado') {
            return esProduccion
                ? { text: 'Verificado', color: 'var(--success-color)', backgroundColor: '#28a7453a' }
                : { text: 'Verificado', color: 'var(--info-color)', backgroundColor: '#1f74fe3a' };
        }
        if (estado === 'Ingresado' || estado === 'ingresado') {
            return esProduccion
                ? { text: 'Ingresado', color: 'var(--info-color)', backgroundColor: '#1f74fe3a' }
                : { text: 'Ingresado', color: 'var(--success-color)', backgroundColor: '#28a7453a' };
        }
        if (estado === 'pagado' || estado === 'Pagado') {
            return {
                text: 'Pagado',
                color: 'var(--success-color)', // verde
                backgroundColor: '#28a7453a'
            };
        }
        if (estado === 'activo' || estado === 'Activo' || estado === true) {
            return {
                text: 'Activo',
                color: 'var(--success-color)', // verde
                backgroundColor: '#28a7453a'
            };
        }
        if (estado === 'inactivo' || estado === 'Inactivo' || estado === false) {
            return {
                text: 'Inactivo',
                color: 'var(--error-color)', // rojo
                backgroundColor: '#e74c3c3a'
            };
        }
        // 'pendiente' por defecto (ej. cotizaciones)
        return pendienteEsNaranja
            ? { text: 'Pendiente', color: 'var(--warning-color)', backgroundColor: '#ff98003a' }
            : { text: 'Pendiente', color: 'var(--error-color)', backgroundColor: '#e74c3c3a' };
    };

    const config = getBadgeConfig();

    return (
        <div className={styles.statusBadge}>
            <span 
                className={styles.statusDot}
                style={{ 
                    backgroundColor: config.color,
                    boxShadow: `0 0 0 2px ${config.backgroundColor}`
                }}
            />
            <span className={styles.statusText}>{config.text}</span>
        </div>
    );
}

export default StatusBadge;
