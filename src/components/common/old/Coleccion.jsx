import styles from './Coleccion.module.css';
import { BoxIcon } from 'boxicons-react';

function Coleccion({ title, icon, onClick, disabled = false }) {
    const handleClick = () => {
        if (disabled) return;
        if (onClick) onClick();
    };

    return (
        <div
            className={`${styles.coleccionContainer} ${disabled ? styles.disabled : ''}`}
            onClick={handleClick}
            aria-disabled={disabled}
        >
            <div className={styles.itemViewIcon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <p className={styles.title}>{title}</p>
        </div>
    );
}

export default Coleccion;