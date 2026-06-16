import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalLateral.module.css';
import Boton from '../botones/Boton';
import { BoxIcon } from 'boxicons-react';

const ModalLateral = ({ isOpen, onClose, title, children, confirmText = 'Confirmar', onConfirm, loading = false, disableClose = false }) => {
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

                <div className={styles.content}>
                    {children}
                </div>

                <div className={styles.footer}>
                    <div className={styles.footerButtons}>
                        <Boton
                            label="Cancel"
                            className="btn-default"
                            style={{ color: '#333', border: '1px solid #ddd' }}
                            onClick={disableClose ? undefined : onClose}
                            disabled={disableClose}
                        />
                        <Boton
                            label={confirmText}
                            className="btn-original"
                            onClick={onConfirm}
                            loading={loading}
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>
        </div>,
        document.body
    );
};

export default ModalLateral;
