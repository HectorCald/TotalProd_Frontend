import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/old/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/old/ItemView';
import VerProveedor from './VerProveedor';
import Boton from '../../common/botones/Boton';
import EditarAgregar from './EditarAgregar';
import FetchData from '../../mixed/FetchData';
import proveedorService from '../../../services/proveedorService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/old/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/old/Table';
import InfoModal from '../../common/old/InfoModal';
import NoData from '../../common/widgets/NoData';
import PullToRefresh from '../../common/old/PullToRefresh';
import RefreshIndicator from '../../common/old/RefreshIndicator';
import useSessionCache from '../../../hooks/useSessionCache';

function Proveedores({ isOpen, setIsOpen, modoSeleccion = false, onProveedorSeleccionado }) {
    const { isLargeScreen } = useLayout();
    
    const [isOpenVerProveedor, setIsOpenVerProveedor] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    // Estados para proveedores
    const {
        value: proveedores,
        setValue: setProveedores,
    } = useSessionCache({
        key: 'proveedoresListado',
        defaultValue: [],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Callbacks para FetchData
    const handleProveedoresLoaded = useCallback((data) => {
        setProveedores(data || []);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (proveedores.length === 0) {
            setIsLoading(true);
        }
        // Incrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = prev + 1;
            // Mostrar RefreshIndicator cuando hay peticiones activas (en PC y móvil)
            if (newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [proveedores.length]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Ocultar RefreshIndicator cuando no hay peticiones activas
            if (newCount === 0) {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 500);
                }, 300);
            }
            return newCount;
        });
    }, []);


    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });


    // Función para manejar el click en un proveedor
    const handleProveedor = (persona) => {
        if (modoSeleccion) {
            // En modo selección, seleccionar el proveedor y cerrar
            if (onProveedorSeleccionado) {
                onProveedorSeleccionado(persona);
            }
            setIsOpen(false);
        } else {
            // Modo normal, abrir modal de ver proveedor
            setIsOpenVerProveedor(true);
            setInfoPersona(persona);
        }
    };


    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await proveedorService.getAll();
            if (response.success) {
                setProveedores(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar proveedores:', error);
        }
    };



    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Funciones para el buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
    };

    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };


    // Filtrar proveedores localmente basado en la búsqueda
    const proveedoresFiltrados = proveedores.filter(proveedor => 
        proveedor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (proveedor.phone && proveedor.phone.includes(searchQuery))
    );
    const proveedoresOrdenados = [...proveedoresFiltrados].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
    );


    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Proveedores';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        } else if (!error || error.status !== 403) {
            // Si no hay error o el error no es 403, cerrar el modal
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    }, [error, isOpen]);


    // Función para manejar cuando se crea un nuevo proveedor
    const handleProveedorCreated = (newProveedor) => {
        // Actualizar el estado local con el proveedor que devuelve el servidor
        setProveedores(prevProveedores => [newProveedor, ...prevProveedores]);
        
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
    };

    // Función para manejar cuando se elimina un proveedor
    const handleProveedorDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el proveedor eliminado
        setProveedores(prevProveedores => prevProveedores.filter(proveedor => proveedor.id !== deletedId));
        
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
    };

    // Función para manejar cuando se actualiza un proveedor
    const handleProveedorUpdated = (updatedProveedor) => {
        // Actualizar el estado local con el proveedor actualizado que devuelve el servidor
        setProveedores(prevProveedores => prevProveedores.map(proveedor => 
            proveedor.id === updatedProveedor.id ? updatedProveedor : proveedor
        ));
        
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Proveedor', icon: 'user' },
        { key: 'description', label: 'Descripción', icon: 'comment' },
        { key: 'telefono', label: 'Teléfono', icon: 'phone' }
    ];

    // Datos para la tabla
    const tableData = proveedoresOrdenados.map(proveedor => ({
        id: proveedor.id,
        name: proveedor.name || 'Sin nombre',
        description: proveedor.description || '--',
        telefono: proveedor.phone || '--'
    }));

    return (
        <>
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={!modoSeleccion}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar por nombre o teléfono..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title={modoSeleccion ? 'Seleccionar Proveedor' : 'Proveedores'}
            />
            <div className={styles.container}>
                {isLoading ? (
                    // Mostrar LoadingSpinner cuando está cargando
                    <LoadingSpinner />
                ) : (
                    <>
                        <div className={styles.titleContainer}>
                            <RefreshIndicator
                                isVisible={showRefreshIndicator}
                                isLoading={isRefreshing}
                            />
                        </div>
                        {isLargeScreen ? (
                    // Vista de tabla para pantallas grandes
                    <>
                        <div className={styles.content} style={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}>
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={(proveedor) => {
                                    // Buscar el proveedor original sin formatear
                                    const proveedorOriginal = proveedoresFiltrados.find(p => p.id === proveedor.id);
                                    handleProveedor(proveedorOriginal);
                                }}
                            />
                        </div>
                    </>
                        ) : (
                    // Vista de cards para pantallas pequeñas con PullToRefresh
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        screenName="Proveedores"
                        containerStyle={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}
                    >
                        {proveedoresOrdenados.length > 0 ? (
                            proveedoresOrdenados.map((proveedor, index) => (
                                <ItemView
                                    key={proveedor.id || index}
                                    title={proveedor.name || 'Sin nombre'}
                                    description={proveedor.description || 'Sin descripción'}
                                    arrow={true}
                                    onClick={() => handleProveedor(proveedor)}
                                />
                            ))
                        ) : (
                            <NoData 
                                icon="store"
                                title={searchQuery ? 'Sin resultados' : 'No hay proveedores'}
                                detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los proveedores que necesitas' : 'Registra proveedores para comenzar a gestionar tu base de datos de proveedores'}
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                    </PullToRefresh>
                        )}
                    </>
                )}
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar proveedor'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            {/* Modal de Ver Proveedor - solo en modo normal */}
            {!modoSeleccion && (
                <VerProveedor
                    isOpen={isOpenVerProveedor}
                    setIsOpen={setIsOpenVerProveedor}
                    usuario={infoPersona}
                    onProveedorDeleted={handleProveedorDeleted}
                    onProveedorUpdated={handleProveedorUpdated}
                />
            )}

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onProveedorCreated={handleProveedorCreated}
            />
            {/* Modal de Información */}
            <InfoModal
                isOpen={modalConfig.isOpen}
                setIsOpen={(isOpen) => setModalConfig(prev => ({ ...prev, isOpen }))}
                type={modalConfig.type}
                title={modalConfig.title}
                description={modalConfig.description}
                showButton={modalConfig.showButton}
                buttonText="Aceptar"
                onButtonClick={(setIsOpen)}
            />
            {/* FetchData para proveedores */}
            {isOpen && (
                <FetchData
                    service={proveedorService}
                    serviceName="proveedorService"
                    isOpen={isOpen}
                    onDataLoaded={handleProveedoresLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onRefresh={isLargeScreen ? handleRefresh : undefined}
                />
            )}
        </View>
        </>
    );
}
export default Proveedores;