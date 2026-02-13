import React, { useEffect, useState, useCallback } from 'react';
import styles from './Toast.module.css';
import { BoxIcon } from 'boxicons-react';
import Boton from './Boton';

function Toast({ id, tipo = 'info', titulo, detalle, duracion = 5000, onClose, showErrorActions = true }) {
    const [isVisible, setIsVisible] = useState(false);
    const [isRemoving, setIsRemoving] = useState(false);
    const [isAccepted, setIsAccepted] = useState(false);
    const [isCopied, setIsCopied] = useState(false);

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
    const mostrarBotonesError = esError && showErrorActions;

    const handleClose = useCallback(() => {
        setIsRemoving(true);
        setTimeout(() => {
            if (onClose) {
                onClose(id);
            }
        }, 300);
    }, [id, onClose]);

    const handleAccept = useCallback(() => {
        setIsAccepted(true);
        handleClose();
    }, [handleClose]);

    const handleCopy = useCallback(async (e) => {
        e.stopPropagation();
        const errorText = detalle || titulo || 'Error sin detalles';
        try {
            await navigator.clipboard.writeText(errorText);
            console.log('Error copiado al portapapeles:', errorText);
            setIsCopied(true);
            setTimeout(() => {
                setIsCopied(false);
            }, 1000);
        } catch (err) {
            console.error('Error al copiar al portapapeles:', err);
            console.log('Error que se intentó copiar:', errorText);
        }
    }, [detalle, titulo]);

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsVisible(true);
        }, 10);
        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        // Si es error y tiene botones, no auto-ocultar hasta que se acepte
        if (mostrarBotonesError && !isAccepted) {
            return;
        }
        if (duracion > 0 && onClose) {
            const timer = setTimeout(handleClose, duracion);
            return () => clearTimeout(timer);
        }
    }, [duracion, onClose, handleClose, mostrarBotonesError, isAccepted]);

    return (
        <div
            className={`${styles.toast} ${styles[tipoFinal]} ${isVisible ? styles.visible : ''} ${isRemoving ? styles.removing : ''} ${esError ? styles.toastError : ''}`}
            onClick={!mostrarBotonesError ? handleClose : undefined}
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
                {mostrarBotonesError && (
                    <div className={styles.botonAceptarContainer}>
                        <Boton
                            buttonIcon={isCopied ? "check" : "copy"}
                            className="btn-gray"
                            onClick={handleCopy}
                        />
                        <Boton
                            label="Aceptar"
                            className="btn-gray"
                            onClick={(e) => {
                                e.stopPropagation();
                                handleAccept();
                            }}
                        />
                    </div>
                )}
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
