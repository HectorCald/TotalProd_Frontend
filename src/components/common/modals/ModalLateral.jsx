import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from './ModalLateral.module.css';
import Boton from '../botones/Boton';
import { BoxIcon } from 'boxicons-react';
import { useModalStack } from '../../../context/ModalStackContext';
import { useLayout } from '../../../context/LayoutContext';

const ModalLateral = ({ isOpen, onClose, title, children, confirmText = 'Confirmar', onConfirm, loading = false, disableClose = false, hideFooter = false, confirmDisabled = false, confirmReadOnly = false }) => {
    const { isLargeScreen } = useLayout();
    const { registerModal, unregisterModal } = useModalStack();
    const modalIdRef = useRef(null);

    // Registrar el modal cuando se abre
    useEffect(() => {
        if (isOpen && !modalIdRef.current) {
            const modalId = `modal-lateral-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            modalIdRef.current = modalId;
            registerModal(modalId, onClose);
        } else if (!isOpen && modalIdRef.current) {
            unregisterModal(modalIdRef.current);
            modalIdRef.current = null;
        }
    }, [isOpen, registerModal, unregisterModal, onClose]);

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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {!isLargeScreen && (
                            <div onClick={disableClose ? undefined : onClose} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer', display: 'flex', alignItems: 'center' }}>
                                <i className='bx bx-left-arrow-alt' style={{ fontSize: '28px', color: '#666' }}></i>
                            </div>
                        )}
                        <h2 className={styles.title}>{typeof title === 'string' ? title.toUpperCase() : title}</h2>
                    </div>
                    {isLargeScreen && (
                        <div className={styles.closeBtn} onClick={disableClose ? undefined : onClose} style={{ opacity: disableClose ? 0.5 : 1, cursor: disableClose ? 'not-allowed' : 'pointer' }}>
                            <BoxIcon name="x" color="#999" />
                        </div>
                    )}
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
