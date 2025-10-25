import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemLine from '../../common/ItemLine';
import ItemView from '../../common/ItemView';
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
import ImagenEmpresa from './ImagenEmpresa';
import Notification from '../../common/Notification';

const Usuario = ({ isOpen, setIsOpen }) => {
    const [isLogoutOpen, setIsLogoutOpen] = useState(false);
    const [isOpenCambiarContraseña, setIsOpenCambiarContraseña] = useState(false);
    const [isOpenApariencia, setIsOpenApariencia] = useState(false);
    const [isOpenPlan, setIsOpenPlan] = useState(false);
    const [isOpenCodigoPromocional, setIsOpenCodigoPromocional] = useState(false);
    const [isOpenComentarios, setIsOpenComentarios] = useState(false);
    const [isOpenImagenEmpresa, setIsOpenImagenEmpresa] = useState(false);
    const [isDarkMode, setIsDarkMode] = useState(true);
    const [empresaImage, setEmpresaImage] = useState(null);
    const [loadingImage, setLoadingImage] = useState(false);
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });
    
    const handleClose = () => {
        setIsOpen(false);
    };

    const handleCambiarContraseña = () => {
        setIsOpenCambiarContraseña(true);
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
    
    const handleImagenEmpresa = () => {
        setIsOpenImagenEmpresa(true);
    };
    
    const handleImageChange = (newImage, type, message) => {
        setEmpresaImage(newImage);
        // Recargar la imagen del servidor para asegurar sincronización
        loadEmpresaImage();
        
        // Mostrar notificación si se proporciona
        if (type && message) {
            mostrarNotificacion(type, message);
        }
    };

    // Función para mostrar notificaciones
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
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

    // Cargar imagen de empresa al abrir el componente
    useEffect(() => {
        if (isOpen) {
            loadEmpresaImage();
        }
    }, [isOpen]);

    const loadEmpresaImage = async () => {
        try {
            setLoadingImage(true);
            // Solo obtener la URL directamente del usuario
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
    
    // Obtener la imagen a mostrar
    const displayImage = empresaImage || currentUser.logo_tipo;

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={handleClose} title={isEmployee ? 'Perfil de Empleado' : 'Perfil'} />
            
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
                        button={!isEmployee}
                        onButtonClick={!isEmployee ? handleImagenEmpresa : undefined}
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
            <ImagenEmpresa 
                isOpen={isOpenImagenEmpresa} 
                setIsOpen={setIsOpenImagenEmpresa}
                currentImage={empresaImage}
                onImageChange={handleImageChange}
                empresaId={sucursal?.empresas?.id}
            />
            
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
};

export default Usuario;