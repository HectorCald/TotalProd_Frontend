import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemLine from '../../common/ItemLine';
import PieIcons from '../../common/PieIcons';
import Version from '../../common/Version';

import VerUsuario from './VerUsuario';
import CambiarContraseña from './CambiarContraseña';
import Apariencia from './Apariencia';
import CodigoPromocional from './CodigoPromocional';

import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import { useUser } from '../../../context/UserContext';
import PlanInfo from './PlanInfo';


const Usuario = ({ isOpen, setIsOpen }) => {
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isOpenVerUsuario, setIsOpenVerUsuario] = useState(false);
    const [isOpenCambiarContraseña, setIsOpenCambiarContraseña] = useState(false);
    const [isOpenApariencia, setIsOpenApariencia] = useState(false);
    const [isOpenPlan, setIsOpenPlan] = useState(false);
    const [isOpenCodigoPromocional, setIsOpenCodigoPromocional] = useState(false);
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
    const handlePlan = () => {
        setIsOpenPlan(true);
    };
    const handleCodigoPromocional = () => {
        setIsOpenCodigoPromocional(true);
    };
    const handleLogout = () => {
        setIsLogoutOpen(true);
    };
    const { user: userInfo, clearUser } = useUser();

    // Si el usuario no está cargado, no renderizar nada
    if (!userInfo) {
        return null;
    }

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} />
            <div className={styles.container}>
                <h1 className={styles.title}>Perfil</h1>
                <p className={styles.subTitle}>Cuenta</p>
                <div className={styles.content}>
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
                        icon='purchase-tag-alt'
                        title='Codigo promocional'
                        onClick={handleCodigoPromocional}
                    />
                    <ItemLine
                        icon='star'
                        title='Plan'
                        onClick={handlePlan}
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
            <VerUsuario isOpen={isOpenVerUsuario} setIsOpen={setIsOpenVerUsuario} />
            <CambiarContraseña isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña}/>
            <Apariencia isOpen={isOpenApariencia} setIsOpen={setIsOpenApariencia} />
            <CodigoPromocional isOpen={isOpenCodigoPromocional} setIsOpen={setIsOpenCodigoPromocional} />
            {/* Modal de logout*/}
            <ViewModal isOpen={isLogoutOpen} setIsOpen={setIsLogoutOpen}>
                <HeaderModal
                    title="Cerrar sesión"
                    onClose={() => setIsLogoutOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estas seguro de que deseas cerrar sesión?, esta accion eliminara toda la información del usuario en el dispositivo.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, Cerrar sesión'
                            style={{ marginTop: 'auto' }}
                            onClick={() => {
                                clearUser();
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
                </div>
            </ViewModal>
            <PlanInfo isOpen={isOpenPlan} setIsOpen={setIsOpenPlan} />
        </View>
    );
};

export default Usuario;
