import React from 'react';
import { motion } from 'framer-motion';
import { BoxIcon } from 'boxicons-react';
import styles from '../../pages/Login.module.css';

const LogoAnimation = () => {
    return (
        <motion.h1 className={styles.login_logo}>
            <motion.span
                className={styles.login_logo_span}
                initial={{ width: 0, overflow: "hidden" }}
                animate={{ width: "100%" }}
                transition={{ duration: 2, ease: "easeInOut" }}
                style={{ position: "relative" }}
            >
                <motion.span
                    initial={{ x: -50, rotate: 0 }}
                    animate={{
                        x: [0, 225],
                        rotate: [-20, 0]
                    }}
                    transition={{
                        duration: 1.8,
                        delay: 0.3,
                        ease: "easeInOut",
                        times: [0, 0.5, 0.5]
                    }}
                    style={{
                        display: "inline-block",
                        position: "absolute",
                        left: 0,
                        color: "var(--primary-color)",
                    }}
                >
                    <BoxIcon name="cart" className={styles.icon} />
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.4 }}
                    style={{ display: "inline-block" }}
                >
                    T
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 }}
                    style={{ display: "inline-block" }}
                >
                    o
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 0.8 }}
                    style={{ display: "inline-block" }}
                >
                    t
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.0 }}
                    style={{ display: "inline-block"}}
                >
                    a
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.2 }}
                    style={{ display: "inline-block" }}
                >
                    l
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.3 }}
                    style={{ display: "inline-block", color: "var(--primary-color)" }}
                >
                    P
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.4 }}
                    style={{ display: "inline-block", color: "var(--primary-color)" }}
                >
                    r
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.5 }}
                    style={{ display: "inline-block", color: "var(--primary-color)" }}
                >
                    o
                </motion.span>
                <motion.span
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.3, delay: 1.6 }}
                    style={{ display: "inline-block", color: "var(--primary-color)" }}
                >
                    d
                </motion.span>
            </motion.span>
        </motion.h1>
    );
};

export default LogoAnimation;
