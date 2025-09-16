import React, { useState } from 'react';
import styles from './Nav.module.css';
import { BoxIcon } from 'boxicons-react';
import Usuario from '../views/usuario/Usuario';
import { useUser } from '../../context/UserContext';
import SeleccionarSucursal from '../views/sucursales/SeleccionarSucursal';

const Nav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSucursalOpen, setIsSucursalOpen] = useState(false);
    const { sucursalSeleccionada, user, seleccionarSucursal } = useUser();

    const handleOpen = () => {
        setIsOpen(!isOpen);
    }

    const handleSucursalClick = () => {
        setIsSucursalOpen(true);
    }

    const handleSucursalSeleccionada = (sucursal) => {
        seleccionarSucursal(sucursal);
        setIsSucursalOpen(false);
    }

    return (
        <div className={styles.navContainer}>
            <div className={styles.navContent}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.navTitle}>Total<span className={styles.navTitleSpan}>Prod</span></h1>
                    {sucursalSeleccionada && (
                        <div className={styles.sucursalBadge} onClick={handleSucursalClick}>
                            <span>{sucursalSeleccionada.name}</span>
                            <BoxIcon name='chevron-down' size="10px" />
                        </div>
                    )}
                </div>
                <button className={styles.icon} onClick={handleOpen}>
                    <BoxIcon name='user' />
                </button>
            </div>
            <Usuario isOpen={isOpen} setIsOpen={setIsOpen}/>
            {user && (
                <SeleccionarSucursal
                    isOpen={isSucursalOpen}
                    setIsOpen={setIsSucursalOpen}
                    empresaId={user.empresa_id}
                    onSucursalSeleccionada={handleSucursalSeleccionada}
                    canClose={true}
                />
            )}
        </div>
    );
};

export default Nav;