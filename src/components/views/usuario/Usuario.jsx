import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemLine from '../../common/ItemLine';
import ItemView from '../../common/ItemView';
import PieIcons from '../../common/PieIcons';
import Version from '../../common/Version';

import CambiarContraseña from './CambiarContraseña';
import CambiarContraseñaEmpleado from './CambiarContraseñaEmpleado';
import Apariencia from './Apariencia';
import CodigoPromocional from './CodigoPromocional';
import ComponenteFull from '../../common/ComponenteFull';

import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import { useUser } from '../../../context/UserContext';
import { useEmployee } from '../../../context/EmployeeContext';
import { useNavigate } from 'react-router-dom';
import PlanInfo from './PlanInfo';
import Comentarios from '../comentarios/Comentarios';


const Usuario = ({ isOpen, setIsOpen }) => {
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isOpenCambiarContraseña, setIsOpenCambiarContraseña] = useState(false);
    const [isOpenApariencia, setIsOpenApariencia] = useState(false);
    const [isOpenPlan, setIsOpenPlan] = useState(false);
    const [isOpenCodigoPromocional, setIsOpenCodigoPromocional] = useState(false);
    const [isOpenComentarios, setIsOpenComentarios] = useState(false);
    const [ejemploChecked, setEjemploChecked] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const handleClose = () => {
        setIsOpen(false);
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
    const handleComentarios = () => {
        setIsOpenComentarios(true);
    };
    const handleLogout = () => {
        setIsLogoutOpen(true);
    };
    const { user: userInfo, clearUser, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, clearEmployee, sucursalSeleccionada: employeeSucursal } = useEmployee();
    const navigate = useNavigate();

    // Determinar si es usuario normal o empleado
    const isEmployee = !!employeeInfo;
    const currentUser = isEmployee ? employeeInfo : userInfo;
    const sucursal = isEmployee ? employeeSucursal : userSucursal;

    // Función para aplicar el tema
    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    // Función para cambiar tema
    const handleThemeChange = (isDark) => {
        setIsDarkMode(isDark);
        applyTheme(isDark ? 'dark' : 'light');
    };

    // Cargar tema guardado al iniciar
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const isDark = savedTheme === 'dark';
            setIsDarkMode(isDark);
            applyTheme(isDark ? 'dark' : 'light');
        } else {
            // Por defecto oscuro
            setIsDarkMode(true);
            applyTheme('dark');
        }
    }, []);

    // Si no hay usuario ni empleado cargado, no renderizar nada
    if (!currentUser) {
        return null;
    }

    // Obtener nombre completo
    const nombreCompleto = isEmployee ?
        `${currentUser.first_name} ${currentUser.last_name}` :
        `${currentUser.firstName} ${currentUser.lastName}` || 'N/A';

    // Obtener nombre de la empresa
    const nombreEmpresa = sucursal?.empresas?.name || 'N/A';

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} >
            <HeaderView onBack={handleClose} title={isEmployee ? 'Perfil de Empleado' : 'Perfil'} />
            <div className={styles.container}>

                {/* Información del usuario usando ItemView */}
                <div className={styles.content} style={{ padding: '10px', gap: '10px' }}>
                    <ItemView
                        title={nombreCompleto}
                        description={isEmployee ? currentUser.email || currentUser.phone || 'Sin contacto' : currentUser.email || 'Sin email'}
                        description2={`${nombreEmpresa}${isEmployee && sucursal ? ` • ${sucursal.name}` : ''}`}
                        circulo={true}
                        transparent={false}
                        style={{ padding: '0px', minHeight: 'auto'}}
                    />
                    <Boton
                        className='btn-default'
                        label={'Editar perfil'}
                        style={{ marginTop: 'auto' }}
                        disabled={false}
                        loading={false}
                    />
                </div>

                <p className={styles.subTitle}>PREFERENCIAS</p>
                <div className={styles.content}>
                    <ComponenteFull
                        title="Modo oscuro"
                        subtitle={isDarkMode ? "Activado - Tema oscuro" : "Desactivado - Tema claro"}
                        icon={isDarkMode ? "moon" : "sun"}
                        type="switch"
                        checked={isDarkMode}
                        onChange={handleThemeChange}
                    />
                </div>
                <p className={styles.subTitle}>CUENTA</p>
                <div className={styles.content}>
                    <ComponenteFull
                        title="Cambiar contraseña"
                        subtitle="Actualiza tu contraseña de acceso"
                        icon="lock-open"
                        type="arrow"
                        onClick={handleCambiarContraseña}
                    />

                    {!isEmployee && (
                        <>
                            <ComponenteFull
                                title="Código promocional"
                                subtitle="Ingresa un código promocional"
                                icon="purchase-tag-alt"
                                type="arrow"
                                onClick={handleCodigoPromocional}
                            />

                            <ComponenteFull
                                title="Plan"
                                subtitle="Información de tu plan actual"
                                icon="star"
                                type="arrow"
                                onClick={handlePlan}
                            />
                        </>
                    )}

                    <ComponenteFull
                        title="Comentarios"
                        subtitle="Envía tus comentarios y sugerencias"
                        icon="comment"
                        type="arrow"
                        onClick={handleComentarios}
                    />

                    <ItemLine
                        icon='power-off'
                        title='Cerrar sesión'
                        onClick={handleLogout}
                    />
                </div>
                <Version />
            </div>
            {isEmployee ? (
                <CambiarContraseñaEmpleado isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
            ) : (
                <CambiarContraseña isOpen={isOpenCambiarContraseña} setIsOpen={setIsOpenCambiarContraseña} />
            )}
            <Apariencia isOpen={isOpenApariencia} setIsOpen={setIsOpenApariencia} />
            <CodigoPromocional isOpen={isOpenCodigoPromocional} setIsOpen={setIsOpenCodigoPromocional} />
            <Comentarios isOpen={isOpenComentarios} setIsOpen={setIsOpenComentarios} />
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
            {!isEmployee && <PlanInfo isOpen={isOpenPlan} setIsOpen={setIsOpenPlan} />}
        </View>
    );
};

export default Usuario;
