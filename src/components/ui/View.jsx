import React, { useEffect, useRef } from 'react';
import styles from './View.module.css';
import { motion, AnimatePresence, PanInfo } from 'framer-motion';
import { useModalStack } from '../../context/ModalStackContext';

const View = ({ isOpen, setIsOpen, children, title, onBack }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);

    const handleClose = () => {
        setIsOpen(false);
    };

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
        <AnimatePresence mode="wait">
            {isOpen && (
                <>
                    {/* Overlay oscuro */}
                    <motion.div
                        className={styles.overlay}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        onClick={handleClose}
                    />
                    
                    {/* Panel principal */}
                    <motion.div 
                        className={styles.viewContainer}
                        initial={{ x: '100%' }}
                        animate={{ 
                            x: 0,
                            scale: [0.95, 1.02, 1]
                        }}
                        exit={{ x: '100%' }}
                        transition={{
                            x: {
                                type: "spring",
                                stiffness: 300,
                                damping: 30,
                                duration: 0.4
                            },
                            scale: {
                                duration: 0.3,
                                times: [0, 0.5, 1]
                            }
                        }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default View;
