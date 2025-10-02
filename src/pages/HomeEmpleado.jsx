import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import { useLayout } from '../context/LayoutContext';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import BarraLateralEmpleado from '../components/ui/BarraLateralEmpleado';
import InicioEmpleadoPC from '../components/screens/InicioEmpleadoPC';
import InicioEmpleado from '../components/screens/InicioEmpleado';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getAvailableModules, getAvailableMainModules } from '../constants/modules';
import '../styles/Home.css';
import styles from '../styles/view.module.css';
import ItemView from '../components/common/ItemView';
import ViewModal from '../components/ui/ViewModal';
import HeaderModal from '../components/common/HeaderModal';
import AlmacenGeneral from '../components/views/almacen-general/AlmacenGeneral';
import AlmacenAcopio from '../components/views/almacen-acopio/AlmacenAcopio';
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

const HomeEmpleado = () => {
    const { employee, sucursalSeleccionada, loading, refreshEmployeeData } = useEmployee();
    const { isLargeScreen } = useLayout();
    const [activeScreen, setActiveScreen] = useState('inicio');
    const [activeView, setActiveView] = useState(null);
    const [activeRoute, setActiveRoute] = useState('/dashboard/default');
    const [showModuleOptions, setShowModuleOptions] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [currentSubModule, setCurrentSubModule] = useState(null);
    const [isSubModuleOpen, setIsSubModuleOpen] = useState(false);

    if (loading || !employee) {
        return <LoadingSpinner />;
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

    // Obtener módulos principales disponibles
    const availableMainModules = getAvailableMainModules(employee.modules || []);

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
        if (!currentSubModule || !currentSubModule.component || !isSubModuleOpen) return null;

        switch (currentSubModule.component) {
            case 'AlmacenGeneral':
                return <AlmacenGeneral isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
            case 'AlmacenAcopio':
                return <AlmacenAcopio isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
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
            case 'MiProduccion':
                return <MiProduccion isOpen={isSubModuleOpen} setIsOpen={setIsSubModuleOpen} {...currentSubModule.props} />;
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
        </div>
    );
};

export default HomeEmpleado;
