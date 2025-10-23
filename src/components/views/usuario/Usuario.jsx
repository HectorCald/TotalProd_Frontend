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
import NotificacionEstatica from '../../common/NotificacionEstatica';


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
    const { user: userInfo, clearUser, sucursalSeleccionada: userSucursal, isOfflineMode: userOfflineMode, activateOfflineMode: userActivateOffline, deactivateOfflineMode: userDeactivateOffline } = useUser();
    const { employee: employeeInfo, clearEmployee, sucursalSeleccionada: employeeSucursal, isOfflineMode: employeeOfflineMode, activateOfflineMode: employeeActivateOffline, deactivateOfflineMode: employeeDeactivateOffline } = useEmployee();
    const navigate = useNavigate();

    // Determinar si es usuario normal o empleado
    // Primero verificar si hay datos offline para determinar el tipo correcto
    const offlineData = localStorage.getItem('offlineData');
    let isEmployee = !!employeeInfo;
    let currentUser = isEmployee ? employeeInfo : userInfo;
    let sucursal = isEmployee ? employeeSucursal : userSucursal;
    let isOfflineMode = isEmployee ? employeeOfflineMode : userOfflineMode;

    // Si hay datos offline, usar esos datos y el tipo correcto
    if (offlineData) {
        try {
            const parsedOfflineData = JSON.parse(offlineData);
            console.log('📦 DATOS OFFLINE DETECTADOS:', parsedOfflineData);
            console.log('🏷️ TIPO DE USUARIO:', parsedOfflineData.type);
            
            if (parsedOfflineData.type === 'employee') {
                isEmployee = true;
                currentUser = parsedOfflineData.user;
                sucursal = parsedOfflineData.sucursal;
                isOfflineMode = employeeOfflineMode;
                console.log('👤 USUARIO DETECTADO COMO EMPLEADO');
            } else if (parsedOfflineData.type === 'user') {
                isEmployee = false;
                currentUser = parsedOfflineData.user;
                sucursal = parsedOfflineData.sucursal;
                isOfflineMode = userOfflineMode;
                console.log('👤 USUARIO DETECTADO COMO USUARIO NORMAL');
            }
            
            console.log('👤 USUARIO ACTUAL:', currentUser);
            console.log('🏢 SUCURSAL ACTUAL:', sucursal);
        } catch (error) {
            console.error('Error al parsear datos offline:', error);
        }
    }

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

    // Función para cambiar modo offline
    const handleOfflineModeChange = (isOffline) => {
        if (isOffline) {
            console.log('🚫 ACTIVANDO MODO OFFLINE');
            
            // Preparar datos para guardar
            const offlineData = {
                user: currentUser,
                sucursal: sucursal,
                timestamp: new Date().toISOString(),
                type: isEmployee ? 'employee' : 'user'
            };
            
            // Si es empleado, agregar módulos y submódulos
            if (isEmployee && currentUser.modules) {
                offlineData.modules = currentUser.modules;
                offlineData.submodules = currentUser.submodules || [];
            }
            
            // Activar modo offline usando el contexto
            if (isEmployee) {
                employeeActivateOffline(offlineData);
            } else {
                userActivateOffline(offlineData);
            }
            
        } else {
            console.log('✅ DESACTIVANDO MODO OFFLINE');
            
            // Desactivar modo offline usando el contexto
            if (isEmployee) {
                employeeDeactivateOffline();
            } else {
                userDeactivateOffline();
            }
        }
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
            
            {/* Notificación de modo offline */}
            {isOfflineMode && (
                <NotificacionEstatica
                    titulo="MODO OFFLINE ACTIVADO"
                    descripcion="Internet completamente bloqueado"
                    icono="wifi-off"
                    tipo="error"
                />
            )}
            
            <div className={styles.container}>

                {/* Información del usuario usando ItemView */}
                <div className={styles.content} style={{ padding: '10px', gap: '10px' }}>
                    <ItemView
                        title={nombreCompleto}
                        description={isEmployee ? currentUser.codigo || 'Sin código' : currentUser.email || 'Sin email'}
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
                    <ComponenteFull
                        title="Modo Offline"
                        subtitle={isOfflineMode ? "Activado - Funciona sin conexión" : "Desactivado - Requiere conexión"}
                        icon={isOfflineMode ? "wifi-off" : "wifi"}
                        type="switch"
                        checked={isOfflineMode}
                        onChange={handleOfflineModeChange}
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
