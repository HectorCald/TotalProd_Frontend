import React, { useEffect, useRef } from 'react';
import styles from './ViewModal.module.css';
import { useModalStack } from '../../context/ModalStackContext';

const ViewModal = ({ isOpen, setIsOpen, children }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Registrar el modal cuando se abre
    useEffect(() => {
        if (isOpen && !modalIdRef.current) {
            const modalId = `modal-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
            modalIdRef.current = modalId;
            registerModal(modalId, handleClose);
        } else if (!isOpen && modalIdRef.current) {
            unregisterModal(modalIdRef.current);
            modalIdRef.current = null;
        }
    }, [isOpen, registerModal, unregisterModal]);

    return (
        <>
            {isOpen && (
                <>
                    {/* Overlay oscuro */}
                    <div
                        className={`${styles.overlay} ${isOpen ? styles.overlayVisible : ''}`}
                        onClick={handleClose}
                    />
                    
                    {/* Panel Modal */}
                    <div 
                        className={`${styles.modalContainer} ${isOpen ? styles.modalVisible : ''}`}
                    >
                        {children}
                    </div>
                </>
            )}
        </>
    );
};

export default ViewModal;
