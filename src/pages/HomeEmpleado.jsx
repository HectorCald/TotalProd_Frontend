import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { useLayout } from '../context/LayoutContext';
import styles from '../styles/Home.module.css';
import modalStyles from '../styles/view.module.css';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import BarraLateralEmpleado from '../components/ui/BarraLateralEmpleado';
import InicioEmpleadoPC from '../components/screens/InicioEmpleadoPC';
import InicioEmpleado from '../components/screens/InicioEmpleado';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NoData from '../components/common/NoData';
import ItemView from '../components/common/ItemView';
import ViewModal from '../components/ui/ViewModal';
import HeaderModal from '../components/common/HeaderModal';
import ModalOffline from '../components/views/offline/ModalOffline';
import HistorialMovimientosOffline from '../components/views/movimientos/HistorialMovimientosOffline';
import { OFFLINE_NETWORK_FLAG } from '../utils/offlineNetworkInterceptor';
import { obtenerLocal, OFFLINE_DB_NAME, MOVIMIENTOS_SALIDA_STORE } from '../utils/indexedDB';
import personalService from '../services/personalService';
import { clearDataFetchLogsIfNeeded } from '../components/utils/DataSizeLogger';

// Componentes de vistas modales para uso en InicioEmpleado.jsx y renderSubModuleComponent
import AlmacenGeneral from '../components/views/almacen-general/AlmacenGeneral';
import AlmacenAcopio from '../components/views/almacen-acopio/AlmacenAcopio';
import AlmacenGeneralAuxiliar from '../components/views/almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../components/views/almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import AlmacenGeneralII from '../components/views/almacen-general-auxiliar-II/AlmacenGeneral-II';
import PanelMovimientos from '../components/views/movimientos/PanelMovimientos';
import PanelPedidos from '../components/views/pedidos/PanelPedidos';
import PanelConteos from '../components/views/conteos/PanelConteos';
import PanelCotizaciones from '../components/views/cotizaciones/PanelCotizaciones';
import PanelHistorial from '../components/views/historial/PanelHistorial';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
import Precios from '../components/views/precios/Precios';
import Gastos from '../components/views/gastos/PanelGastos';
import Deudas from '../components/views/deudas/PanelDeudas';
import Balance from '../components/views/balance/Balance';
import Reportes from '../components/views/reportes/Reportes';
import FormularioProduccion from '../components/views/damabrava/produccion/FormularioProduccion';
import VerificarProduccion from '../components/views/damabrava/produccion/VerificarProduccion';
import MiProduccion from '../components/views/damabrava/produccion/MiProduccion';
import Reglas from '../components/views/damabrava/reglas/Reglas';
import Personal from '../components/views/personal/Personal';
import PanelPagos from '../components/views/damabrava/produccion/pagos/PanelPagos';
import Sucursales from '../components/views/sucursales/Sucursales';
import ImportExport from '../components/views/exportar-importar/ImportExport';
import AsociadosSearch from '../components/views/asociados/AsociadosSearch';

const OFFLINE_EMPLOYEE_KEY = 'offline_employee_data';

const HomeEmpleado = () => {
    const { employee, sucursalSeleccionada, loading, error, clearEmployee, setEmployeeFromService } = useEmployee();
    const { isLargeScreen } = useLayout();
    const [activeScreen, setActiveScreen] = useState('inicio');
    const [activeView, setActiveView] = useState(null);
    const [activeRoute, setActiveRoute] = useState('/dashboard/default');
    const [showModuleOptions, setShowModuleOptions] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [currentSubModule, setCurrentSubModule] = useState(null);
    const [isSubModuleOpen, setIsSubModuleOpen] = useState(false);
    const [isOffline, setIsOffline] = useState(false);
    const [showOfflineModal, setShowOfflineModal] = useState(false);
    const [lastLocationUpdate, setLastLocationUpdate] = useState(0);
    const [offlineHydrated, setOfflineHydrated] = useState(false);
    const [isOfflineMode, setIsOfflineMode] = useState(false);
    const [offlineMovimientos, setOfflineMovimientos] = useState([]);
    const [isOfflineMovimientosOpen, setIsOfflineMovimientosOpen] = useState(false);
    const [forceOfflineModal, setForceOfflineModal] = useState(false);

    const loadOfflineEmployee = () => {
        if (employee) return false;
        try {
            const cachedEmployee = localStorage.getItem(OFFLINE_EMPLOYEE_KEY);
            if (!cachedEmployee) return false;
            const parsedEmployee = JSON.parse(cachedEmployee);
            if (parsedEmployee) {
                setEmployeeFromService(parsedEmployee);
                setOfflineHydrated(true);
                return true;
            }
        } catch (err) {
            console.error('Error cargando empleado offline:', err);
        }
        return false;
    };

    // Limpiar logs de dataFetchLogs diariamente
    useEffect(() => {
        clearDataFetchLogsIfNeeded();
    }, []);

    const isOfflineModeEnabled = useCallback(() => {
        try {
            return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
        } catch {
            return false;
        }
    }, []);

    // Detectar cambios en la conexión
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowOfflineModal(false);
            setOfflineHydrated(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            const offlineModeActive = isOfflineModeEnabled();
            setShowOfflineModal(!offlineModeActive);
            loadOfflineEmployee();
        };

        // Verificar estado inicial
        if (!navigator.onLine) {
            setIsOffline(true);
            const offlineModeActive = isOfflineModeEnabled();
            setShowOfflineModal(!offlineModeActive);
            loadOfflineEmployee();
        }

        // Agregar listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [isOfflineModeEnabled]);

    useEffect(() => {
        if (!error) return;
        if (offlineHydrated) return;
        if (typeof navigator !== 'undefined' && navigator.onLine === false) {
            loadOfflineEmployee();
        }
    }, [error, offlineHydrated]);

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

    // Función para actualizar ubicación del empleado
    const updateEmployeeLocation = async () => {
        if (!employee || !employee.rastrear) {
            return;
        }

        // Debounce: evitar actualizaciones muy frecuentes (mínimo 10 segundos entre actualizaciones)
        const now = Date.now();
        if (now - lastLocationUpdate < 10000) {
            return;
        }

        try {
            const locationResponse = await personalService.getCurrentLocation();
            if (locationResponse.success) {
                const updateResponse = await personalService.updateLocation(
                    employee.id,
                    locationResponse.data.latitude,
                    locationResponse.data.longitude
                );
                
                if (updateResponse.success) {
                    setLastLocationUpdate(now);
                }
            }
        } catch (error) {
            console.error('❌ Error al actualizar ubicación:', error);
        }
    };

    // Función específica para móviles - detectar cuando la app vuelve del background
    const handleMobileAppResume = () => {
        if (!employee || !employee.rastrear) return;
        
        // Delay más largo para móviles para asegurar que la app esté completamente activa
        setTimeout(() => {
            updateEmployeeLocation();
        }, 1000);
    };

    // Actualizar ubicación cuando el empleado tiene rastreo activado
    useEffect(() => {
        if (!employee || !employee.rastrear) return;

        // Actualizar ubicación inmediatamente al cargar
        updateEmployeeLocation();
    }, [employee?.id, employee?.rastrear]); // Solo cuando cambie el ID o el estado de rastreo

    // Actualizar ubicación cada vez que cambie la pantalla activa
    useEffect(() => {
        if (!employee || !employee.rastrear) return;
        
        // Actualizar ubicación cuando cambie la pantalla
        updateEmployeeLocation();
    }, [activeScreen, activeView, employee?.id]); // Incluir employee.id para evitar loops

    // Actualizar ubicación cuando la ventana vuelve a tener foco (usuario regresa a la app)
    useEffect(() => {
        if (!employee || !employee.rastrear) return;

        const handleFocus = () => {
            updateEmployeeLocation();
        };

        const handleVisibilityChange = () => {
            if (!document.hidden) {
                updateEmployeeLocation();
            }
        };

        // Para móviles: detectar cuando la app vuelve a estar activa
        const handleAppStateChange = () => {
            // Pequeño delay para asegurar que la app esté completamente activa
            setTimeout(() => {
                updateEmployeeLocation();
            }, 500);
        };

        // Agregar listeners para detectar cuando el usuario vuelve a la app
        window.addEventListener('focus', handleFocus);
        document.addEventListener('visibilitychange', handleVisibilityChange);
        
        // Para PWA/APK móviles
        window.addEventListener('pageshow', handleAppStateChange);
        window.addEventListener('resume', handleAppStateChange); // Evento específico de Cordova/PhoneGap
        
        // Detectar cuando la app vuelve del background (móviles)
        if (document.addEventListener) {
            document.addEventListener('resume', handleAppStateChange, false);
        }

        // Cleanup
        return () => {
            window.removeEventListener('focus', handleFocus);
            document.removeEventListener('visibilitychange', handleVisibilityChange);
            window.removeEventListener('pageshow', handleAppStateChange);
            window.removeEventListener('resume', handleAppStateChange);
            if (document.removeEventListener) {
                document.removeEventListener('resume', handleAppStateChange, false);
            }
        };
    }, [employee?.id, employee?.rastrear]);

    // Detectar cambios de estado de la app específicamente para móviles
    useEffect(() => {
        if (!employee || !employee.rastrear) return;

        // Detectar cuando la app vuelve del background (móviles)
        const handleAppStateChange = (event) => {
            // Solo procesar si la app vuelve a estar activa
            if (event.type === 'resume' || event.type === 'pageshow') {
                handleMobileAppResume();
            }
        };

        // Eventos específicos para móviles/PWA
        window.addEventListener('pageshow', handleAppStateChange);
        window.addEventListener('resume', handleAppStateChange);
        
        // Para aplicaciones híbridas (Cordova/PhoneGap)
        if (window.cordova || window.PhoneGap) {
            document.addEventListener('resume', handleAppStateChange, false);
            document.addEventListener('pause', () => {
                // Opcional: limpiar timers cuando la app va al background
            }, false);
        }

        // Cleanup
        return () => {
            window.removeEventListener('pageshow', handleAppStateChange);
            window.removeEventListener('resume', handleAppStateChange);
            if (window.cordova || window.PhoneGap) {
                document.removeEventListener('resume', handleAppStateChange, false);
            }
        };
    }, [employee?.id, employee?.rastrear]);

    const handleRetryConnection = () => {
        // Verificar conexión nuevamente
        if (navigator.onLine) {
            setIsOffline(false);
            setShowOfflineModal(false);
        } else {
            // Mantener modal abierto si sigue sin conexión
            const offlineModeActive = isOfflineModeEnabled();
            setShowOfflineModal(!offlineModeActive);
        }
    };

    const refreshOfflineMovimientos = useCallback(async () => {
        const hasInternet = typeof navigator === 'undefined' ? true : navigator.onLine !== false;
        if (isOfflineMode || !hasInternet) {
            setOfflineMovimientos([]);
            setIsOfflineMovimientosOpen(false);
            setForceOfflineModal(false);
            return;
        }
        try {
            const movimientos = await obtenerLocal(MOVIMIENTOS_SALIDA_STORE, OFFLINE_DB_NAME);
            if (Array.isArray(movimientos) && movimientos.length > 0) {
                setOfflineMovimientos(movimientos);
                setIsOfflineMovimientosOpen(true);
                setForceOfflineModal(true);
            } else {
                setOfflineMovimientos([]);
                setIsOfflineMovimientosOpen(false);
                setForceOfflineModal(false);
            }
        } catch (error) {
            console.warn('No se pudieron cargar movimientos offline:', error);
            setOfflineMovimientos([]);
            setIsOfflineMovimientosOpen(false);
            setForceOfflineModal(false);
        }
    }, [isOfflineMode]);

    useEffect(() => {
        refreshOfflineMovimientos();
    }, [refreshOfflineMovimientos]);

    useEffect(() => {
        const handleOnline = () => {
            refreshOfflineMovimientos();
        };
        window.addEventListener('online', handleOnline);
        return () => {
            window.removeEventListener('online', handleOnline);
        };
    }, [refreshOfflineMovimientos]);

    const handleOfflineMovementsUpdate = useCallback((updated) => {
        if (!Array.isArray(updated)) return;
        setOfflineMovimientos(updated);
        if (updated.length === 0) {
            setIsOfflineMovimientosOpen(false);
            setForceOfflineModal(false);
        } else {
            setIsOfflineMovimientosOpen(true);
        }
    }, []);

    // Mostrar loading mientras está cargando
    if (loading) {
        return <LoadingSpinner fullScreen={true} text="Cargando empleado..." icon="user"/>;
    }

    // Función para reintentar carga de empleado
    const handleRetry = () => {
        // Recargar la página completamente
        window.location.reload();
    };

    // Función para volver al login
    const handleGoToLogin = () => {
        // Limpiar context inmediatamente (igual que en Usuario.jsx)
        clearEmployee();
        
        // Redireccionar inmediatamente sin delay
        window.location.href = '/login';
    };

    // Si hay error, mostrar NoData con error
    if (error && !offlineHydrated) {
        
        // Determinar el tipo de error y el mensaje apropiado
        let errorTitle = "Error";
        let errorDetail = error;
        let errorIcon = "error-circle";
        
        // Verificar primero si es error de conexión (debe ser la primera verificación)
        const isConnectionError = error.includes('No se pudo conectar') || 
                                  error.includes('conexión') || 
                                  error.includes('connection') ||
                                  error.includes('network') || 
                                  error.includes('fetch') ||
                                  error.includes('internet') ||
                                  error.includes('offline') ||
                                  error.includes('Failed to fetch') ||
                                  error.includes('NetworkError');
        
        if (isConnectionError) {
            errorTitle = "Error";
            errorDetail = error.includes('No se pudo conectar') 
                ? error 
                : "No se pudo conectar al servidor. Verifica tu conexión a internet e intenta nuevamente.";
            errorIcon = "wifi-off";
        } else if (error.includes('inactiva') || error.includes('inactivo')) {
            errorTitle = "Cuenta inactiva";
            errorDetail = "Su cuenta de empleado está inactiva. Contacte al administrador para reactivar su acceso al sistema.";
            errorIcon = "user-x";
        } else if (error.includes('plan activo') || error.includes('plan')) {
            errorTitle = "Plan no activo";
            errorDetail = "La empresa no tiene un plan activo. Contacta al administrador para actualizar el plan y acceder a esta función.";
            errorIcon = "lock";
        }
        
        return (
            <div className={styles.homePage}>
                <Nav />
                <NoData 
                    icon={errorIcon}
                    title={errorTitle}
                    detail={errorDetail}
                    isError={true}
                    minHeight="60vh"
                    showRetryButton={true}
                    showLoginButton={true}
                    onRetry={handleRetry}
                    onLogin={handleGoToLogin}
                />
            </div>
        );
    }

    // Si no hay empleado o módulos después de cargar (sin error), mostrar loading
    if (!employee || !employee.modules) {
        return <LoadingSpinner fullScreen={true} text="Cargando empleado..." />;
    }

    const handleScreenChange = (screenId) => {
        setActiveScreen(screenId);
        setActiveRoute('/dashboard/default');
    };

    const handleViewOpen = (viewName) => {
        setActiveView(viewName);
        setActiveRoute(null);
        // Actualizar ubicación cuando se abre una vista
        if (employee?.rastrear) {
            updateEmployeeLocation();
        }
    };

    const handleViewClose = () => {
        setActiveView(null);
        // Actualizar ubicación cuando se cierra una vista
        if (employee?.rastrear) {
            updateEmployeeLocation();
        }
    };

    const handleMenuClick = (menuItem) => {
        if (menuItem.route) {
            setActiveRoute(menuItem.route);
            // Actualizar ubicación cuando se navega desde el menú
            if (employee?.rastrear) {
                updateEmployeeLocation();
            }
        }
    };

    const handleViewOpenFromMenu = (viewName, props = {}) => {
        setActiveView(viewName);
        // Actualizar ubicación cuando se abre vista desde el menú
        if (employee?.rastrear) {
            updateEmployeeLocation();
        }
    };

    const handleNavigateFromMenu = (route) => {
        setActiveRoute(route);
        // Actualizar ubicación cuando se navega desde el menú
        if (employee?.rastrear) {
            updateEmployeeLocation();
        }
    };

    // Manejar click en módulo principal (AtajoAnuncio)
    const handleMainModuleClick = (module) => {
        if (isOfflineMode && module?.key !== 'Almacen') {
            return;
        }
        // Si el módulo solo tiene un submódulo, abrirlo directamente sin mostrar opciones
        if (module?.submodules && module.submodules.length === 1) {
            const singleSubmodule = module.submodules[0];
            if (singleSubmodule?.component) {
                setCurrentSubModule(singleSubmodule);
                setIsSubModuleOpen(true);
                // Actualizar ubicación cuando se abre vista desde el atajo directo
                if (employee?.rastrear) {
                    updateEmployeeLocation();
                }
                return;
            }
        }

        // Si tiene múltiples submódulos, mostrar el modal de opciones
        setSelectedModule(module);
        setShowModuleOptions(true);
    };

    // Manejar click en submodule
    const handleSubModuleClick = (submodule) => {
        // Cerrar el modal de opciones (como en AlmacenMedio.jsx)
        setShowModuleOptions(false);
        
        if (submodule.component) {
            setCurrentSubModule(submodule);
            setIsSubModuleOpen(true);
        } else {
            console.log('⚠️ No hay componente definido para este submódulo');
        }
    };



    // Función para renderizar el componente del submódulo dinámicamente
    const renderSubModuleComponent = () => {
        if (!currentSubModule || !currentSubModule.component) return null;

        switch (currentSubModule.component) {
            case 'AlmacenGeneral':
                return <AlmacenGeneral isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'AlmacenGeneralAuxiliar':
                return <AlmacenGeneralAuxiliar isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'AlmacenAcopio':
                return <AlmacenAcopio isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'AlmacenAcopioAuxiliar':
                return <AlmacenAcopioAuxiliar isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'AlmacenGeneralII':
                return <AlmacenGeneralII isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} tipo={currentSubModule.props?.tipo || 'transferir'} {...currentSubModule.props} />;
            case 'PanelMovimientos':
                return <PanelMovimientos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} tipoMovimiento={currentSubModule.props?.tipoMovimiento || currentSubModule.props?.tipo} />;
            case 'PanelPedidos':
                return <PanelPedidos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} tipoPedido={currentSubModule.props?.tipoPedido || currentSubModule.props?.tipo} />;
            case 'Precios':
                return <Precios isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Clientes':
                return <Clientes isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Proveedores':
                return <Proveedores isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Gastos':
                return <Gastos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'FormularioProduccion':
                return <FormularioProduccion isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'VerificarProduccion':
                return <VerificarProduccion isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Balance':
                return <Balance isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Reportes':
                return <Reportes isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Deudas':
                return <Deudas isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'PanelConteos':
                return <PanelConteos
                    isOpen={isSubModuleOpen}
                    setIsOpen={setIsSubModuleOpen}
                    tipoConteo={currentSubModule.props?.tipoConteo ?? currentSubModule.props?.tipo ?? 'almacen'}
                />;
            case 'MiProduccion':
                return <MiProduccion isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Reglas':
                return <Reglas isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'PanelPagos':
                return <PanelPagos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'PanelCotizaciones':
                return <PanelCotizaciones isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'PanelHistorial':
                return <PanelHistorial isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Personal':
                return <Personal isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'Sucursales':
                return <Sucursales isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'ImportExport':
                return <ImportExport isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'AsociadosSearch':
                return <AsociadosSearch isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            default:
                console.log('⚠️ Componente no encontrado:', currentSubModule.component);
                return null;
        }
    };

    // Función para renderizar las pantallas
    const renderScreen = () => {
        const currentScreen = activeRoute === '/dashboard/default' ? 'inicio' : 'inicio';
        switch (currentScreen) {
            case 'inicio':
                return isLargeScreen ? <InicioEmpleadoPC onViewOpen={handleViewOpen} employee={employee} sucursalSeleccionada={sucursalSeleccionada} /> : <InicioEmpleado employee={employee} onMainModuleClick={handleMainModuleClick} onViewOpen={handleViewOpen} />;
            default:
                return isLargeScreen ? <InicioEmpleadoPC onViewOpen={handleViewOpen} employee={employee} sucursalSeleccionada={sucursalSeleccionada} /> : <InicioEmpleado employee={employee} onMainModuleClick={handleMainModuleClick} onViewOpen={handleViewOpen} />;
        }
    };

    return (
        <div className={styles.homePage}>
            <Nav />
            
            {/* Layout para pantallas grandes */}
            {isLargeScreen ? (
                <div className={styles.mainLayout}>
                    <BarraLateralEmpleado 
                        onMenuClick={handleMenuClick}
                        activeRoute={activeRoute}
                        onViewOpen={handleViewOpenFromMenu}
                        onNavigate={handleNavigateFromMenu}
                        onScreenChange={handleScreenChange}
                        activeScreen={activeRoute === '/dashboard/default' ? 'inicio' : 'inicio'}
                        onViewClose={handleViewClose}
                        employee={employee}
                    />
                    <div className={styles.mainContent}>
                        {renderScreen()}
                    </div>
                </div>
            ) : (
                <>
                    {/* BarraNavegacion para pantallas pequeñas */}
                    <BarraNavegacion 
                        activeScreen={activeScreen} 
                        onScreenChange={handleScreenChange}
                        isEmployee={true}
                        employee={employee}
                        onMainModuleClick={handleMainModuleClick}
                        hasUserData={!!employee}
                    />

                    {/* Modal de opciones de módulo */}
                    {showModuleOptions && selectedModule && (
                        <ViewModal isOpen={showModuleOptions} setIsOpen={setShowModuleOptions}>
                            <HeaderModal
                                title={selectedModule.name}
                                onClose={() => {
                                    setShowModuleOptions(false);
                                    setCurrentSubModule(null);
                                    setIsSubModuleOpen(false);
                                }}
                            />
                            <div className={modalStyles.modalContent}>
                                {selectedModule.submodules.map((submodule, index) => {
                                    const isAlmacenModule = (selectedModule?.key === 'Almacen') || selectedModule?.name?.toLowerCase().includes('almacén');
                                    const isSalidaSubmodule = (submodule?.assignedModule?.name === 'Salida o Venta') || (submodule?.name === 'Salida o Venta');
                                    const disabled = isOfflineMode && isAlmacenModule && !isSalidaSubmodule;
                                    return (
                                        <ItemView
                                            key={index}
                                            title={submodule.name}
                                            description={submodule.description}
                                            icon={submodule.icon}
                                            arrow={true}
                                            onClick={() => handleSubModuleClick(submodule)}
                                            disabled={disabled}
                                        />
                                    );
                                })}
                            </div>
                        </ViewModal>
                    )}
                    {/* Renderizar submódulo fuera del modal de opciones (como en AlmacenMedio.jsx) */}
                    {renderSubModuleComponent()}
                </>
            )}

            {/* Modal de conexión offline */}
            <ModalOffline
                isOpen={showOfflineModal}
                setIsOpen={setShowOfflineModal}
                onRetry={handleRetryConnection}
            />
            <HistorialMovimientosOffline
                isOpen={isOfflineMovimientosOpen}
                setIsOpen={setIsOfflineMovimientosOpen}
                movimientos={offlineMovimientos}
                titulo="Movimientos Offline"
                descripcion="Todos los movimientos pendientes por sincronizar."
                onClose={refreshOfflineMovimientos}
                disableClose={forceOfflineModal}
                onMovementsUpdate={handleOfflineMovementsUpdate}
                showOnlineWarning={true}
            />
        </div>
    );
};

export default HomeEmpleado;
