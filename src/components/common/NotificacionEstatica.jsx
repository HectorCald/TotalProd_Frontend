import React from 'react';
import { BoxIcon } from 'boxicons-react';
import styles from './NotificacionEstatica.module.css';

const NotificacionEstatica = ({ 
    titulo, 
    descripcion, 
    icono, 
    tipo = 'info' // 'error', 'info', 'warning', 'success'
}) => {
    const getTipoStyles = () => {
        switch (tipo) {
            case 'error':
                return {
                    background: 'linear-gradient(135deg, #ff0000, #cc0000)',
                    color: 'white',
                    iconColor: '#ffffff'
                };
            case 'warning':
                return {
                    background: 'linear-gradient(135deg, #ff9500, #ff6b00)',
                    color: 'white',
                    iconColor: '#ffffff'
                };
            case 'success':
                return {
                    background: 'linear-gradient(135deg, #00c851, #00a041)',
                    color: 'white',
                    iconColor: '#ffffff'
                };
            case 'info':
            default:
                return {
                    background: 'linear-gradient(135deg, #2196f3, #1976d2)',
                    color: 'white',
                    iconColor: '#ffffff'
                };
        }
    };

    const tipoStyles = getTipoStyles();

    return (
        <div 
            className={`${styles.notificacion} ${styles[tipo]}`}
            style={{
                background: tipoStyles.background,
                color: tipoStyles.color
            }}
        >
            <div className={styles.contenido}>
                {icono && (
                    <BoxIcon 
                        name={icono} 
                        className={styles.icono}
                        style={{ color: tipoStyles.iconColor }}
                    />
                )}
                <div className={styles.texto}>
                    <div className={styles.titulo}>{titulo}</div>
                    {descripcion && (
                        <div className={styles.descripcion}>{descripcion}</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default NotificacionEstatica;
