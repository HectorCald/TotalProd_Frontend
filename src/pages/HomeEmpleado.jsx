import React, { useState, useMemo, useEffect } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { useLayout } from '../context/LayoutContext';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import BarraLateralEmpleado from '../components/ui/BarraLateralEmpleado';
import InicioEmpleadoPC from '../components/screens/InicioEmpleadoPC';
import InicioEmpleado from '../components/screens/InicioEmpleado';
import LoadingSpinner from '../components/common/LoadingSpinner';
import NoData from '../components/common/NoData';
import { getAvailableModules, getAvailableMainModules } from '../constants/modules';
import '../styles/Home.css';
import styles from '../styles/view.module.css';
import ItemView from '../components/common/ItemView';
import ViewModal from '../components/ui/ViewModal';
import HeaderModal from '../components/common/HeaderModal';
import ModalOffline from '../components/views/offline/ModalOffline';
import AlmacenGeneral from '../components/views/almacen-general/AlmacenGeneral';
import AlmacenAcopio from '../components/views/almacen-acopio/AlmacenAcopio';
import AlmacenGeneralAuxiliar from '../components/views/almacen-general-auxiliar/AlmacenGeneral-Auxiliar';
import AlmacenAcopioAuxiliar from '../components/views/almacen-acopio-auxiliar/AlmacenAcopio-Auxiliar';
import PanelMovimientos from '../components/views/movimientos/PanelMovimientos';
import Pedidos from '../components/views/pedidos/PanelPedidos';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
import Precios from '../components/views/precios/Precios';
import Gastos from '../components/views/gastos/PanelGastos';
import FormularioProduccion from '../components/views/damabrava/produccion/FormularioProduccion';
import VerificarProduccion from '../components/views/damabrava/produccion/VerificarProduccion';
import MiProduccion from '../components/views/damabrava/produccion/MiProduccion';
import Balance from '../components/views/balance/Balance';
import Reportes from '../components/views/reportes/Reportes';
import Deudas from '../components/views/deudas/PanelDeudas';
import PanelConteos from '../components/views/conteos/PanelConteos';
import PanelCotizaciones from '../components/views/cotizaciones/PanelCotizaciones';
import personalService from '../services/personalService';

const HomeEmpleado = () => {
    const { employee, sucursalSeleccionada, loading, error } = useEmployee();
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

    // Detectar cambios en la conexión
    useEffect(() => {
        const handleOnline = () => {
            setIsOffline(false);
            setShowOfflineModal(false);
        };

        const handleOffline = () => {
            setIsOffline(true);
            setShowOfflineModal(true);
        };

        // Verificar estado inicial
        if (!navigator.onLine) {
            setIsOffline(true);
            setShowOfflineModal(true);
        }

        // Agregar listeners
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Cleanup
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, []);

    // Función para actualizar ubicación del empleado
    const updateEmployeeLocation = async () => {
        if (!employee || !employee.rastrear) {
            console.log('❌ No se actualiza ubicación - empleado:', !!employee, 'rastrear:', employee?.rastrear);
            return;
        }

        // Debounce: evitar actualizaciones muy frecuentes (mínimo 30 segundos entre actualizaciones)
        const now = Date.now();
        if (now - lastLocationUpdate < 30000) {
            console.log('⏳ Actualización de ubicación omitida (debounce)');
            return;
        }

        console.log('🔄 Intentando actualizar ubicación para empleado:', employee.id, 'rastrear:', employee.rastrear);

        try {
            const locationResponse = await personalService.getCurrentLocation();
            if (locationResponse.success) {
                console.log('📍 Ubicación obtenida:', locationResponse.data);
                const updateResponse = await personalService.updateLocation(
                    employee.id,
                    locationResponse.data.latitude,
                    locationResponse.data.longitude
                );
                
                if (updateResponse.success) {
                    console.log('✅ Ubicación actualizada exitosamente');
                    setLastLocationUpdate(now);
                } else {
                    console.error('❌ Error al actualizar ubicación:', updateResponse.message);
                }
            } else {
                console.error('❌ Error al obtener ubicación:', locationResponse.message);
            }
        } catch (error) {
            console.error('❌ Error al actualizar ubicación:', error);
        }
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

    const handleRetryConnection = () => {
        // Verificar conexión nuevamente
        if (navigator.onLine) {
            setIsOffline(false);
            setShowOfflineModal(false);
        } else {
            // Mantener modal abierto si sigue sin conexión
            setShowOfflineModal(true);
        }
    };

    // Mostrar loading mientras está cargando
    if (loading) {
        return <LoadingSpinner fullScreen={true} text="Cargando empleado..." icon="user"/>;
    }

    // Si hay error, mostrar NoData con error
    if (error) {
        
        // Determinar el tipo de error y el mensaje apropiado
        let errorTitle = "Error al cargar datos del empleado";
        let errorDetail = error;
        let errorIcon = "error-circle";
        
        if (error.includes('plan activo') || error.includes('plan')) {
            errorTitle = "Plan no activo";
            errorDetail = "La empresa no tiene un plan activo. Contacta al administrador para actualizar el plan y acceder a esta función.";
            errorIcon = "lock";
        } else if (error.includes('conexión') || error.includes('network') || error.includes('fetch')) {
            errorTitle = "Error de conexión";
            errorDetail = `${error}. Por favor, verifica tu conexión e intenta nuevamente.`;
            errorIcon = "wifi-off";
        }
        
        return (
            <div className="home-page">
                <Nav />
                <NoData 
                    icon={errorIcon}
                    title={errorTitle}
                    detail={errorDetail}
                    isError={true}
                    minHeight="60vh"
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
    };

    const handleViewClose = () => {
        setActiveView(null);
    };

    const handleMenuClick = (menuItem) => {
        if (menuItem.route) {
            setActiveRoute(menuItem.route);
        }
    };

    const handleViewOpenFromMenu = (viewName, props = {}) => {
        setActiveView(viewName);
    };

    const handleNavigateFromMenu = (route) => {
        setActiveRoute(route);
    };

    // Manejar click en módulo principal (AtajoAnuncio)
    const handleMainModuleClick = (module) => {
        setSelectedModule(module);
        setShowModuleOptions(true);
    };

    // Manejar click en submodule
    const handleSubModuleClick = (submodule) => {
        
        if (submodule.component) {
            setCurrentSubModule(submodule);
            setIsSubModuleOpen(true);
            // NO cerrar el ViewModal de opciones
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
            case 'Movimientos':
                return <PanelMovimientos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} tipoMovimiento={currentSubModule.props?.tipo} />;
            case 'Pedidos':
                return <Pedidos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
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
                return <PanelConteos isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} tipoConteo={currentSubModule.props?.tipo || 'almacen'} />;
            case 'MiProduccion':
                return <MiProduccion isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'PanelCotizaciones':
                return <PanelCotizaciones isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
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
                return isLargeScreen ? <InicioEmpleadoPC onViewOpen={handleViewOpen} /> : <InicioEmpleado employee={employee} onMainModuleClick={handleMainModuleClick} onViewOpen={handleViewOpen} />;
            default:
                return isLargeScreen ? <InicioEmpleadoPC onViewOpen={handleViewOpen} /> : <InicioEmpleado employee={employee} onMainModuleClick={handleMainModuleClick} onViewOpen={handleViewOpen} />;
        }
    };

    return (
        <div className="home-page">
            <Nav />
            
            {/* Layout para pantallas grandes */}
            {isLargeScreen ? (
                <div className="main-layout">
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
                    <div className="main-content">
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
                            <div className={styles.modalContent}>
                                {selectedModule.submodules.map((submodule, index) => (
                                    <ItemView
                                        key={index}
                                        title={submodule.name}
                                        description={submodule.description}
                                        icon={submodule.icon}
                                        arrow={true}
                                        onClick={() => handleSubModuleClick(submodule)}
                                    />
                                ))}
                            </div>
                            {/* Renderizar componentes dentro del modal como en AlmacenMedioGeneral.jsx */}
                            {renderSubModuleComponent()}
                        </ViewModal>
                    )}
                </>
            )}

            {/* Modal de conexión offline */}
            <ModalOffline
                isOpen={showOfflineModal}
                setIsOpen={setShowOfflineModal}
                onRetry={handleRetryConnection}
            />
        </div>
    );
};

export default HomeEmpleado;
