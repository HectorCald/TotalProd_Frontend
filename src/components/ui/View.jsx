import React, { useEffect, useRef, useState } from 'react';
import styles from './View.module.css';
import { useModalStack } from '../../context/ModalStackContext';
import { useLayout } from '../../context/LayoutContext';

const View = ({ isOpen, setIsOpen, children, title, onBack, style, isMainView = false, isCart = false }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const { isLargeScreen, sidebarCollapsed } = useLayout();
    const modalIdRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Manejar animación de entrada (solo en pantallas pequeñas)
    useEffect(() => {
        if (isOpen) {
            if (isLargeScreen) {
                // En pantallas grandes, aparecer de golpe sin animación
                setIsVisible(true);
            } else {
                // En pantallas pequeñas, mantener la animación
                setIsVisible(false); // Resetear estado inicial
                // Pequeño delay para que se vea la animación de entrada
                const timer = setTimeout(() => {
                    setIsVisible(true);
                }, 10);
                return () => clearTimeout(timer);
            }
        } else {
            setIsVisible(false); // Limpiar estado al cerrar
        }
    }, [isOpen, isLargeScreen]);

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

    // Determinar las clases CSS basadas en el estado global
    const getViewClasses = () => {
        let classes = [styles.viewContainer];
        
        // Solo aplicar animación en pantallas pequeñas
        if (isVisible && !isLargeScreen) {
            classes.push(styles.viewContainerVisible);
        } else if (isLargeScreen) {
            // En pantallas grandes, siempre visible sin animación
            classes.push(styles.viewContainerVisible);
        }
        
        // Aplicar clases específicas para el modo carrito
        if (isCart && isLargeScreen) {
            classes.push(styles.viewContainerCart);
        } else if (isLargeScreen && isMainView) {
            // Solo aplicar padding de sidebar a las views principales (no anidadas)
            // En pantallas grandes, solo las views principales deben tener el padding de la sidebar
            if (sidebarCollapsed) {
                classes.push(styles.viewContainerSidebarCollapsed);
            } else {
                classes.push(styles.viewContainerSidebarExpanded);
            }
        }
        
        return classes.join(' ');
    };

    return (
        <>
            {isOpen && (
                <div 
                    className={getViewClasses()}
                    style={style}
                >
                    {children}
                </div>
            )}
        </>
    );
};

export default View;
