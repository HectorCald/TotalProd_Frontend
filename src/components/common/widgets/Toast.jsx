import React, { useEffect, useState, useCallback } from 'react';
import styles from './Toast.module.css';
import { BoxIcon } from 'boxicons-react';

function Toast({ id, tipo = 'info', titulo, detalle, duracion = 5000, onClose }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);

    const iconosPorTipo = {
        success: 'check',
        info: 'info-circle',
        danger: 'x',
        warning: 'error-circle'
    };

    const tiposValidos = ['success', 'info', 'danger', 'warning'];
    const tipoFinal = tiposValidos.includes(tipo) ? tipo : 'info';
    const icono = iconosPorTipo[tipoFinal];
    const esError = tipoFinal === 'danger';

    const handleClose = useCallback(() => {
        setIsRemoving(true);
        setTimeout(() => {
            if (onClose) {
                onClose(id);
            }
        }, 300);
    }, [id, onClose]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (duracion > 0 && onClose) {
            const timer = setTimeout(handleClose, duracion);
            return () => clearTimeout(timer);
        }
    }, [duracion, onClose, handleClose]);

    return (
        <div
            className={`${styles.toast} ${styles[tipoFinal]} ${isVisible ? styles.visible : ''} ${isRemoving ? styles.removing : ''} ${esError ? styles.toastError : ''}`}
            onClick={handleClose}
        >
            <div className={styles.iconoContainer}>
                <BoxIcon name={icono} className={styles.icono} />
            </div>
            <div className={styles.contenido}>
                {titulo && (
                    <h4 className={styles.titulo}>
                        <BoxIcon name={icono} className={styles.iconoInline} />
                        <span>{titulo}</span>
                    </h4>
                )}
                {detalle && <p className={styles.detalle}>{detalle}</p>}
            </div>
            <button
                type="button"
                className={styles.botonCerrar}
                onClick={(e) => {
                    e.stopPropagation();
                    handleClose();
                }}
                aria-label="Cerrar"
            >
                <BoxIcon name="x" className={styles.iconoCerrar} />
            </button>
        </div>
    );
}

export default Toast;
