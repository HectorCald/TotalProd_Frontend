import React, { useEffect, useRef, useState } from 'react';
import styles from './ViewModal.module.css';
import { useModalStack } from '../../context/ModalStackContext';

const ViewModal = ({ isOpen, setIsOpen, children, closed = false }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRenderContent, setShouldRenderContent] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Manejar animación de entrada
    useEffect(() => {
        if (isOpen) {
            setIsVisible(false); // Resetear estado inicial
            setShouldRenderContent(false); // No renderizar contenido aún
            // Usar requestAnimationFrame para sincronizar con el ciclo de render
            const rafId = requestAnimationFrame(() => {
                // Segundo frame para asegurar que el DOM está listo
                requestAnimationFrame(() => {
                    setIsVisible(true);
                    // Renderizar contenido después de iniciar la animación
                    requestAnimationFrame(() => {
                        setShouldRenderContent(true);
                    });
                });
            });
            return () => cancelAnimationFrame(rafId);
        } else {
            setIsVisible(false); // Limpiar estado al cerrar
            setShouldRenderContent(false);
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
                        {shouldRenderContent && children}
                    </div>
                </div>
            )}
        </>
    );
};

export default ViewModal;
