import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './Logo.module.css';

const LogoAnimation = ({ height, showIcon = true, hideIcon = false, short = false }) => {
    return (
        <h1 
            className={styles.logo}
            style={height ? { fontSize: height, lineHeight: height, margin: 0 } : {}}
        >
            {short ? (
                <>
                    <span className={styles.secondary_text}>T</span>
                    <span className={styles.primary_text}>P</span>
                </>
            ) : (
                <>
                    <span className={styles.secondary_text}>Total</span>
                    <span className={styles.primary_text}>Prod</span>
                </>
            )}
            {showIcon && !hideIcon && !short && (
                <span>
                    <BoxIcon name="cart" className={styles.icon} />
                </span>
            )}
        </h1>
    );
};

export default LogoAnimation;
