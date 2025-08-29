import styles from './ItemTiempo.module.css'
import { BoxIcon } from 'boxicons-react';
function ItemTiempo({hora, icon, titulo, detalle}) {
    return (
        <div className={styles.itemTiempo} >
            <p className={styles.hora}>{hora}</p>
            <div className={styles.itemIcon}>
                <BoxIcon name={icon} className={styles.icon} />
            </div>
            <div className={styles.itemText}>
                <p className={styles.title}>{titulo}</p>
                <p className={styles.descripcion}>{detalle}</p>
            </div>
        </div>
    )
}
export default ItemTiempo;