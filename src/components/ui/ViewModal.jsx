import React, { useEffect, useRef, useState } from 'react';
import styles from './ViewModal.module.css';
import { useModalStack } from '../../context/ModalStackContext';

const ViewModal = ({ isOpen, setIsOpen, children }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = () => {
        setIsVisible(false);
        setTimeout(() => {
            setIsOpen(false);
        }, 300); // Tiempo de la animación
    };

    // Manejar animación de entrada
    useEffect(() => {
        if (isOpen) {
            setIsVisible(true);
        }
    }, [isOpen]);

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
                        className={`${styles.overlay} ${isVisible ? styles.overlayVisible : ''}`}
                        onClick={handleClose}
                    />
                    
                    {/* Panel Modal */}
                    <div 
                        className={`${styles.modalContainer} ${isVisible ? styles.modalVisible : ''}`}
                    >
                        {children}
                    </div>
                </>
            )}
        </>
    );
};

export default ViewModal;
