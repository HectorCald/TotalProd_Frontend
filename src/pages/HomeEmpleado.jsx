import React, { useState } from 'react';
import { useEmployee } from '../context/EmployeeContext';
import Nav from '../components/ui/Nav';
import BarraNavegacion from '../components/ui/BarraNavegacion';
import Screen from '../components/ui/Screen';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getAvailableModules, getAvailableMainModules } from '../constants/modules';
import AlmacenGeneral from '../components/views/almacen-general/AlmacenGeneral';
import '../styles/Home.css';
import styles from '../styles/view.module.css';
import ItemView from '../components/common/ItemView';
import AlmacenAcopio from '../components/views/almacen-acopio/AlmacenAcopio';
import AtajoAnuncio from '../components/common/AtajoAnuncio';
import ViewModal from '../components/ui/ViewModal';
import HeaderModal from '../components/common/HeaderModal';
import PanelMovimientos from '../components/views/movimientos/PanelMovimientos';
import Pedidos from '../components/views/pedidos/PanelPedidos';
import Precios from '../components/views/precios/Precios';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
const HomeEmpleado = () => {
    const { employee, sucursalSeleccionada, loading, refreshEmployeeData } = useEmployee();
    const [activeScreen, setActiveScreen] = useState('inicio');
    const [showModuleOptions, setShowModuleOptions] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);
    const [currentSubModule, setCurrentSubModule] = useState(null);
    const [isSubModuleOpen, setIsSubModuleOpen] = useState(false);

    if (loading || !employee) {
        return <LoadingSpinner />;
    }

    const handleScreenChange = (screenId) => {
        setActiveScreen(screenId);
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
        console.log('🔍 HomeEmpleado - Click en submódulo:', submodule);
        console.log('🔍 HomeEmpleado - Employee sucursal_id:', employee?.sucursal_id);
        console.log('🔍 HomeEmpleado - Sucursal seleccionada:', sucursalSeleccionada);
        if (submodule.component) {
            setCurrentSubModule(submodule);
            setIsSubModuleOpen(true);
            // NO cerrar el ViewModal de opciones
        } else {
            console.log('⚠️ No hay componente definido para este submódulo');
        }
    };


    const renderScreen = () => {
        switch (activeScreen) {
            case 'inicio':
                return (
                    <div>
                        <div className={styles.modulos}>
                        <p className={styles.subTitle}>Módulos Disponibles</p>
                            {availableMainModules.map((module, index) => (
                                <AtajoAnuncio
                                    key={index}
                                    title={module.name}
                                    description={module.description}
                                    image={module.image}
                                    onClick={() => handleMainModuleClick(module)}
                                />
                            ))}
                        </div>

                        {availableMainModules.length === 0 && (
                            <div className={styles.noData}>
                                <p>No tienes módulos asignados</p>
                            </div>
                        )}
                    </div>
                );
            case 'destacados':
                return <Screen title="Destacados" />;
            case 'buscar':
                return <Screen title="Buscar" />;
            case 'reportes':
                return <Screen title="Reportes" />;
            default:
                return (
                    <>
                        <p className={styles.subTitle}>Módulos y Permisos Asignados</p>
                        <div className={styles.noModules}>
                            <p>No tienes módulos asignados</p>
                        </div>

                    </>
                );
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
            default:
                console.log('⚠️ Componente no encontrado:', currentSubModule.component);
                return null;
        }
    };

    return (
        <div className="home-page">
            <Nav />
            <BarraNavegacion activeScreen={activeScreen} onScreenChange={handleScreenChange} />
            {renderScreen()}

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
        </div>
    );
};

export default HomeEmpleado;
