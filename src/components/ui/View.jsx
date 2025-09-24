import React, { useEffect, useRef } from 'react';
import styles from './View.module.css';
import { motion, AnimatePresence } from 'framer-motion';
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
                    {/* Panel principal */}
                    <motion.div 
                        className={styles.viewContainer}
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ duration: 0.3 }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default View;
