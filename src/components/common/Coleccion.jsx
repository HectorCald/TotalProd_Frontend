import styles from './Coleccion.module.css';
import { BoxIcon } from 'boxicons-react';

function Coleccion({ title, icon, onClick }) {
    return (
        <div className={styles.coleccionContainer} onClick={onClick}>
            <div className={styles.itemViewIcon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <p className={styles.title}>{title}</p>
        </div>
    );
}

export default Coleccion;