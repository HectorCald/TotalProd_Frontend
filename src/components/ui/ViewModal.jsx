import React from 'react';
import styles from './ViewModal.module.css';
import { motion, AnimatePresence } from 'framer-motion';

const ViewModal = ({ isOpen, setIsOpen, children }) => {
    const handleClose = () => {
        setIsOpen(false);
    };

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
                            type: "spring",
                            stiffness: 300,
                            damping: 30
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
