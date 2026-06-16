import React, { useState, useEffect } from 'react';
import styles from './Mensaje.module.css';
import { BoxIcon } from 'boxicons-react';

const Mensaje = ({ type = 'info', title, message, duration, onClose }) => {
    const [visible, setVisible] = useState(true);

    useEffect(() => {
        // Reiniciar visibilidad si el mensaje cambia
        setVisible(true);

        if (duration && duration > 0) {
            const timer = setTimeout(() => {
                setVisible(false);
                if (onClose) onClose();
            }, duration);
            return () => clearTimeout(timer);
        }
    }, [duration, onClose, message, title, type]);

    if (!visible) return null;

    const getIcon = () => {
        switch (type) {
            case 'error':
            case 'danger':
                return 'error';
            case 'success':
                return 'check';
            case 'warning':
                return 'error-circle';
            case 'info':
            default:
                return 'info-circle';
        }
    };

    // Asegurar que el tipo mapea a una clase CSS válida
    const tipoClase = type === 'danger' ? 'error' : type;

    return (
        <div className={`${styles.mensaje} ${styles[tipoClase]}`}>
            <BoxIcon name={getIcon()} className={styles.icon} />
            <div className={styles.content}>
                {title && <h4 className={styles.title}>{title}</h4>}
                {message && <p className={styles.text}>{message}</p>}
            </div>
        </div>
    );
};

export default Mensaje;
