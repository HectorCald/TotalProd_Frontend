import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerProveedor from './VerProveedor';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import FetchData from '../../mixed/FetchData';
import proveedorService from '../../../services/proveedorService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import InfoModal from '../../common/InfoModal';
import NoData from '../../common/NoData';
import Notification from '../../common/Notification';

function Proveedores({ isOpen, setIsOpen, modoSeleccion = false, onProveedorSeleccionado }) {
    const { isLargeScreen } = useLayout();
    
    const [isOpenVerProveedor, setIsOpenVerProveedor] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para proveedores
    const [proveedores, setProveedores] = useState([]);
    const [error, setError] = useState(null);

    // Callbacks para FetchData
    const handleProveedoresLoaded = useCallback((data) => {
        setProveedores(data || []);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    const handleLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);


    // Estado para la notificación
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
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


    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);

        try {
            const response = await proveedorService.getAll();
            if (response.success) {
                setProveedores(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar proveedores:', error);
        } finally {
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
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
        mostrarNotificacion('success', 'Proveedor agregado correctamente')
    };

    // Función para manejar cuando se elimina un proveedor
    const handleProveedorDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el proveedor eliminado
        setProveedores(prevProveedores => prevProveedores.filter(proveedor => proveedor.id !== deletedId));
        
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
        mostrarNotificacion('success', 'Proveedor eliminado correctamente')
    };

    // Función para manejar cuando se actualiza un proveedor
    const handleProveedorUpdated = (updatedProveedor) => {
        // Actualizar el estado local con el proveedor actualizado que devuelve el servidor
        setProveedores(prevProveedores => prevProveedores.map(proveedor => 
            proveedor.id === updatedProveedor.id ? updatedProveedor : proveedor
        ));
        
        // Cerrar el modal de ver proveedor
        setIsOpenVerProveedor(false);
        mostrarNotificacion('success', 'Proveedor actualizado correctamente')
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Proveedor', icon: 'user' },
        { key: 'description', label: 'Descripción', icon: 'comment' },
        { key: 'telefono', label: 'Teléfono', icon: 'phone' }
    ];

    // Datos para la tabla
    const tableData = proveedoresFiltrados.map(proveedor => ({
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
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <div className={styles.content} style={{
                        maxHeight: 'calc(100% - 90px)',
                    }}>
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(proveedor) => {
                                // Buscar el proveedor original sin formatear
                                const proveedorOriginal = proveedoresFiltrados.find(p => p.id === proveedor.id);
                                handleProveedor(proveedorOriginal);
                            }}
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        proveedoresFiltrados.length > 0 ? (
                            proveedoresFiltrados.map((proveedor, index) => (
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
                        )
                    )}
                </div>
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
                    onLoadingStart={() => handleLoading(true)}
                    onLoadingEnd={() => handleLoading(false)}
                    onError={handleError}
                />
            )}

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
        </>
    );
}
export default Proveedores;