import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalLateral.module.css';
import Boton from '../botones/Boton';
import { BoxIcon } from 'boxicons-react';

const ModalLateral = ({ isOpen, onClose, title, children, confirmText = 'Confirmar', onConfirm, loading = false, disableClose = false, hideFooter = false, confirmDisabled = false, confirmReadOnly = false }) => {
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
            <div className={`${styles.drawer} ${isOpen ? styles.open : ''}`} onClick={(e) => e.stopPropagation()}>
                <div className={styles.header}>
                    <h2 className={styles.title}>{typeof title === 'string' ? title.toUpperCase() : title}</h2>
                    <div className={styles.closeBtn} onClick={disableClose ? undefined : onClose} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>
                        <BoxIcon name="x" color="#999" />
                    </div>
                </div>

                <div className={styles.content} style={hideFooter ? { paddingBottom: '15px' } : {}}>
                    {children}
                </div>

                {!hideFooter && (
                    <div className={styles.footer}>
                        <div className={styles.footerButtons}>
                            <Boton
                                label="Cancelar"
                                className="btn-cancel"
                                onClick={disableClose ? undefined : onClose}
                                disabled={disableClose}
                            />
                            <Boton
                                label={confirmText}
                                className="btn-primary"
                                onClick={onConfirm}
                                loading={loading}
                                disabled={loading || confirmDisabled}
                                readOnly={confirmReadOnly}
                            />
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

export default ModalLateral;
