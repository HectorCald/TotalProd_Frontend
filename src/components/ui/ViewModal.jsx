import React, { useEffect, useRef } from 'react';
import styles from './ViewModal.module.css';
import { motion, AnimatePresence } from 'framer-motion';
import { useModalStack } from '../../context/ModalStackContext';

const ViewModal = ({ isOpen, setIsOpen, children }) => {
    const { registerModal, unregisterModal, isLastModal, getOpenModalsCount } = useModalStack();
    const modalIdRef = useRef(null);

    const handleClose = () => {
        setIsOpen(false);
    };

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
                    
                    {/* Panel Modal */}
                    <motion.div 
                        className={styles.modalContainer}
                        initial={{ y: '100%' }}
                        animate={{ y: 0 }}
                        exit={{ y: '100%' }}
                        transition={{
                            type: "tween",
                            ease: "easeOut",
                            duration: 0.3
                        }}
                    >
                        {children}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

export default ViewModal;
