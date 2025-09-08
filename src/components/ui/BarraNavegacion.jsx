import styles from './BarraNavegacion.module.css';
import { useState } from 'react';
import { BoxIcon } from 'boxicons-react';
import Menu from '../views/menu/Menu';

function BarraNavegacion() {
    const [isOpenMenu, setIsOpenMenu] = useState(false);
    return (
        <div className={styles.barraNavegacion}>
            <div className={styles.opcion}>
                <BoxIcon name='home' className={styles.icon} />
                <p className={styles.title}>Inicio</p>
            </div>
            <div className={styles.opcion}>
                <BoxIcon name='star' className={styles.icon} />
                <p className={styles.title}>Destacados</p>
            </div>
            <div className={styles.opcion}>
                <BoxIcon name='search' className={styles.icon} />
                <p className={styles.title}>Buscar</p>
            </div>
            <div className={styles.opcion}>
                <BoxIcon name='receipt' className={styles.icon} />
                <p className={styles.title}>Reportes</p>
            </div>
            <div className={styles.opcion} onClick={() => setIsOpenMenu(true)}>
                <BoxIcon name='category' className={styles.icon} />
                <p className={styles.title}>Explorar</p>
            </div>
            <Menu isOpen={isOpenMenu} setIsOpen={setIsOpenMenu} />
        </div>
    );
}

export default BarraNavegacion;