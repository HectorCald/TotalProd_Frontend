import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerCliente from './VerCliente';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import clientService from '../../../services/clientService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import useSessionCache from '../../../hooks/useSessionCache';


function Clientes({ isOpen, setIsOpen, modoSeleccion = false, onClienteSeleccionado }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerCliente, setIsOpenVerCliente] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);

    // Estados para clientes
    const {
        value: clientes,
        setValue: setClientes,
    } = useSessionCache({
        key: 'clientesListado',
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


    // Función para manejar cuando se cargan los clientes
    const handleClientesLoaded = useCallback((data) => {
        setClientes(data);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (clientes.length === 0) {
            setIsLoading(true);
        }
        // Incrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = prev + 1;
            // Mostrar RefreshIndicator solo cuando hay peticiones activas
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [clientes.length, isLargeScreen]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Ocultar RefreshIndicator cuando no hay peticiones activas
            if (newCount === 0 && isLargeScreen) {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 500);
                }, 300);
            }
            return newCount;
        });
    }, [isLargeScreen]);







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

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Clientes';

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


    // Función para manejar el click en un cliente
    const handleCliente = (persona) => {
        if (modoSeleccion) {
            // En modo selección, seleccionar el cliente y cerrar
            if (onClienteSeleccionado) {
                onClienteSeleccionado(persona);
            }
            setIsOpen(false);
        } else {
            // Modo normal, abrir modal de ver cliente
            setIsOpenVerCliente(true);
            setInfoPersona(persona);
        }
    };


    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await clientService.getAll();
            if (response.success) {
                setClientes(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar clientes:', error);
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

    // Filtrar clientes localmente basado en la búsqueda
    const clientesFiltrados = clientes.filter(cliente =>
        cliente.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (cliente.phone && cliente.phone.includes(searchQuery))
    );
    const clientesOrdenados = [...clientesFiltrados].sort((a, b) =>
        (a.name || '').localeCompare(b.name || '')
    );


    // Función para manejar cuando se crea un nuevo cliente
    const handleClientCreated = (newClient) => {
        // Actualizar el estado local con el cliente que devuelve el servidor
        setClientes(prevClientes => [newClient, ...prevClientes]);

        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Cliente agregado correctamente')
    };


    // Función para manejar cuando se elimina un cliente
    const handleClientDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el cliente eliminado
        setClientes(prevClientes => prevClientes.filter(cliente => cliente.id !== deletedId));

        // Cerrar el modal de ver cliente
        setIsOpenVerCliente(false);
        mostrarNotificacion('success', 'Cliente eliminado correctamente')
    };


    // Función para manejar cuando se actualiza un cliente
    const handleClientUpdated = (updatedClient) => {
        // Actualizar el estado local con el cliente actualizado que devuelve el servidor
        setClientes(prevClientes => prevClientes.map(cliente =>
            cliente.id === updatedClient.id ? updatedClient : cliente
        ));

        // Cerrar el modal de ver cliente
        setIsOpenVerCliente(false);
        mostrarNotificacion('success', 'Cliente actualizado correctamente')
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Cliente', icon: 'user' },
        { key: 'description', label: 'Descripción', icon: 'comment' },
        { key: 'telefono', label: 'Teléfono', icon: 'phone' },
        { key: 'total_orders', label: 'Total Pedidos', icon: 'shopping-cart' },
    ];

    // Datos para la tabla
    const tableData = clientesOrdenados.map(cliente => ({
        id: cliente.id,
        name: cliente.name || 'Sin nombre',
        description: cliente.description || '--',
        telefono: cliente.phone || '--',
        total_orders: cliente.total_orders || '0',
    }));

    return (
        <View
            isOpen={isOpen}
            setIsOpen={setIsOpen}
            isMainView={!modoSeleccion}
        >
            <HeaderView
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar por nombre o teléfono..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title={modoSeleccion ? 'Seleccionar Cliente' : 'Clientes'}
            />
            <div className={styles.container}>
                {isLoading ? (
                    // Mostrar LoadingSpinner cuando está cargando
                    <LoadingSpinner />
                ) : isLargeScreen ? (
                    // Vista de tabla para pantallas grandes
                    <>
                        <div className={styles.titleContainer}>
                            <RefreshIndicator
                                isVisible={showRefreshIndicator}
                                isLoading={isRefreshing}
                            />
                        </div>
                        <div className={styles.content}
                        style={
                            {
                                maxHeight: 'calc(100% - 80px)',
                                minHeight: 'calc(100% - 80px)'
                            }
                        }>
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={(cliente) => {
                                    // Buscar el cliente original sin formatear
                                    const clienteOriginal = clientesFiltrados.find(c => c.id === cliente.id);
                                    handleCliente(clienteOriginal);
                                }}
                            />
                        </div>
                    </>
                ) : (
                    // Vista de cards para pantallas pequeñas con PullToRefresh
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        screenName="Clientes"
                        containerStyle={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}
                    >
                        {clientesOrdenados.length > 0 ? (
                            clientesOrdenados.map((cliente, index) => (
                                <ItemView
                                    key={cliente.id || index}
                                    title={cliente.name || 'Sin nombre'}
                                    description={cliente.description || 'Sin descripción'}
                                    arrow={true}
                                    onClick={() => handleCliente(cliente)}
                                />
                            ))
                        ) : (
                            <NoData
                                icon="user"
                                title={searchQuery ? 'Sin resultados' : 'No hay clientes'}
                                detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los clientes que necesitas' : 'Registra clientes para comenzar a gestionar tu base de datos de clientes'}
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                    </PullToRefresh>
                )}
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar cliente'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>

            {/* Modal de Ver Cliente - solo en modo normal */}
            {!modoSeleccion && (
                <VerCliente
                    isOpen={isOpenVerCliente}
                    setIsOpen={setIsOpenVerCliente}
                    usuario={infoPersona}
                    onClientDeleted={handleClientDeleted}
                    onClientUpdated={handleClientUpdated}
                />
            )}

            {/* Modal de Editar/Agregar */}
            <EditarAgregar
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                tipo='agregar'
                onClientCreated={handleClientCreated}
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
                onButtonClick={() => setIsOpen(false)}
            />
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Carga de datos - solo cuando está abierto */}
            {isOpen && (
                <FetchData
                    service={clientService}
                    serviceName="clientService"
                    isOpen={isOpen}
                    onDataLoaded={handleClientesLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onRefresh={isLargeScreen ? handleRefresh : undefined}
                />
            )}
        </View>
    );
}

export default Clientes;