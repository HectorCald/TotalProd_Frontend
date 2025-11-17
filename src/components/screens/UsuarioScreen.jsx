import React, { useState, useEffect } from 'react';
import styles from './Screen.module.css';
import ItemLine from '../common/ItemLine';
import ItemView from '../common/ItemView';
import Version from '../common/Version';
import CambiarContraseña from '../views/usuario/CambiarContraseña';
import CambiarContraseñaEmpleado from '../views/usuario/CambiarContraseñaEmpleado';
import Apariencia from '../views/usuario/Apariencia';
import CodigoPromocional from '../views/usuario/CodigoPromocional';
import ComponenteFull from '../common/ComponenteFull';
import ViewModal from '../ui/ViewModal';
import HeaderModal from '../common/HeaderModal';
import Boton from '../common/Boton';
import { useUser } from '../../context/UserContext';
import { useEmployee } from '../../context/EmployeeContext';
import EmpresaImagenService from '../../services/empresaImagenService';
import PlanInfo from '../views/usuario/PlanInfo';
import Comentarios from '../views/comentarios/Comentarios';
import ImagenEmpresa from '../views/usuario/ImagenEmpresa';
import Notification from '../common/Notification';
import AtajosEmpleado from '../views/usuario/AtajosEmpleado';
import AdministrarCuentasMedio from '../views/usuario/AdministrarCuentasMedio';
import LoginEmpleadoCuentas from '../views/usuario/LoginEmpleadoCuentas';
import LoginEmpresaCuentas from '../views/usuario/LoginEmpresaCuentas';
import productsAlmacenService from '../../services/productsAlmacenService';
import categoryAlmacenService from '../../services/categoryAlmacenService';
import pricesTypesService from '../../services/pricesTypesService';
import clientService from '../../services/clientService';
import UserService from '../../services/userService';
import personalService from '../../services/personalService';
import { guardarLocal, limpiarLocal, OFFLINE_DB_NAME, PRODUCTOS_STORE, CATEGORIAS_STORE, PRECIOS_STORE, CLIENTES_STORE } from '../../utils/indexedDB';
import {
    enableOfflineNetworkInterceptor,
    disableOfflineNetworkInterceptor,
    OFFLINE_NETWORK_FLAG
} from '../../utils/offlineNetworkInterceptor';

const OFFLINE_USER_KEY = 'offline_user_data';
const OFFLINE_EMPLOYEE_KEY = 'offline_employee_data';

const getInitialOfflineMode = () => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
};

const dispatchOfflineModeChange = (enabled) => {
    if (typeof window === 'undefined') return;
    window.dispatchEvent(new CustomEvent('offline-mode-changed', { detail: enabled }));
};

const UsuarioScreen = () => {
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isOpenCambiarContraseña, setIsOpenCambiarContraseña] = useState(false);
    const [isOpenApariencia, setIsOpenApariencia] = useState(false);
    const [isOpenPlan, setIsOpenPlan] = useState(false);
    const [isOpenCodigoPromocional, setIsOpenCodigoPromocional] = useState(false);
    const [isOpenComentarios, setIsOpenComentarios] = useState(false);
    const [isOpenImagenEmpresa, setIsOpenImagenEmpresa] = useState(false);
    const [isOpenAtajo, setIsOpenAtajo] = useState(false);
    const [isOpenAdministrarCuentas, setIsOpenAdministrarCuentas] = useState(false);
    const [isOpenLoginEmpleado, setIsOpenLoginEmpleado] = useState(false);
    const [isOpenLoginEmpresa, setIsOpenLoginEmpresa] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [isOfflineMode, setIsOfflineMode] = useState(getInitialOfflineMode);
    const [isOfflineSyncing, setIsOfflineSyncing] = useState(false);
    const [empresaImage, setEmpresaImage] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });

    const { user: userInfo, clearUser, sucursalSeleccionada: userSucursal } = useUser();
    const { employee: employeeInfo, clearEmployee, sucursalSeleccionada: employeeSucursal } = useEmployee();

    const isEmployee = !!employeeInfo;
    const currentUser = isEmployee ? employeeInfo : userInfo;
    const sucursal = isEmployee ? employeeSucursal : userSucursal;
    const canUseOffline = !isEmployee || !!employeeInfo?.permisos?.offline;
    const areSettingsDisabled = isOfflineMode;

    const applyTheme = (theme) => {
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
    };

    const handleThemeChange = (isDark) => {
        setIsDarkMode(isDark);
        applyTheme(isDark ? 'dark' : 'light');
    };

    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            const isDark = savedTheme === 'dark';
            setIsDarkMode(isDark);
            applyTheme(isDark ? 'dark' : 'light');
        } else {
            setIsDarkMode(true);
            applyTheme('dark');
        }
    }, []);

    // Cargar imagen de empresa al montar o al cambiar de usuario/empleado
    useEffect(() => {
        if (!isEmployee) {
            loadEmpresaImage();
        }
    }, [isEmployee, currentUser?.logo_tipo]);

    useEffect(() => {
        const loadEmpresaImageForEmployee = async () => {
            if (isEmployee && sucursal?.empresas?.id) {
                try {
                    if (sucursal.empresas.logo_tipo) {
                        setEmpresaImage(sucursal.empresas.logo_tipo);
                        return;
                    }
                    const response = await EmpresaImagenService.getImage(sucursal.empresas.id);
                    const imageUrl = response.data?.imagen_url || response.data?.secure_url || response.data?.url || response.data?.image_url;
                    if (response.success && imageUrl) {
                        setEmpresaImage(imageUrl);
                    }
                } catch (error) {
                    console.log('No hay imagen de empresa para empleado:', error);
                }
            }
        };
        loadEmpresaImageForEmployee();
    }, [isEmployee, sucursal?.empresas?.id, sucursal?.empresas?.logo_tipo]);

    const loadEmpresaImage = async () => {
        try {
            setLoadingImage(true);
            if (currentUser?.logo_tipo) {
                setEmpresaImage(currentUser.logo_tipo);
            } else {
                setEmpresaImage(null);
            }
        } catch (error) {
            console.log('No hay imagen de empresa:', error);
            setEmpresaImage(null);
        } finally {
            setLoadingImage(false);
        }
    };

    const mostrarNotificacion = (tipo, texto) => {
        setNotification({ isVisible: true, type: tipo, text: texto });
        setTimeout(() => {
            setNotification((prev) => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const handleOfflineModeChange = async (isEnabled) => {
        if (!isEnabled) {
            setIsOfflineMode(false);
            await Promise.all([
                limpiarLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME),
                limpiarLocal(CATEGORIAS_STORE, OFFLINE_DB_NAME),
                limpiarLocal(PRECIOS_STORE, OFFLINE_DB_NAME),
                limpiarLocal(CLIENTES_STORE, OFFLINE_DB_NAME),
            ]);
            localStorage.removeItem(OFFLINE_USER_KEY);
            localStorage.removeItem(OFFLINE_EMPLOYEE_KEY);
            disableOfflineNetworkInterceptor();
            dispatchOfflineModeChange(false);
            return;
        }

        if (isOfflineSyncing) {
            return;
        }

        setIsOfflineMode(true);
        setIsOfflineSyncing(true);

        try {
            const [
                productosResponse,
                categoriasResponse,
                preciosResponse,
                clientesResponse
            ] = await Promise.all([
                productsAlmacenService.getAll(),
                categoryAlmacenService.getAll(),
                pricesTypesService.getAll(),
                clientService.getAll()
            ]);

            if (!productosResponse?.success || !Array.isArray(productosResponse.data)) {
                throw new Error(productosResponse?.message || 'Respuesta inválida al obtener productos');
            }

            if (!categoriasResponse?.success || !Array.isArray(categoriasResponse.data)) {
                throw new Error(categoriasResponse?.message || 'Respuesta inválida al obtener categorías');
            }

            if (!preciosResponse?.success || !Array.isArray(preciosResponse.data)) {
                throw new Error(preciosResponse?.message || 'Respuesta inválida al obtener tipos de precios');
            }

            if (!clientesResponse?.success || !Array.isArray(clientesResponse.data)) {
                throw new Error(clientesResponse?.message || 'Respuesta inválida al obtener clientes');
            }

            await Promise.all([
                guardarLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME, productosResponse.data),
                guardarLocal(CATEGORIAS_STORE, OFFLINE_DB_NAME, categoriasResponse.data),
                guardarLocal(PRECIOS_STORE, OFFLINE_DB_NAME, preciosResponse.data),
                guardarLocal(CLIENTES_STORE, OFFLINE_DB_NAME, clientesResponse.data),
            ]);

            if (currentUser?.id) {
                if (isEmployee) {
                    const employeeResponse = await personalService.getById(currentUser.id);
                    if (!employeeResponse?.success || !employeeResponse.data) {
                        throw new Error(employeeResponse?.message || 'No se pudo obtener la información del empleado');
                    }
                    localStorage.setItem(OFFLINE_EMPLOYEE_KEY, JSON.stringify(employeeResponse.data));
                    localStorage.removeItem(OFFLINE_USER_KEY);
                } else {
                    const userResponse = await UserService.getCurrentUser(currentUser.id);
                    const userData = userResponse?.data?.user || userResponse?.data;
                    if (!userResponse?.success || !userData) {
                        throw new Error(userResponse?.error || 'No se pudo obtener la información del usuario');
                    }
                    localStorage.setItem(OFFLINE_USER_KEY, JSON.stringify(userData));
                    localStorage.removeItem(OFFLINE_EMPLOYEE_KEY);
                }
            }

            enableOfflineNetworkInterceptor();
            dispatchOfflineModeChange(true);
        } catch (error) {
            console.error('Error activando modo offline:', error);
            setIsOfflineMode(false);
            await Promise.all([
                limpiarLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME),
                limpiarLocal(CATEGORIAS_STORE, OFFLINE_DB_NAME),
                limpiarLocal(PRECIOS_STORE, OFFLINE_DB_NAME),
                limpiarLocal(CLIENTES_STORE, OFFLINE_DB_NAME),
            ]);
            localStorage.removeItem(OFFLINE_USER_KEY);
            localStorage.removeItem(OFFLINE_EMPLOYEE_KEY);
             disableOfflineNetworkInterceptor();
            dispatchOfflineModeChange(false);
            mostrarNotificacion('error', 'No se pudo preparar el modo offline.');
        } finally {
            setIsOfflineSyncing(false);
        }
    };

    if (!currentUser) {
        return null;
    }

    const nombreCompleto = isEmployee ? `${currentUser.first_name} ${currentUser.last_name}` : `${currentUser.firstName} ${currentUser.lastName}` || 'N/A';
    const nombreEmpresa = sucursal?.empresas?.name || 'N/A';
    const displayImage = empresaImage || currentUser?.logo_tipo || sucursal?.empresas?.logo_tipo;

    return (
        <>
            <div style={{ paddingInline: '15px', width: '100%' }}>
                <p className={styles.subTitle} style={{ marginTop: '0' }}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content} style={{ padding: '10px', gap: '10px' }}>
                    <ItemView
                        title={nombreCompleto}
                        description={isEmployee ? (currentUser.cargo || 'Sin cargo') : currentUser.email || 'Sin email'}
                        description2={`${nombreEmpresa}${isEmployee && sucursal ? ` • ${sucursal.name}` : ''}`}
                        flot5={isEmployee ? (currentUser.codigo || 'Sin código') : undefined}
                        circulo={true}
                        transparent={false}
                        style={{ padding: '0px', minHeight: 'auto'}}
                        button={!isEmployee}
                        onButtonClick={!isEmployee ? () => setIsOpenImagenEmpresa(true) : undefined}
                        customIcon={displayImage ? (
                            <div 
                                style={{ 
                                    width: '50px',
                                    height: '50px',
                                    borderRadius: '10px',
                                    backgroundImage: `url(${displayImage})`,
                                    backgroundSize: 'cover',
                                    backgroundPosition: 'center',
                                    backgroundRepeat: 'no-repeat'
                                }}
                            />
                        ) : undefined}
                        icon={displayImage ? undefined : 'building'}
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
                    {canUseOffline && (
                        <ComponenteFull
                            title="Modo offline"
                            subtitle={
                                isOfflineSyncing
                                    ? "Sincronizando productos..."
                                    : isOfflineMode
                                        ? "Activado - Productos disponibles"
                                        : "Desactivado - Sin datos offline"
                            }
                            icon="wifi-off"
                            type="switch"
                            checked={isOfflineMode}
                            onChange={handleOfflineModeChange}
                            loading={isOfflineSyncing}
                        />
                    )}
                </div>
                <p className={styles.subTitle}>CUENTA</p>
                <div className={styles.content}>
                    {/*
                    <ComponenteFull
                        title="Administrar cuentas"
                        subtitle={isEmployee ? "Cambiar a otra cuenta de empleado o empresa" : "Cambiar a otra cuenta de empleado o empresa"}
                        icon="user-circle"
                        type="arrow"
                        onClick={() => setIsOpenAdministrarCuentas(true)}
                        disabled={areSettingsDisabled}
                    />
                    */}
                    <ComponenteFull
                        title="Cambiar contraseña"
                        subtitle="Actualiza tu contraseña de acceso"
                        icon="lock-open"
                        type="arrow"
                        onClick={() => setIsOpenCambiarContraseña(true)}
                        disabled={areSettingsDisabled}
                    />

                    {isEmployee ? (
                        <ComponenteFull
                            title="Atajos de módulos"
                            subtitle="Configura accesos rápidos"
                            icon="category"
                            type="arrow"
                            onClick={() => setIsOpenAtajo(true)}
                            disabled={areSettingsDisabled}
                        />
                    ) : (
                        <>
                            <ComponenteFull
                                title="Código promocional"
                                subtitle="Ingresa un código promocional"
                                icon="purchase-tag-alt"
                                type="arrow"
                                onClick={() => setIsOpenCodigoPromocional(true)}
                                disabled={areSettingsDisabled}
                            />

                            <ComponenteFull
                                title="Plan"
                                subtitle="Información de tu plan actual"
                                icon="star"
                                type="arrow"
                                onClick={() => setIsOpenPlan(true)}
                                disabled={areSettingsDisabled}
                            />
                        </>
                    )}

                    {/*
                    <ComponenteFull
                        title="Comentarios"
                        subtitle="Envía tus comentarios y sugerencias"
                        icon="comment"
                        type="arrow"
                        onClick={() => setIsOpenComentarios(true)}
                    />
                    */}

                    <ItemLine
                        icon='power-off'
                        title='Cerrar sesión'
                        onClick={() => setIsLogoutOpen(true)}
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

            <ViewModal isOpen={isLogoutOpen} setIsOpen={setIsLogoutOpen}>
                <HeaderModal
                    title="Cerrar sesión"
                    onClose={() => setIsLogoutOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle2}>¿Estas seguro de que deseas cerrar sesión?, esta accion eliminara toda la información del usuario en el dispositivo.</p>
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
                                if (isEmployee) {
                                    clearEmployee();
                                } else {
                                    clearUser();
                                }
                                window.location.href = '/login';
                            }}
                        />
                    </div>
                </div>
            </ViewModal>

            {!isEmployee && <PlanInfo isOpen={isOpenPlan} setIsOpen={setIsOpenPlan} />}
            <ImagenEmpresa 
                isOpen={isOpenImagenEmpresa} 
                setIsOpen={setIsOpenImagenEmpresa}
                currentImage={empresaImage}
                onImageChange={(newImage, type, message) => {
                    setEmpresaImage(newImage);
                    loadEmpresaImage();
                    if (type && message) {
                        mostrarNotificacion(type, message);
                    }
                }}
                empresaId={sucursal?.empresas?.id}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {isEmployee && (
                <AtajosEmpleado isOpen={isOpenAtajo} setIsOpen={setIsOpenAtajo} />
            )}

            <AdministrarCuentasMedio
                isOpen={isOpenAdministrarCuentas}
                setIsOpen={setIsOpenAdministrarCuentas}
                onSelectEmpleado={() => setIsOpenLoginEmpleado(true)}
                onSelectEmpresa={() => setIsOpenLoginEmpresa(true)}
            />
            <LoginEmpleadoCuentas
                isOpen={isOpenLoginEmpleado}
                setIsOpen={setIsOpenLoginEmpleado}
                onLoginSuccess={(data) => {
                    // Los datos ya fueron limpiados y el token ya está guardado en LoginEmpleadoCuentas
                    // Solo necesitamos recargar la página para aplicar los cambios
                    window.location.href = '/';
                }}
            />
            <LoginEmpresaCuentas
                isOpen={isOpenLoginEmpresa}
                setIsOpen={setIsOpenLoginEmpresa}
                onLoginSuccess={(data) => {
                    // Los datos ya fueron limpiados y el token ya está guardado en LoginEmpresaCuentas
                    // Solo necesitamos recargar la página para aplicar los cambios
                    window.location.href = '/';
                }}
            />
        </>
    );
};

export default UsuarioScreen;


