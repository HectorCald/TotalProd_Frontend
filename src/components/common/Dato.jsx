import styles from './Dato.module.css';
import { BoxIcon } from 'boxicons-react';

function Dato({ label, value, icon, onClick, especial }) {
    return (
        <div className={`${styles.dato} ${onClick ? styles.clickable : ''}`} onClick={onClick}>
            {icon && (
                <BoxIcon name={icon} className={styles.icon} />
            )}
            <span className={styles.label}>{label}</span>
            {value && <span className={`${styles.value} ${especial? especial==='green' ? styles.green : especial==='red' ? styles.red:styles.orange:''}`} >{value}</span>}
        </div>
    );
}
export default Dato;