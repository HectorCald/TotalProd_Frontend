import React, { useState } from 'react';
import styles from './Usuario.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemLine from '../../common/ItemLine';
import PieIcons from '../../common/PieIcons';
import Version from '../../common/Version';

import VerUsuario from './VerUsuario';
import CambiarContraseña from './CambiarContraseña';
import Apariencia from './Apariencia';
import Extracto from './Extracto';

import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';


const Usuario = ({ isOpen, setIsOpen }) => {
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isOpenVerUsuario, setIsOpenVerUsuario] = useState(false);
    const [isOpenCambiarContraseña, setIsOpenCambiarContraseña] = useState(false);
    const [isOpenApariencia, setIsOpenApariencia] = useState(false);
    const [isOpenExtracto, setIsOpenExtracto] = useState(false);
    const handleClose = () => {
        setIsOpen(false);
    };

    const handlePerfil = () => {
        setIsOpenVerUsuario(true);
    };
    const handleCambiarContraseña = () => {
        setIsOpenCambiarContraseña(true);
    };
    const handleApariencia = () => {
        setIsOpenApariencia(true);
    };
    const handleExtracto = () => {
        setIsOpenExtracto(true);
    };

    const handleLogout = () => {
        setIsLogoutOpen(true);
    };
    const userInfo = JSON.parse(localStorage.getItem('userInfo')) || {};

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.usuarioContent}>
                <h1 className={styles.title}>Perfil</h1>
                <p className={styles.subTitle}>Cuenta</p>
                <div className={styles.opciones}>
                    <ItemLine
                        icon='user'
                        title='Detalles de mi cuenta'
                        onClick={handlePerfil}
                    />
                    <ItemLine
                        icon='lock-open'
                        title='Cambiar contraseña'
                        onClick={handleCambiarContraseña}
                    />
                    <ItemLine
                        icon='palette'
                        title='Apariencia'
                        onClick={handleApariencia}
                    />
                    <ItemLine
                        icon='receipt'
                        title='Extractos de cuenta'
                        onClick={handleExtracto}
                    />
                    <ItemLine
                        icon='power-off'
                        title='Cerrar sesión'
                        onClick={handleLogout}
                    />
                </div>
                <PieIcons />
                <Version />
            </div>
            <VerUsuario isOpen={isOpenVerUsuario} setIsOpen={setIsOpenVerUsuario} usuario={userInfo} />
            <CambiarContraseña isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
            <Apariencia isOpen={isOpenApariencia} setIsOpen={setIsOpenApariencia} />
            <Extracto isOpen={isOpenExtracto} setIsOpen={setIsOpenExtracto} usuario={userInfo} />
            {/* Modal de logout*/}
            <ViewModal isOpen={isLogoutOpen} setIsOpen={setIsLogoutOpen}>
                <HeaderModal
                    title="Cerrar sesión"
                    onClose={() => setIsLogoutOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estas seguro de que deseas cerrar sesion, esta accion borrara toda la informacion del usuario en el dispositivo?</p>
                    <Boton
                        className='btn-red'
                        label='Si, cerrar sesión'
                        style={{ marginTop: 'auto' }}
                        onClick={() => {
                            localStorage.removeItem('authToken');
                            localStorage.removeItem('userId');
                            localStorage.removeItem('userInfo');
                            window.location.reload();
                            setIsLogoutOpen(false);
                        }}
                    />
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsLogoutOpen(false)}
                    />
                </div>
            </ViewModal>
        </View>
    );
};

export default Usuario;
