import React, { useState } from 'react';
import styles from './MenuBoton.module.css';
import { BoxIcon } from 'boxicons-react';
import Menu from '../views/menu/Menu';

function MenuBoton() {
    const [isOpenMenu, setIsOpenMenu] = useState(false);

    const handleMenu = () => {
        setIsOpenMenu(!isOpenMenu);
    };
    return (
        <>
            <div className={styles.menuBotonContainer} onClick={handleMenu}>
                <BoxIcon name='menu' className={styles.icon} />
            </div>
            <Menu isOpen={isOpenMenu} setIsOpen={setIsOpenMenu} />
        </>
    );
}

export default MenuBoton;