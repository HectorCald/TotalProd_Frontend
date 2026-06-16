import React, { useState } from 'react';
import styles from './ListaDesplegable.module.css';
import { BoxIcon } from 'boxicons-react';

import { motion, AnimatePresence } from 'framer-motion';

function ListaDesplegable({ title, icon, children, isOpen, onToggle }) {
    const handleClick = () => {
        onToggle(title);
    };

    return (
        <div className={styles.container}>
            <motion.div
                className={styles.header}
                onClick={handleClick}
                whileTap={{ scale: 0.98 }}
            >
                <div className={styles.titleContainer}>
                    <BoxIcon name={icon} className={styles.icon} />
                    <span className={styles.title}>{title}</span>
                </div>
                <motion.div
                    animate={{ rotate: isOpen ? 180 : 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <BoxIcon name='chevron-down' className={styles.arrow} />
                </motion.div>
            </motion.div>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        className={styles.content}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{
                            height: 'auto',
                            opacity: 1,
                            transition: {
                                height: {
                                    duration: 0.3
                                },
                                opacity: {
                                    duration: 0.25,
                                    delay: 0.1
                                }
                            }
                        }}
                        exit={{
                            height: 0,
                            opacity: 0,
                            transition: {
                                height: {
                                    duration: 0.3
                                },
                                opacity: {
                                    duration: 0.25
                                }
                            }
                        }}
                    >
                        <div className={styles.innerContent}>
                            {children}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

export default ListaDesplegable;
