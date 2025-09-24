import React, { useState } from 'react';
import styles from './Nav.module.css';
import { BoxIcon } from 'boxicons-react';
import Usuario from '../views/usuario/Usuario';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import SeleccionarSucursal from '../views/sucursales/SeleccionarSucursal';
import Icon from '../../assets/icons/iconBlancoTrans.png';

const Nav = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [isSucursalOpen, setIsSucursalOpen] = useState(false);
    const { sucursalSeleccionada: userSucursal, user, seleccionarSucursal } = useUser();
    const { sucursalSeleccionada: employeeSucursal, employee } = useEmployee();
    
    // Determinar qué datos usar según el tipo de sesión
    const isEmployee = !!employee;
    const sucursalSeleccionada = isEmployee ? employeeSucursal : userSucursal;
    const currentUser = isEmployee ? employee : user;

    const handleOpen = () => {
        setIsOpen(!isOpen);
    }

    const handleSucursalClick = () => {
        // Solo permitir cambio de sucursal para usuarios normales, no empleados
        if (!isEmployee) {
            setIsSucursalOpen(true);
        }
    }

    const handleSucursalSeleccionada = (sucursal) => {
        if (!isEmployee) {
            seleccionarSucursal(sucursal);
        }
        setIsSucursalOpen(false);
    }

    return (
        <div className={styles.navContainer}>
            <div className={styles.navContent}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.navTitle}> <img src={Icon} alt="Icon" className={styles.iconOne} /> Total<span className={styles.navTitleSpan}>Prod</span></h1>
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
            {currentUser && !isEmployee && (
                <SeleccionarSucursal
                    isOpen={isSucursalOpen}
                    setIsOpen={setIsSucursalOpen}
                    empresaId={currentUser.empresa_id}
                    onSucursalSeleccionada={handleSucursalSeleccionada}
                    canClose={true}
                />
            )}
        </div>
    );
};

export default Nav;