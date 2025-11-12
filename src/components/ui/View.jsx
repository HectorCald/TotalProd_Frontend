import React, { useEffect, useRef, useState } from 'react';
import styles from './View.module.css';
import { useModalStack } from '../../context/ModalStackContext';
import { useLayout } from '../../context/LayoutContext';

const View = ({ isOpen, setIsOpen, children, title, onBack, style, isMainView = false, isCart = false }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const { isLargeScreen, sidebarCollapsed } = useLayout();
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

    // Manejar animación de entrada con medición de peso del contenido (solo en pantallas pequeñas)
    useEffect(() => {
        if (isOpen) {
            if (isLargeScreen) {
                // En pantallas grandes, aparecer de golpe sin animación
                setIsVisible(true);
                setShouldRenderContent(true);
            } else {
                // En pantallas pequeñas, mantener la animación con medición de contenido
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
                        // Medir el "peso" del contenido antes de animar
                        if (contentRef.current && containerRef.current) {
                            const contentHeight = contentRef.current.scrollHeight;
                            const elementCount = contentRef.current.querySelectorAll('*').length;
                            
                            // Calcular "pesadez" basado en altura y cantidad de elementos
                            // Altura grande o muchos elementos = contenido pesado
                            const viewportHeight = window.innerHeight;
                            const heightRatio = contentHeight / viewportHeight;
                            const elementDensity = elementCount / Math.max(contentHeight, 1);
                            
                            // Calcular delay basado en la pesadez del contenido
                            // Contenido ligero: delay corto (50ms)
                            // Contenido medio: delay medio (120ms)
                            // Contenido pesado: delay largo (200ms)
                            let delay = 50; // delay base en ms
                            
                            if (heightRatio > 1.5 || elementCount > 200 || elementDensity > 0.5) {
                                delay = 200; // Contenido muy pesado
                            } else if (heightRatio > 1.0 || elementCount > 100 || elementDensity > 0.3) {
                                delay = 120; // Contenido medio-pesado
                            } else {
                                delay = 50; // Contenido ligero
                            }
                            
                            // Iniciar animación
                            setIsVisible(true);
                            setIsMeasuring(false);
                            
                            // Renderizar contenido después de un delay basado en la pesadez
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
            }
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
                    ref={containerRef}
                    className={getViewClasses()}
                    style={style}
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
            )}
        </>
    );
};

export default View;
