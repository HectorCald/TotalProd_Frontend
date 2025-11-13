import React, { useState, useRef, useEffect } from 'react';
import styles from './OpcionDesplegable.module.css';
import { BoxIcon } from 'boxicons-react';

function OpcionDesplegable({ titulo, children }) {
    const [isOpen, setIsOpen] = useState(false);
    const [contentHeight, setContentHeight] = useState(0);
    const innerRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        if (innerRef.current) {
            // Medir altura cuando el contenido cambia
            const height = innerRef.current.scrollHeight;
            if (height > 0) {
                setContentHeight(height);
            }
        }
    }, [children]);

    useEffect(() => {
        if (isOpen && innerRef.current) {
            // Cuando se abre, medir la altura después de un pequeño delay
            const timeout = setTimeout(() => {
                if (innerRef.current) {
                    const height = innerRef.current.scrollHeight;
                    if (height > 0) {
                        setContentHeight(height);
                    }
                }
            }, 10);
            return () => clearTimeout(timeout);
        }
    }, [isOpen]);

    useEffect(() => {
        if (isOpen && containerRef.current) {
            // Buscar el contenedor scrollable padre
            let scrollableParent = containerRef.current.parentElement;
            while (scrollableParent && scrollableParent !== document.body) {
                const style = window.getComputedStyle(scrollableParent);
                if (style.overflowY === 'auto' || style.overflowY === 'scroll' || 
                    scrollableParent.classList.toString().includes('productosList')) {
                    break;
                }
                scrollableParent = scrollableParent.parentElement;
            }

            if (scrollableParent && scrollableParent !== document.body) {
                // Calcular posición inicial
                const containerRect = containerRef.current.getBoundingClientRect();
                const parentRect = scrollableParent.getBoundingClientRect();
                const scrollTop = scrollableParent.scrollTop;
                const initialTop = containerRect.top - parentRect.top + scrollTop;
                
                // Calcular altura final del contenido expandido
                const finalHeight = contentHeight || innerRef.current?.scrollHeight || 0;
                const targetScrollTop = initialTop - 20; // 20px de margen
                
                // Animación de scroll sincronizada con la animación de apertura (300ms)
                const animationDuration = 300; // ms - debe coincidir con la duración del CSS
                const startTime = Date.now();
                const startScrollTop = scrollableParent.scrollTop;
                const scrollDistance = targetScrollTop - startScrollTop;
                
                const animateScroll = () => {
                    const elapsed = Date.now() - startTime;
                    const progress = Math.min(elapsed / animationDuration, 1);
                    
                    // Usar easing ease-out para coincidir con la animación CSS
                    const easeOut = 1 - Math.pow(1 - progress, 3);
                    
                    scrollableParent.scrollTop = startScrollTop + (scrollDistance * easeOut);
                    
                    if (progress < 1) {
                        requestAnimationFrame(animateScroll);
                    }
                };
                
                // Iniciar animación después de un pequeño delay para que la animación de altura empiece
                const startTimeout = setTimeout(() => {
                    requestAnimationFrame(animateScroll);
                }, 10);
                
                return () => clearTimeout(startTimeout);
            }
        }
    }, [isOpen, contentHeight]);

    const toggleOpen = () => {
        setIsOpen(!isOpen);
    };

    return (
        <div ref={containerRef} className={styles.container}>
            <button 
                className={styles.header}
                onClick={toggleOpen}
                aria-expanded={isOpen}
            >
                <div className={styles.separator}>
                    <span className={styles.line}></span>
                    <span className={`${styles.title} ${isOpen ? styles.titleOpen : ''}`}>{titulo}</span>
                    <span className={styles.line}></span>
                </div>
                <BoxIcon 
                    name={isOpen ? 'chevron-down' : 'chevron-up'} 
                    className={styles.icon}
                />
            </button>
            <div 
                className={`${styles.content} ${isOpen ? styles.contentOpen : styles.contentClosed}`}
                style={{ maxHeight: isOpen ? `${contentHeight || 1000}px` : '0px' }}
            >
                <div ref={innerRef} className={styles.contentInner}>
                    {children}
                </div>
            </div>
        </div>
    );
}

export default OpcionDesplegable;

