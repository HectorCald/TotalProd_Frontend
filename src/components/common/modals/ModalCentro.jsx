import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalCentro.module.css';
import Boton from '../botones/Boton';


import { BoxIcon } from 'boxicons-react';

const ModalCentro = ({ 
    isOpen, 
    onClose, 
    title, 
    mensaje, 
    detalle, 
    confirmText = 'Confirmar', 
    onConfirm, 
    loading = false, 
    disableClose = false,
    confirmColorClass = 'btn-primary',
    width,
    children,
    confirmDisabled = false,
    hideFooter = false,
    visibleOverflow = false,
    contentStyle = {},
    receipt = false,
    hideCancel = false
}) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className={styles.overlay} onClick={disableClose ? undefined : onClose}>
            <div 
                className={`${styles.modal} ${isOpen ? styles.open : ''} ${receipt ? styles.receiptModal : ''}`} 
                onClick={(e) => e.stopPropagation()}
                style={width ? { width: width, maxWidth: '90vw' } : {}}
            >
                {title ? (
                    <div className={styles.header}>
                        <h2 className={styles.title}>{typeof title === 'string' ? title.toUpperCase() : title}</h2>
                        <div className={styles.closeBtn} onClick={disableClose ? undefined : onClose} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>
                            <BoxIcon name="x" color="#999" />
                        </div>
                    </div>
                ) : (
                    <div className={styles.closeBtnOutside} onClick={disableClose ? undefined : onClose} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>
                        <BoxIcon name="x" color="#999" />
                    </div>
                )}
                
                <div className={styles.content} style={{ ...(visibleOverflow ? { overflow: 'visible' } : {}), ...contentStyle }}>
                    {mensaje && <p className={styles.mensaje}>{mensaje}</p>}
                    {detalle && <p className={styles.detalle}>{detalle}</p>}
                    {children}
                </div>
                
                {!hideFooter && (
                    <div className={styles.footer}>
                        <div className={styles.footerButtons}>
                            {!hideCancel && (
                                <Boton 
                                    label="Cancelar" 
                                    className="btn-cancel" 
                                    onClick={disableClose ? undefined : onClose} 
                                    disabled={disableClose}
                                />
                            )}
                            <Boton 
                                label={confirmText} 
                                className={confirmColorClass} 
                                onClick={onConfirm} 
                                loading={loading}
                                disabled={loading || confirmDisabled}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ModalCentro;
