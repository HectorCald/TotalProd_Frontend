import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPrecio from './VerPrecio';
import Boton from '../../common/Boton';
import EditarAgregarPrecio from './EditarAgregarPrecio';
import FetchData from '../../mixed/FetchData';
import pricesTypesService from '../../../services/pricesTypesService';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import useSessionCache from '../../../hooks/useSessionCache';

function Precios({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerPrecio, setIsOpenVerPrecio] = useState(false);
    const [infoPrecio, setInfoPrecio] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para precios (persistidos por sesión)
    const {
        value: precios,
        setValue: setPrecios,
    } = useSessionCache({
        key: 'preciosListado',
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
    const handlePreciosLoaded = useCallback((data) => {
        setPrecios(data || []);
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (precios.length === 0) {
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
    }, [precios.length, isLargeScreen]);

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

    // Estados para la notificación
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

    // Función para manejar el click en un precio
    const handlePrecio = (precio) => {
        setInfoPrecio(precio);
        setIsOpenVerPrecio(true);
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await pricesTypesService.getAll();
            if (response.success) {
                setPrecios(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar precios:', error);
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

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Tipos de Precios';

            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        }
    }, [error, isOpen]);

    // Filtrar precios localmente basado en la búsqueda
    const preciosFiltrados = precios.filter(precio =>
        precio.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (precio.description && precio.description.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Función para manejar cuando se crea un nuevo precio
    const handlePrecioCreated = (newPrecio) => {
        // Actualizar el estado local con el precio que devuelve el servidor
        setPrecios(prevPrecios => [newPrecio, ...prevPrecios]);

        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Tipo de precio agregado correctamente');
    };

    // Función para manejar cuando se elimina un precio
    const handlePrecioDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el precio eliminado
        setPrecios(prevPrecios => prevPrecios.filter(precio => precio.id !== deletedId));

        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un precio
    const handlePrecioUpdated = (updatedPrecio) => {
        // Actualizar el estado local con el precio actualizado que devuelve el servidor
        setPrecios(prevPrecios => prevPrecios.map(precio =>
            precio.id === updatedPrecio.id ? updatedPrecio : precio
        ));

        // Cerrar el modal de ver precio
        setIsOpenVerPrecio(false);
        mostrarNotificacion('success', 'Tipo de precio actualizado correctamente');
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Tipo de Precio', icon: 'dollar' },
        { key: 'description', label: 'Descripción', icon: 'comment' }
    ];

    // Datos para la tabla
    const tableData = preciosFiltrados.map(precio => ({
        id: precio.id,
        name: precio.name || 'Sin nombre',
        description: precio.description || 'Sin descripción'
    }));

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar tipo de precio"
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title='Tipos de Precios'
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
                        <div className={styles.content} style={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}>
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={(precio) => {
                                    // Buscar el precio original sin formatear
                                    const precioOriginal = preciosFiltrados.find(p => p.id === precio.id);
                                    handlePrecio(precioOriginal);
                                }}
                            />
                        </div>
                    </>
                ) : (
                    // Vista de cards para pantallas pequeñas con PullToRefresh
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        screenName="Precios"
                        containerStyle={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}
                    >
                        {preciosFiltrados.length > 0 ? (
                            preciosFiltrados.map((precio, index) => (
                                <ItemView
                                    key={precio.id || index}
                                    title={precio.name || 'Sin nombre'}
                                    description={precio.description || 'Sin descripción'}
                                    icon="dollar"
                                    arrow={true}
                                    onClick={() => handlePrecio(precio)}
                                />
                            ))
                        ) : (
                            <NoData 
                                icon="dollar"
                                title={searchQuery ? 'Sin resultados' : 'No hay precios'}
                                detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los tipos de precio que necesitas' : 'Crea tipos de precio para comenzar a gestionar tus precios'}
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                    </PullToRefresh>
                )}
            </div>

            <div className={styles.buttonFooter}>
                <Boton
                    className='btn-original'
                    label='Nuevo tipo de precio'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver precio*/}
            <VerPrecio
                isOpen={isOpenVerPrecio}
                setIsOpen={setIsOpenVerPrecio}
                precio={infoPrecio}
                onPrecioDeleted={handlePrecioDeleted}
                onPrecioUpdated={handlePrecioUpdated}
            />

            {/* Modal de agregar precio*/}
            <EditarAgregarPrecio
                isOpen={isAgregarOpen}
                setIsOpen={setIsAgregarOpen}
                tipo='agregar'
                onPrecioCreated={handlePrecioCreated}
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
            {/* FetchData para precios */}
            {isOpen && (
                <FetchData
                    service={pricesTypesService}
                    serviceName="pricesTypesService"
                    isOpen={isOpen}
                    onDataLoaded={handlePreciosLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onRefresh={isLargeScreen ? handleRefresh : undefined}
                />
            )}

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default Precios;
