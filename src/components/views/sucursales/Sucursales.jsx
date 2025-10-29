import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerSucursal from './VerSucursal';
import Boton from '../../common/Boton';
import EditarAgregarSucursal from './EditarAgregarSucursal';
import sucursalesService from '../../../services/sucursalesService';
import InfoModal from '../../common/InfoModal';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import NoData from '../../common/NoData';
import FetchData from '../../mixed/FetchData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';

function Sucursales({ isOpen, setIsOpen }) {
    const { user, sucursalSeleccionada } = useUser();
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerSucursal, setIsOpenVerSucursal] = useState(false);
    const [infoSucursal, setInfoSucursal] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para sucursales
    const [sucursales, setSucursales] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);
    
    // Estados para el buscador expandible
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Callback para manejar las sucursales cargadas
    const handleSucursalesLoaded = useCallback((data) => {
        setSucursales(data);
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (sucursales.length === 0) {
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
    }, [sucursales.length, isLargeScreen]);

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

    // Función para manejar el click en una sucursal
    const handleSucursal = (sucursal) => {
        setInfoSucursal(sucursal);
        setIsOpenVerSucursal(true);
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await sucursalesService.getByEmpresaId();
            if (response.success) {
                setSucursales(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar sucursales:', error);
        }
    };


    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Sucursales';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        }
    }, [error, isOpen]);

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

    // Filtrar sucursales localmente basado en la búsqueda
    const sucursalesFiltradas = sucursales.filter(sucursal => 
        sucursal.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Función para manejar cuando se crea una nueva sucursal
    const handleSucursalCreated = (newSucursal) => {
        // Actualizar el estado local con la sucursal que devuelve el servidor
        setSucursales(prevSucursales => [newSucursal, ...prevSucursales]);

        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Sucursal agregada correctamente');
    };

    // Función para manejar cuando se elimina una sucursal
    const handleSucursalDeleted = (deletedId) => {
        // Actualizar el estado local removiendo la sucursal eliminada
        setSucursales(prevSucursales => prevSucursales.filter(sucursal => sucursal.id !== deletedId));

        // Cerrar el modal de ver sucursal
        setIsOpenVerSucursal(false);
        mostrarNotificacion('success', 'Sucursal eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una sucursal
    const handleSucursalUpdated = (updatedSucursal) => {
        // Actualizar el estado local con la sucursal actualizada que devuelve el servidor
        setSucursales(prevSucursales => prevSucursales.map(sucursal =>
            sucursal.id === updatedSucursal.id ? updatedSucursal : sucursal
        ));

        // Actualizar también la sucursal en el modal si está abierto
        if (infoSucursal && infoSucursal.id === updatedSucursal.id) {
            setInfoSucursal(updatedSucursal);
        }

        // NO cerrar el modal de ver sucursal cuando se actualiza
        // El modal se mantiene abierto para mostrar los cambios actualizados
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Sucursal', icon: 'building' },
        { key: 'almacen_tipo', label: 'Almacén', icon: 'store' },
        { key: 'precios', label: 'Precios', icon: 'tag' },
        { key: 'total_pedidos', label: 'Pedidos', icon: 'shopping-bag' },
        { key: 'created_at', label: 'Fecha de Creación', icon: 'calendar' }
    ];

    // Datos para la tabla
    const tableData = sucursalesFiltradas.map(sucursal => {
        let preciosNombres;
        if (sucursal.name === 'Casa Matriz') {
            preciosNombres = 'Todos los precios';
        } else {
            preciosNombres = (sucursal.precios || []).map(p => p.name).join(', ') || 'Sin precios';
        }
        return {
            id: sucursal.id,
            name: sucursal.name || 'Sin nombre',
            almacen_tipo: sucursal.almacen_sucursal_id ? 'Comparte' : 'Propio',
            total_pedidos: sucursal.total_pedidos !== undefined ? sucursal.total_pedidos.toString() : '0',
            precios: preciosNombres,
            created_at: sucursal.created_at ? new Date(sucursal.created_at).toLocaleDateString('es-ES') : 'Sin fecha'
        };
    });

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar sucursal"
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title='Sucursales'
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
                                onRowClick={(sucursal) => {
                                    // Buscar la sucursal original sin formatear
                                    const sucursalOriginal = sucursalesFiltradas.find(s => s.id === sucursal.id);
                                    handleSucursal(sucursalOriginal);
                                }}
                            />
                        </div>
                    </>
                ) : (
                    // Vista de cards para pantallas pequeñas con PullToRefresh
                    <PullToRefresh
                        onRefresh={handleRefresh}
                        screenName="Sucursales"
                        containerStyle={{
                            maxHeight: 'calc(100% - 80px)',
                            minHeight: 'calc(100% - 80px)'
                        }}
                    >
                        {sucursalesFiltradas.length > 0 ? (
                            sucursalesFiltradas.map((sucursal, index) => (
                                <ItemView
                                    key={sucursal.id || index}
                                    title={sucursal.name || 'Sin nombre'}
                                    description={`Creada el ${sucursal.created_at ? new Date(sucursal.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}`}
                                    icon="building"
                                    arrow={true}
                                    onClick={() => handleSucursal(sucursal)}
                                />
                            ))
                        ) : (
                            <NoData 
                                icon="store"
                                title={searchQuery ? 'Sin resultados' : 'No hay sucursales'}
                                detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar las sucursales que necesitas' : 'Registra sucursales para comenzar a gestionar tus ubicaciones'}
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
                    label='Nueva sucursal'
                    onClick={() => { setIsAgregarOpen(true); }}
                />
            </div>

            {/* Modal de ver sucursal*/}
            <VerSucursal
                isOpen={isOpenVerSucursal}
                setIsOpen={setIsOpenVerSucursal}
                sucursal={infoSucursal}
                onSucursalDeleted={handleSucursalDeleted}
                onSucursalUpdated={handleSucursalUpdated}
            />

            {/* Modal de agregar sucursal*/}
            <EditarAgregarSucursal
                isOpen={isAgregarOpen}
                setIsOpen={setIsAgregarOpen}
                tipo='agregar'
                onSucursalCreated={handleSucursalCreated}
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

            {/* FetchData para sucursales */}
            {isOpen && (
                <FetchData
                    service={sucursalesService}
                    serviceName="sucursalesService"
                    method="getByEmpresaId"
                    isOpen={isOpen}
                    onDataLoaded={handleSucursalesLoaded}
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

export default Sucursales;
