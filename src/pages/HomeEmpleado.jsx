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
import Movimientos from '../components/views/movimientos/PanelMovimientos';
import Pedidos from '../components/views/pedidos/PanelPedidos';
import Precios from '../components/views/precios/Precios';
import Clientes from '../components/views/clientes/Clientes';
import Proveedores from '../components/views/proveedores/Proveedores';
const HomeEmpleado = () => {
    const { employee, sucursalSeleccionada, loading, refreshEmployeeData } = useEmployee();
    const [activeScreen, setActiveScreen] = useState('inicio');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [modalComponent, setModalComponent] = useState(null);
    const [modalProps, setModalProps] = useState({});
    const [showModuleOptions, setShowModuleOptions] = useState(false);
    const [selectedModule, setSelectedModule] = useState(null);

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

        if (submodule.component) {
            setModalComponent(submodule.component);
            setModalProps(submodule.props || {});
            setIsModalOpen(true);
            setShowModuleOptions(false); // Cerrar modal de opciones
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

    // Función para renderizar el componente modal dinámicamente
    const renderModalComponent = () => {
        if (!modalComponent) return null;

        switch (modalComponent) {
            case 'AlmacenGeneral':
                return (
                    <AlmacenGeneral
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            case 'AlmacenAcopio':
                return (
                    <AlmacenAcopio
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            case 'Movimientos':
                return (
                    <Movimientos
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            case 'Pedidos':
                return (
                    <Pedidos
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            case 'Precios':
                return (
                    <Precios
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            case 'Clientes':
                return (
                    <Clientes
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            case 'Proveedores':
                return (
                    <Proveedores
                        isOpen={isModalOpen}
                        setIsOpen={setIsModalOpen}
                        {...modalProps}
                    />
                );
            default:
                console.log('⚠️ Componente no encontrado:', modalComponent);
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
                        onClose={() => setShowModuleOptions(false)}
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
                </ViewModal>
            )}

            {/* Modal dinámico */}
            {renderModalComponent()}
        </div>
    );
};

export default HomeEmpleado;
