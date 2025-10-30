import styles from './Dato.module.css';
import { BoxIcon } from 'boxicons-react';

function Dato({ label, value, icon, onClick, especial, vertical=true, containerStyle, iconLoading=false }) {
    return (
        <div className={`${styles.dato} ${onClick ? styles.clickable : ''}`} style={containerStyle}>
            <div className={styles.content} style={{ flexDirection: vertical ? 'column' : 'row', justifyContent: vertical ? 'flex-start' : 'space-between' }}>
                <span className={styles.label}>{label}</span>
                {value && <span className={`${styles.value} ${especial ? styles[especial] || '' : ''}`} >{value}</span>}
            </div>
            {icon && (
                <button className={styles.iconButton} onClick={onClick}>
                <BoxIcon name={icon} className={`${styles.icon} ${iconLoading ? styles.spinning : ''}`} />
                </button>
            )}
        </div>
    );
}
export default Dato;