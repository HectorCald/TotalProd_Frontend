import React, { useEffect, useRef, useState } from 'react';
import styles from './ViewModal.module.css';
import { useModalStack } from '../../context/ModalStackContext';

const ViewModal = ({ isOpen, setIsOpen, children, closed = false }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Manejar animación de entrada
    useEffect(() => {
        if (isOpen) {
            setIsVisible(false); // Resetear estado inicial
            // Pequeño delay para que se vea la animación de entrada
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false); // Limpiar estado al cerrar
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
                <div 
                    className={`${styles.modalWrapper} ${isVisible ? styles.modalWrapperVisible : ''}`}
                    onClick={closed ? undefined : handleClose}
                >
                    {/* Panel Modal */}
                    <div 
                        className={styles.modalContainer}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </div>
                </div>
            )}
        </>
    );
};

export default ViewModal;
