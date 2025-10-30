import React, { useState } from 'react';
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
    const { sucursalSeleccionada: employeeSucursal, employee, clearEmployee } = useEmployee();
    const { isLargeScreen } = useLayout();

    // Determinar qué datos usar según el tipo de sesión
    const isEmployee = !!employee;
    const sucursalSeleccionada = isEmployee ? employeeSucursal : userSucursal;
    const currentUser = isEmployee ? employee : user;

    // Obtener nombre completo del contexto
    const nombreCompleto = currentUser ? (isEmployee ?
        `${currentUser.first_name} ${currentUser.last_name}` :
        `${currentUser.firstName} ${currentUser.lastName}`) : 'Usuario';

    // Opciones del select de usuario
    const userMenuOptions = [
        { value: 'perfil', label: 'Detalles de mi cuenta', icon: 'user' },
        { value: 'cambiar-contraseña', label: 'Cambiar contraseña', icon: 'lock-open' },
        { value: 'apariencia', label: 'Apariencia', icon: 'palette' },
        ...(isEmployee ? [] : [
            { value: 'codigo-promocional', label: 'Codigo promocional', icon: 'purchase-tag-alt' },
            { value: 'plan', label: 'Plan', icon: 'star' }
        ]),
        { value: 'comentarios', label: 'Comentarios', icon: 'comment' },
        { value: 'logout', label: 'Cerrar sesión', icon: 'power-off' }
    ];

    

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
            case 'comentarios':
                setIsOpenComentarios(true);
                break;
            case 'logout':
                setIsLogoutOpen(true);
                break;
            default:
                break;
        }
    };

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
                    {isLargeScreen ? (
              
                            <Select
                                placeholder={nombreCompleto}
                                options={userMenuOptions}
                                onChange={handleUserMenuSelect}
                                icon="user"
                                activePlaceholder={true}
                                placeholderAsValue={true}
                                containerStyle={{ maxWidth: '300px', maxHeight: '40px' }}
                            />
                       
                    ) : null}
                </div>
                

                {/* Componentes modales del menú de usuario */}
                <VerUsuario isOpen={isOpenVerUsuario} setIsOpen={setIsOpenVerUsuario} />
                {isEmployee ? (
                    <CambiarContraseñaEmpleado isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
                ) : (
                    <CambiarContraseña isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
                )}
                <Apariencia isOpen={isOpenApariencia} setIsOpen={setIsOpenApariencia} />
                <CodigoPromocional isOpen={isOpenCodigoPromocional} setIsOpen={setIsOpenCodigoPromocional} />
                <Comentarios isOpen={isOpenComentarios} setIsOpen={setIsOpenComentarios} />
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
            {currentUser && !isEmployee && (
                <SeleccionarSucursal
                    isOpen={isSucursalOpen}
                    setIsOpen={setIsSucursalOpen}
                    empresaId={currentUser.empresa_id}
                    onSucursalSeleccionada={handleSucursalSeleccionada}
                    canClose={true}
                />
            )}
        </>
    );
};

export default Nav;