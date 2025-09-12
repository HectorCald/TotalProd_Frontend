import styles from './Opcion.module.css';
import { BoxIcon } from 'boxicons-react';

function Opcion({ label, icon, onClick }) {
    return (
        <div className={styles.opcion} onClick={onClick}>
            <BoxIcon name={icon} className={styles.icon} />
            <span className={styles.label}>{label}</span>
        </div>
    );
}
export default Opcion;