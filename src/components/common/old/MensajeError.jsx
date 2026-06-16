import React, { useEffect, useState } from 'react';
import styles from './MensajeError.module.css';
import { BoxIcon } from 'boxicons-react';

function MensajeError({ mensaje }) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        if (mensaje !== '') {
            setIsVisible(true);
        } else {
            setIsVisible(false);
        }
    }, [mensaje]);

    return (
        <div className={`${styles.info} ${isVisible ? styles.infoVisible : ''}`}>
            <BoxIcon name='info-circle' className={styles.icon} />
            <p className={styles.text}>{mensaje}</p>
        </div>
    );
}
export default MensajeError;