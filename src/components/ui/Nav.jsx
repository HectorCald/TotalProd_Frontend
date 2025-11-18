import React, { useState, useEffect, useCallback } from 'react';
import styles from './Nav.module.css';
import { BoxIcon } from 'boxicons-react';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import { useLayout } from '../../context/LayoutContext';
import SeleccionarSucursal from '../views/sucursales/SeleccionarSucursal';
import Icon from '../../assets/icons/iconBlancoTrans.png';
import Select from '../common/Select';
import VerUsuario from '../views/usuario/VerUsuario';
import CambiarContraseña from '../views/usuario/CambiarContraseña';
import CambiarContraseñaEmpleado from '../views/usuario/CambiarContraseñaEmpleado';
import Apariencia from '../views/usuario/Apariencia';
import CodigoPromocional from '../views/usuario/CodigoPromocional';
import PlanInfo from '../views/usuario/PlanInfo';
import Comentarios from '../views/comentarios/Comentarios';
import ViewModal from './ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import StatusBadge from '../common/StatusBadge';
import { OFFLINE_NETWORK_FLAG } from '../../utils/offlineNetworkInterceptor';

const Nav = () => {

    const [isSucursalOpen, setIsSucursalOpen] = useState(false);
    const [isOpenVerUsuario, setIsOpenVerUsuario] = useState(false);
    const [isOpenCambiarContraseña, setIsOpenCambiarContraseña] = useState(false);
    const [isOpenApariencia, setIsOpenApariencia] = useState(false);
    const [isOpenPlan, setIsOpenPlan] = useState(false);
    const [isOpenCodigoPromocional, setIsOpenCodigoPromocional] = useState(false);
    const [isOpenComentarios, setIsOpenComentarios] = useState(false);
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const { sucursalSeleccionada: userSucursal, user, seleccionarSucursal, clearUser } = useUser();
    const { sucursalSeleccionada: employeeSucursal, employee, clearEmployee, seleccionarSucursal: seleccionarSucursalEmpleado } = useEmployee();
    const { isLargeScreen } = useLayout();
    const [isOfflineMode, setIsOfflineMode] = useState(false);

    // Determinar qué datos usar según el tipo de sesión
    const isEmployee = !!employee;
    const sucursalSeleccionada = isEmployee ? employeeSucursal : userSucursal;
    const currentUser = isEmployee ? employee : user;
    const canAdministrarSucursales = isEmployee ? (employee?.permisos?.sucursales === true) : true;

    // Obtener nombre completo del contexto
    const nombreCompleto = currentUser ? (isEmployee ?
        `${currentUser.first_name} ${currentUser.last_name}` :
        `${currentUser.firstName} ${currentUser.lastName}`) : 'Usuario';

    // Obtener el label del select según el tipo de usuario
    const selectLabel = isEmployee
        ? (currentUser?.cargo || 'Empleado')
        : 'Administrador';

    // Opciones del select de usuario
    const userMenuOptions = [
        { value: 'perfil', label: 'Detalles de mi cuenta', icon: 'user' },
        { value: 'cambiar-contraseña', label: 'Cambiar contraseña', icon: 'lock-open' },
        { value: 'apariencia', label: 'Apariencia', icon: 'palette' },
        ...(isEmployee ? [] : [
            { value: 'codigo-promocional', label: 'Codigo promocional', icon: 'purchase-tag-alt' },
            { value: 'plan', label: 'Plan', icon: 'star' }
        ]),
        // { value: 'comentarios', label: 'Comentarios', icon: 'comment' },
        { value: 'logout', label: 'Cerrar sesión', icon: 'power-off' }
    ];



    const handleSucursalClick = () => {
        if (!isEmployee || canAdministrarSucursales) {
            setIsSucursalOpen(true);
        }
    }

    const handleSeleccionarSucursal = (sucursal) => {
        if (isEmployee) {
            if (!canAdministrarSucursales) {
                return;
            }
            seleccionarSucursalEmpleado(sucursal);
        } else {
            seleccionarSucursal(sucursal);
        }
        setIsSucursalOpen(false);
    }

    // Funciones para el menú de usuario
    const handleUserMenuSelect = (option) => {
        switch (option) {
            case 'perfil':
                setIsOpenVerUsuario(true);
                break;
            case 'cambiar-contraseña':
                setIsOpenCambiarContraseña(true);
                break;
            case 'apariencia':
                setIsOpenApariencia(true);
                break;
            case 'plan':
                setIsOpenPlan(true);
                break;
            case 'codigo-promocional':
                setIsOpenCodigoPromocional(true);
                break;
            // case 'comentarios':
            //     setIsOpenComentarios(true);
            //     break;
            case 'logout':
                setIsLogoutOpen(true);
                break;
            default:
                break;
        }
    };

    const updateOfflineFlag = useCallback(() => {
        try {
            setIsOfflineMode(localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true');
        } catch {
            setIsOfflineMode(false);
        }
    }, []);

    useEffect(() => {
        updateOfflineFlag();
        const handler = () => updateOfflineFlag();
        window.addEventListener('offline-mode-changed', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('offline-mode-changed', handler);
            window.removeEventListener('storage', handler);
        };
    }, [updateOfflineFlag]);

    return (
        <>
            <div className={styles.navContainer}>
                <div className={styles.navContent}>
                    <div className={styles.titleContainer}>
                        <h1 className={styles.navTitle}>Total<span className={styles.navTitleSpan}>Prod</span></h1>
                        {sucursalSeleccionada && (
                            <div className={styles.sucursalBadge} onClick={handleSucursalClick}>
                                <span>{sucursalSeleccionada.name}</span>
                            </div>
                        )}
                    </div>
                    {isLargeScreen && currentUser ? (
                        <div className={styles.userSelectContainer}>
                            <Select
                                label={selectLabel}
                                placeholder={nombreCompleto}
                                options={userMenuOptions}
                                onChange={handleUserMenuSelect}
                                icon="user"
                                activePlaceholder={true}
                                placeholderAsValue={true}
                                containerStyle={{ maxWidth: '300px', maxHeight: '40px' }}
                            />
                        </div>
                    ) : null}
                </div>
                {isOfflineMode && (

                    <StatusBadge
                        type="error"
                        label="Modo offline"
                        detail="El modo offline bloquea todas las conexiones para usar los datos guardados. Desactívalo desde Preferencias si deseas volver a sincronizar. Ten en cuenta que, en este modo, solo está disponible el módulo de ventas de productos de almacén."
                    />

                )}


                {/* Componentes modales del menú de usuario */}
                <VerUsuario isOpen={isOpenVerUsuario} setIsOpen={setIsOpenVerUsuario} />
                {isEmployee ? (
                    <CambiarContraseñaEmpleado isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
                ) : (
                    <CambiarContraseña isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
                )}
                <Apariencia isOpen={isOpenApariencia} setIsOpen={setIsOpenApariencia} />
                <CodigoPromocional isOpen={isOpenCodigoPromocional} setIsOpen={setIsOpenCodigoPromocional} />
                {/* <Comentarios isOpen={isOpenComentarios} setIsOpen={setIsOpenComentarios} /> */}
                {!isEmployee && <PlanInfo isOpen={isOpenPlan} setIsOpen={setIsOpenPlan} />}

                {/* Modal de logout */}
                <ViewModal isOpen={isLogoutOpen} setIsOpen={setIsLogoutOpen}>
                    <HeaderModal
                        title="Cerrar sesión"
                        onClose={() => setIsLogoutOpen(false)}
                    />
                    <div className={styles.modalContent}>
                        <p className={styles.subTitle}>¿Estas seguro de que deseas cerrar sesión?, esta accion eliminara toda la información del usuario en el dispositivo.</p>
                        <div className={styles.buttons}>
                            <Boton
                                className='btn-default'
                                label='Cancelar'
                                style={{ marginTop: 'auto' }}
                                onClick={() => setIsLogoutOpen(false)}
                            />
                            <Boton
                                className='btn-red'
                                label='Si, Cerrar sesión'
                                style={{ marginTop: 'auto' }}
                                onClick={() => {
                                    // Limpiar context inmediatamente
                                    if (isEmployee) {
                                        clearEmployee();
                                    } else {
                                        clearUser();
                                    }

                                    // Redireccionar inmediatamente sin delay
                                    window.location.href = '/login';
                                }}
                            />
                        </div>
                    </div>
                </ViewModal>
            </div>
            {currentUser && (!isEmployee || canAdministrarSucursales) && (
                <SeleccionarSucursal
                    isOpen={isSucursalOpen}
                    setIsOpen={setIsSucursalOpen}
                    empresaId={isEmployee ? (currentUser?.empresa_id || currentUser?.sucursal?.empresas?.id) : currentUser.empresa_id}
                    onSucursalSeleccionada={handleSeleccionarSucursal}
                    canClose={!!sucursalSeleccionada}
                />
            )}
        </>
    );
};

export default Nav;