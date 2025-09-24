import React, { useEffect, useRef, useState } from 'react';
import styles from './View.module.css';
import { useModalStack } from '../../context/ModalStackContext';

const View = ({ isOpen, setIsOpen, children, title, onBack }) => {
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
            // Pequeño delay para que se vea la animación de entrada
            const timer = setTimeout(() => {
                setIsVisible(true);
            }, 10);
            return () => clearTimeout(timer);
        } else {
            setIsVisible(false);
        }
    }, [isOpen]);

    // Registrar el modal cuando se abre
    useEffect(() => {
        if (isOpen && !modalIdRef.current) {
            const modalId = `view-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
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
                    className={`${styles.viewWrapper} ${isVisible ? styles.viewWrapperVisible : ''}`}
                    onClick={handleClose}
                >
                    {/* Panel principal */}
                    <div 
                        className={styles.viewContainer}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {children}
                    </div>
                </div>
            )}
        </>
    );
};

export default View;
