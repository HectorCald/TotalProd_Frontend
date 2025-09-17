import styles from './Dato.module.css';
import { BoxIcon } from 'boxicons-react';

function Dato({ label, value, icon, onClick, especial }) {
    return (
        <div className={`${styles.dato} ${onClick ? styles.clickable : ''}`}>
            
            <div className={styles.content}>
                <span className={styles.label}>{label}</span>
                {value && <span className={`${styles.value} ${especial ? styles[especial] || '' : ''}`} >{value}</span>}
            </div>
            {icon && (
                <button className={styles.iconButton} onClick={onClick}>
                <BoxIcon name={icon} className={styles.icon} />
                </button>
            )}
        </div>
    );
}
export default Dato;