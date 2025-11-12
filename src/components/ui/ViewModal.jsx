import React, { useEffect, useRef, useState } from 'react';
import styles from './ViewModal.module.css';
import { useModalStack } from '../../context/ModalStackContext';

const ViewModal = ({ isOpen, setIsOpen, children, closed = false }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);
    const containerRef = useRef(null);
    const contentRef = useRef(null);
    const [isVisible, setIsVisible] = useState(false);
    const [shouldRenderContent, setShouldRenderContent] = useState(false);
    const [isMeasuring, setIsMeasuring] = useState(false);
    const rafIdsRef = useRef([]);
    const timeoutRef = useRef(null);

    const handleClose = () => {
        setIsOpen(false);
    };

    // Manejar animación de entrada con medición de altura
    useEffect(() => {
        if (isOpen) {
            setIsVisible(false); // Resetear estado inicial
            setShouldRenderContent(false); // No renderizar contenido aún
            setIsMeasuring(true); // Empezar a medir
            
            // Limpiar cualquier RAF o timeout pendiente
            rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
            rafIdsRef.current = [];
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
            
            // Usar requestAnimationFrame para sincronizar con el ciclo de render
            const rafId1 = requestAnimationFrame(() => {
                // Segundo frame para asegurar que el DOM está listo
                const rafId2 = requestAnimationFrame(() => {
                    // Medir la altura del contenido antes de animar
                    if (contentRef.current && containerRef.current) {
                        const contentHeight = contentRef.current.scrollHeight;
                        const viewportHeight = window.innerHeight;
                        const heightPercentage = (contentHeight / viewportHeight) * 100;
                        
                        // Calcular delay basado en la altura
                        // Modales pequeños (< 30%): delay corto
                        // Modales medianos (30-60%): delay medio
                        // Modales grandes (> 60%): delay largo
                        let delay = 50; // delay base en ms
                        if (heightPercentage > 60) {
                            delay = 200; // Modales muy grandes
                        } else if (heightPercentage > 30) {
                            delay = 120; // Modales medianos
                        } else {
                            delay = 50; // Modales pequeños
                        }
                        
                        // Iniciar animación
                        setIsVisible(true);
                        setIsMeasuring(false);
                        
                        // Renderizar contenido después de un delay basado en la altura
                        timeoutRef.current = setTimeout(() => {
                            setShouldRenderContent(true);
                        }, delay);
                    } else {
                        // Fallback si no se puede medir
                        setIsVisible(true);
                        setIsMeasuring(false);
                        timeoutRef.current = setTimeout(() => {
                            setShouldRenderContent(true);
                        }, 100);
                    }
                });
                rafIdsRef.current.push(rafId2);
            });
            rafIdsRef.current.push(rafId1);
            
            return () => {
                // Limpiar todos los RAF y timeouts pendientes
                rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
                rafIdsRef.current = [];
                if (timeoutRef.current) {
                    clearTimeout(timeoutRef.current);
                    timeoutRef.current = null;
                }
            };
        } else {
            setIsVisible(false); // Limpiar estado al cerrar
            setShouldRenderContent(false);
            setIsMeasuring(false);
            // Limpiar RAF y timeouts pendientes al cerrar
            rafIdsRef.current.forEach(id => cancelAnimationFrame(id));
            rafIdsRef.current = [];
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
                timeoutRef.current = null;
            }
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
                        ref={containerRef}
                        className={styles.modalContainer}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Contenido - renderizado una vez, oculto durante medición, visible después del delay */}
                        <div 
                            ref={contentRef}
                            className={styles.contentWrapper}
                            style={{ 
                                visibility: isOpen ? 'visible' : 'hidden', // Visible para medir, pero opacity controla la visibilidad real
                                opacity: shouldRenderContent ? 1 : 0,
                                pointerEvents: shouldRenderContent ? 'auto' : 'none'
                            }}
                        >
                            {children}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default ViewModal;
