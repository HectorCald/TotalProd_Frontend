import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import NoData from '../../common/NoData';
import ItemLine from '../../common/ItemLine';
import ItemView from '../../common/ItemView';
import ListData from '../../common/ListData';
import Carousel from '../../common/Carousel';
import CustomList from '../../common/CustomList';
import { useLayout } from '../../../context/LayoutContext';
import MapaModal from '../clientes/MapaModal';
import ModalEliminar from './modales/ModalEliminar';
import ModalResetear from './modales/ModalResetear';
import { MODULES } from '../../../constants/modules';
import StatusBadge from '../../common/StatusBadge';


function VerPersona({ isOpen, setIsOpen, usuario, onProveedorDeleted, onProveedorUpdated, sucursales = [] }) {
    const { isLargeScreen } = useLayout();

    // Estado local para el usuario (se actualiza cuando se edita)
    const [localUsuario, setLocalUsuario] = useState(usuario);

    // Actualizar el estado local cuando cambie el usuario prop
    useEffect(() => {
        setLocalUsuario(usuario);
        setActiveModuleIndex(0); // Resetear el índice del carousel cuando cambia el usuario
    }, [usuario]);

    // Estados para los modales
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);


    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Estado para el índice del slide activo del carousel
    const [activeModuleIndex, setActiveModuleIndex] = useState(0);

    // Función para abrir el mapa de ubicación
    const handleOpenMap = () => {
        setIsMapModalOpen(true);
    };

    // Función para manejar cuando se actualiza el personal (desde EditarAgregar)
    const handlePersonalUpdated = (updatedPersonal) => {
        // Actualizar el estado local con el personal actualizado
        setLocalUsuario(updatedPersonal);

        // Notificar al componente padre (Personal.jsx) para actualizar la lista
        // pero sin cerrar este modal
        if (onProveedorUpdated) {
            onProveedorUpdated(updatedPersonal);
        }

        // Cerrar solo el modal de editar (el toast ya lo muestra EditarAgregar)
        setIsEditOpen(false);
    };

    // Función para obtener el nombre del módulo principal desde el backend
    const getMainModuleName = (backendModuleName) => {
        const backendToFrontendMap = {
            'Almacen': 'Almacen',
            'Materia': 'Acopio',
            'Movimientos': 'Movimientos',
            'Conteos': 'Conteos',
            'Pedidos': 'Pedidos',
            'Precios': 'Precios',
            'Clientes': 'Clientes',
            'Proveedores': 'Proveedores',
            'Gastos': 'Gastos',
            'Deudas': 'Deudas',
            'Reportes': 'Reportes',
            'Balance': 'Balance',
            'Damabrava': 'Damabrava',
            'Historial': 'Historial',
            'Cotizaciones': 'Cotizaciones',
            'Personal': 'Personal',
            'Sucursales': 'Sucursales',
            'Importar': 'Importar'
        };

        const mainModuleKey = backendToFrontendMap[backendModuleName];
        if (!mainModuleKey) return backendModuleName;

        const mainModule = MODULES[mainModuleKey];
        return mainModule ? mainModule.name : backendModuleName;
    };

    // Función para obtener el nombre del submódulo desde MODULES
    const getSubmoduleDisplayName = (module) => {
        const mainModuleName = module.modulos?.name || '';
        const submoduleKeyFromDB = module.name || ''; // Esto viene como "realizar_salidas" desde la BD

        if (!mainModuleName || !submoduleKeyFromDB) return submoduleKeyFromDB;

        const backendToFrontendMap = {
            'Almacen': 'Almacen',
            'Materia': 'Acopio',
            'Movimientos': 'Movimientos',
            'Conteos': 'Conteos',
            'Pedidos': 'Pedidos',
            'Precios': 'Precios',
            'Clientes': 'Clientes',
            'Proveedores': 'Proveedores',
            'Gastos': 'Gastos',
            'Deudas': 'Deudas',
            'Reportes': 'Reportes',
            'Balance': 'Balance',
            'Damabrava': 'Damabrava',
            'Historial': 'Historial',
            'Cotizaciones': 'Cotizaciones',
            'Personal': 'Personal',
            'Sucursales': 'Sucursales',
            'Importar': 'Importar'
        };

        const mainModuleKey = backendToFrontendMap[mainModuleName];
        if (!mainModuleKey) return submoduleKeyFromDB;

        const mainModule = MODULES[mainModuleKey];
        if (!mainModule) return submoduleKeyFromDB;

        // Buscar el submódulo directamente por su clave (ej: "realizar_salidas")
        // Los submódulos están como propiedades del módulo principal
        for (const key in mainModule) {
            if (typeof mainModule[key] === 'object' && mainModule[key]?.name) {
                // Si la clave coincide con el nombre del backend (ej: "realizar_salidas")
                if (key === submoduleKeyFromDB) {
                    return mainModule[key].name; // Retornar el nombre legible (ej: "Salida o Venta")
                }
            }
        }

        // Si no se encuentra por clave exacta, retornar el valor original
        return submoduleKeyFromDB;
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>{`${localUsuario?.first_name || ''} ${localUsuario?.last_name || ''}`.trim() || 'Sin nombre'}<StatusBadge estado={localUsuario?.is_active ? 'activo' : 'inactivo'} /></h1>
                        <p className={styles.subTitle}>{localUsuario?.cargo || 'Sin cargo'}</p>
                    </div>
                </div>
                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información Personal"
                                transparent={true}
                                icon="user"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Sucursal" value={localUsuario?.sucursal?.name || 'Sin sucursal asignada'} vertical={false} />
                            <Dato label="Código" value={localUsuario?.codigo || 'Sin código'} vertical={false} />
                        </div>
                        <div className={styles.content}>
                            {(() => {
                                // Agrupar módulos por módulo principal
                                const modulesByMainModule = {};
                                localUsuario?.modules?.forEach(module => {
                                    const mainModuleName = module.modulos?.name || '';
                                    const mainModuleKey = getMainModuleName(mainModuleName);

                                    if (!modulesByMainModule[mainModuleKey]) {
                                        modulesByMainModule[mainModuleKey] = {
                                            name: mainModuleKey,
                                            submodules: []
                                        };
                                    }
                                    modulesByMainModule[mainModuleKey].submodules.push(module);
                                });

                                const modulesArray = Object.values(modulesByMainModule);
                                const currentModuleName = modulesArray[activeModuleIndex]?.name || '';

                                return (
                                    <>
                                        <ItemView
                                            title={`Módulos Asignados${currentModuleName ? ` (${currentModuleName})` : ''}`}
                                            transparent={true}
                                            icon="grid-alt"
                                            iconShape="square"
                                            style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                                        />
                                        <Carousel onSlideChange={setActiveModuleIndex}>
                                            {modulesArray.map((group, index) => (
                                                <div key={index}>
                                                    <ListData
                                                        label=""
                                                        items={group.submodules.map(module => getSubmoduleDisplayName(module))}
                                                        emptyText="Sin submódulos"
                                                        badgeColor="green"
                                                        badgeIcon="grid-alt"
                                                    />
                                                </div>
                                            ))}
                                        </Carousel>
                                    </>
                                );
                            })()}
                        </div>
                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{height:'100%'}}>
                            <ItemView
                                title="Permisos"
                                transparent={true}
                                icon="shield"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            {localUsuario?.permisos ? (
                                <CustomList
                                    items={[
                                        {
                                            label: 'Crear',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.crear
                                        },
                                        {
                                            label: 'Editar',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.editar
                                        },
                                        {
                                            label: 'Eliminar',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.eliminar
                                        },
                                        {
                                            label: 'Anular',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.anular
                                        },
                                        {
                                            label: 'Reemplazar',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.reemplazar
                                        },
                                        {
                                            label: 'Ver Información',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.ver
                                        },
                                        {
                                            label: 'Ver Sucursales',
                                            iconType: 'success',
                                            disabled: !localUsuario.permisos.ver
                                        }
                                    ]}
                                    columns={2}
                                />
                            ) : (
                                <NoData
                                    icon="shield"
                                    title="Sin permisos"
                                    detail="Este usuario no tiene permisos configurados aún"
                                    transparent={false}
                                    minHeight="150px"
                                />
                            )}
                        </div>
                    </div>
                </div>

                {/* Sección de ubicación - solo si tiene rastreo activado Y tiene coordenadas */}
                {localUsuario?.rastrear && localUsuario?.ubicacion && (
                    <div className={styles.content}>
                        <ItemLine
                            icon="map-pin"
                            title="Última Ubicación"
                            onClick={handleOpenMap}
                            arrow={true}
                            subtitle="Ver en mapa"
                        />
                    </div>
                )}

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Resetear Contraseña'
                        onClick={() => setIsResetPasswordOpen(true)}
                        iconName='key'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-gray'
                        label='Editar Persona'
                        onClick={() => setIsEditOpen(true)}
                        iconName='edit'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Persona'
                        onClick={() => setIsDeleteOpen(true)}
                        iconName='trash'
                        hideTextOnMobile={true}
                    />
                </div>
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar
                isOpen={isEditOpen}
                setIsOpen={setIsEditOpen}
                usuario={localUsuario}
                tipo='editar'
                onPersonalUpdated={handlePersonalUpdated}
                sucursales={sucursales}
            />

            {/* Modal de Eliminar*/}
            <ModalEliminar
                isOpen={isDeleteOpen}
                setIsOpen={setIsDeleteOpen}
                personal={localUsuario}
                sucursales={sucursales}
                setIsOpenVerPersona={setIsOpen}
                onPersonalEliminado={onProveedorDeleted}
            />

            {/* Modal de Resetear Contraseña*/}
            <ModalResetear
                isOpen={isResetPasswordOpen}
                setIsOpen={setIsResetPasswordOpen}
                personal={localUsuario}
            />

            {/* Modal de Mapa*/}
            <MapaModal
                isOpen={isMapModalOpen}
                setIsOpen={setIsMapModalOpen}
                initialLocation={localUsuario?.ubicacion}
                readOnly={true}
            />

        </View>
    );
}
export default VerPersona;