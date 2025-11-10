import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { normalizeSearchValue, normalizedIncludes } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerCotizacion from './VerCotizacion';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import InfoModal from '../../common/InfoModal';
import cotizacionesService from '../../../services/cotizacionesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroEstadoCotizacion from '../../mixed/FiltroEstadoCotizacion';
import NoData from '../../common/NoData';
import FetchData from '../../mixed/FetchData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';


function PanelCotizaciones({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerCotizacion, setIsOpenVerCotizacion] = useState(false);
    const [infoCotizacion, setInfoCotizacion] = useState(null);

    // Estados para búsqueda
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estados para loading
    const [isLoadingCotizaciones, setIsLoadingCotizaciones] = useState(false);
    
    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);
    
    // Estado para acumular o reemplazar las cotizaciones mostradas
    const [allCotizaciones, setAllCotizaciones] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para cotizaciones
    const [cotizaciones, setCotizaciones] = useState([]);
    const [error, setError] = useState(null);

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });


    // Función para manejar cuando se cargan las cotizaciones
    const handleCotizacionesLoaded = useCallback((data) => {
        setCotizaciones(data);
        setAllCotizaciones(data);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (allCotizaciones.length === 0) {
            setIsLoadingCotizaciones(true);
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
    }, [allCotizaciones.length, isLargeScreen]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoadingCotizaciones(false);
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

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await cotizacionesService.getAll();
            if (response.success) {
                setCotizaciones(response.data);
                setAllCotizaciones(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar cotizaciones:', error);
        }
    };

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

    // Estados para filtros y modales
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [filtroEstadoNombre, setFiltroEstadoNombre] = useState('Todos los estados');

    // Función para manejar el click en una cotización
    const handleRegistro = (cotizacion) => {
        setInfoCotizacion(cotizacion);
        setIsOpenVerCotizacion(true);
    };


    // Función para manejar filtro de estado
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        
        // Actualizar el nombre del filtro
        if (estado === null) {
            setFiltroEstadoNombre('Todos los estados');
        } else if (estado === 'pendiente') {
            setFiltroEstadoNombre('Pendientes');
        } else if (estado === 'aprobada') {
            setFiltroEstadoNombre('Aprobadas');
        } else if (estado === 'anulado') {
            setFiltroEstadoNombre('Anuladas');
        }
    };

    // Funciones para el buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleSearchNormalizedChange = (normalizedValue) => {
        setSearchQueryNormalized(normalizedValue || '');
    };

    const handleSearchClear = () => {
        setSearchQuery('');
        setSearchQueryNormalized('');
    };

    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
            setFiltroEstado(null);
            setFiltroEstadoNombre('Todos los estados');
            setOrdenamiento('fecha_desc');
        }
    }, [isOpen]);

    // Efecto para manejar errores
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo cotizaciones:', error);
        }
    }, [error]);

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Cotizaciones';
            
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

    // Función para manejar cuando se anula una cotización (mantener para compatibilidad)
    const handleCotizacionAnulada = (cotizacionId) => {
        // Buscar la cotización y actualizarla
        const cotizacionActualizada = allCotizaciones.find(c => c.id === cotizacionId);
        if (cotizacionActualizada) {
            handleCotizacionActualizada({
                ...cotizacionActualizada,
                estado: 'anulado'
            });
        }
    };

    // Función para manejar cuando se elimina una cotización
    const handleCotizacionEliminada = (cotizacionId) => {
        // Actualizar el estado local acumulado
        setAllCotizaciones(prevCotizaciones => 
            prevCotizaciones.filter(cotizacion => cotizacion.id !== cotizacionId)
        );
        
        mostrarNotificacion('success', 'Cotización eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una cotización (anular, aprobar, etc.)
    const handleCotizacionActualizada = (cotizacionActualizada) => {
        // Actualizar el estado local acumulado con la cotización actualizada
        setAllCotizaciones(prevCotizaciones => 
            prevCotizaciones.map(cotizacion => 
                cotizacion.id === cotizacionActualizada.id 
                    ? cotizacionActualizada
                    : cotizacion
            )
        );
        
        // Mostrar notificación según el estado
        if (cotizacionActualizada.estado === 'aprobada') {
            mostrarNotificacion('success', 'Cotización aprobada correctamente');
        } else if (cotizacionActualizada.estado === 'anulado') {
            mostrarNotificacion('success', 'Cotización anulada correctamente');
        }
    };

    // Función para obtener el nombre del filtro de estado
    const getEstadoNombre = () => {
        return filtroEstadoNombre;
    };


    const opciones = [
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstado(true)
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'numero_cotizacion', label: 'Nº', icon: 'hash' },
        { key: 'cliente', label: 'Cliente', icon: 'user' },
        { key: 'total', label: 'Total', icon: 'dollar' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'metodo_pago', label: 'Método', icon: 'credit-card' }
    ];

    // Filtrar cotizaciones localmente
    const cotizacionesFiltradas = allCotizaciones.filter(cotizacion => {
        // Filtro de búsqueda normalizado
        const normalizedQuery = searchQueryNormalized || normalizeSearchValue(searchQuery);
        
        // Debug: Log de búsqueda si hay query
        if (searchQuery && searchQuery.trim()) {
            console.log('[PanelCotizaciones] Buscando:', {
                query: searchQuery,
                normalized: normalizedQuery,
                cotizacionId: cotizacion.id,
                numero: cotizacion.numero_cotizacion,
                cliente: cotizacion.cliente?.name,
                productos: cotizacion.productos?.length || 0
            });
        }
        
        const matchesSearch = !normalizedQuery ||
            normalizedIncludes(normalizeSearchValue(cotizacion.numero_cotizacion?.toString() || ''), normalizedQuery) ||
            normalizedIncludes(normalizeSearchValue(cotizacion.cliente?.name || ''), normalizedQuery) ||
            normalizedIncludes(normalizeSearchValue(cotizacion.observaciones || ''), normalizedQuery) ||
            // Buscar en productos de la cotización
            (cotizacion.productos && cotizacion.productos.some(producto => 
                normalizedIncludes(normalizeSearchValue(producto.producto?.name || ''), normalizedQuery) ||
                normalizedIncludes(normalizeSearchValue(producto.producto?.description || ''), normalizedQuery)
            ));

        // Filtro de estado
        const matchesEstado = filtroEstado === null || cotizacion.estado === filtroEstado;

        return matchesSearch && matchesEstado;
    }).sort((a, b) => {
        // Ordenamiento
        switch (ordenamiento) {
            case 'fecha_desc':
                return new Date(b.fecha) - new Date(a.fecha);
            case 'fecha_asc':
                return new Date(a.fecha) - new Date(b.fecha);
            case 'numero_desc':
                return (b.numero_cotizacion || 0) - (a.numero_cotizacion || 0);
            case 'numero_asc':
                return (a.numero_cotizacion || 0) - (b.numero_cotizacion || 0);
            default:
                return new Date(b.fecha) - new Date(a.fecha);
        }
    });

    // Datos para la tabla
    const tableData = cotizacionesFiltradas.map(cotizacion => {
        // Procesar nombre del usuario/personal
        let responsable = 'Usuario desconocido';
        if (cotizacion.user) {
            responsable = `${cotizacion.user.first_name || ''} ${cotizacion.user.last_name || ''}`.trim();
        } else if (cotizacion.personal) {
            responsable = `${cotizacion.personal.first_name || ''} ${cotizacion.personal.last_name || ''}`.trim();
        }

        return {
            id: cotizacion.id,
            numero_cotizacion: cotizacion.numero_cotizacion || 'Sin número',
            cliente: cotizacion.cliente?.name || 'Sin cliente',
            total: `Bs. ${(parseFloat(cotizacion.total) || 0).toFixed(2)}`,
            fecha: new Date(cotizacion.fecha).toLocaleDateString(),
            estado: cotizacion.estado === 'anulado' ? 'Anulado' : cotizacion.estado === 'aprobada' ? 'Aprobada' : 'Pendiente',
            metodo_pago: cotizacion.metodo_pago || '--',
            responsable: responsable
        };
    });

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Pendiente': {
                    text: 'Pendiente',
                    className: 'warning' // amarillo
                },
                'Aprobada': {
                    text: 'Aprobada',
                    className: 'success' // verde
                },
                'Anulado': {
                    text: 'Anulado',
                    className: 'error' // rojo
                },
            };
            
            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }
        
        return null;
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar por número, cliente o productos..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title="Cotizaciones"
            />
            <div className={styles.container}>
                {isLoadingCotizaciones ? (
                    // Mostrar LoadingSpinner cuando está cargando
                    <LoadingSpinner />
                ) : (
                    <>
                        {isLargeScreen && (
                            <div className={styles.titleContainer}>
                                <RefreshIndicator
                                    isVisible={showRefreshIndicator}
                                    isLoading={isRefreshing}
                                />
                            </div>
                        )}
                        <Filtros options={opciones} />
                        {isLargeScreen ? (
                            // Vista de tabla para pantallas grandes
                            <div
                                className={styles.content}
                                style={{
                                    maxHeight: '100%'
                                }}
                            >
                                <Table
                                    headers={tableHeaders}
                                    data={tableData}
                                    onRowClick={(cotizacion) => {
                                        // Buscar la cotización original sin formatear
                                        const cotizacionOriginal = cotizacionesFiltradas.find(c => c.id === cotizacion.id);
                                        handleRegistro(cotizacionOriginal);
                                    }}
                                    getCellBadge={getCellBadge}
                                    columnWidths={{
                                        numero_cotizacion: '5%',
                                        cliente: '25%',
                                        total: '15%',
                                        fecha: '15%',
                                        estado: '15%',
                                        metodo_pago: '15%'
                                    }}
                                />
                            </div>
                        ) : (
                            // Vista de cards para pantallas pequeñas con PullToRefresh
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Cotizaciones"
                                containerStyle={{
                                    maxHeight: 'calc(100% - 80px)',
                                    minHeight: 'calc(100% - 80px)'
                                }}
                            >
                                {cotizacionesFiltradas.length > 0 ? (
                                    cotizacionesFiltradas.map((cotizacion, index) => {
                                        return (
                                            <ItemView
                                                key={cotizacion.id || index}
                                                title={`Cotización #${cotizacion.numero_cotizacion || 'Sin número'} - ${cotizacion.cliente?.name || 'Sin cliente'}`}
                                                description={`Total: Bs. ${(parseFloat(cotizacion.total) || 0).toFixed(2)} • ${new Date(cotizacion.fecha).toLocaleDateString()}${cotizacion.metodo_pago ? ` • ${cotizacion.metodo_pago}` : ''}`}
                                                icon='file'
                                                onClick={() => handleRegistro(cotizacion)}
                                                arrow={false}
                                                flot3={cotizacion?.estado === 'anulado' ? 'Anulado' : ''}
                                                flot4={cotizacion?.estado === 'aprobada' ? 'Aprobada' : ''}
                                                flot2={cotizacion?.estado === 'pendiente' ? 'Pendiente' : ''}
                                                colorIcon='azul'
                                            />
                                        );
                                    })
                                ) : (
                                    <NoData 
                                        icon="file"
                                        title={searchQuery || filtroEstado !== null ? 'Sin resultados' : 'No hay cotizaciones'}
                                        detail={searchQuery || filtroEstado !== null ? 'Intenta ajustar los filtros de búsqueda para encontrar las cotizaciones que necesitas' : 'Crea cotizaciones para comenzar a gestionar tus presupuestos'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                            </PullToRefresh>
                        )}
                    </>
                )}
            </div>
            
            {/* Modal de ver cotización*/}
            <VerCotizacion
                isOpen={isOpenVerCotizacion}
                setIsOpen={setIsOpenVerCotizacion}
                cotizacion={infoCotizacion}
                onCotizacionAnulada={handleCotizacionAnulada}
                onCotizacionEliminada={handleCotizacionEliminada}
                onCotizacionActualizada={handleCotizacionActualizada}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Filtro de estado de cotización */}
            <FiltroEstadoCotizacion
                isOpen={isOpenFiltroEstado}
                setIsOpen={setIsOpenFiltroEstado}
                onEstadoSeleccionado={handleFiltroEstado}
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

            {/* Carga de datos - solo cuando está abierto */}
            {isOpen && (
                <FetchData
                    service={cotizacionesService}
                    serviceName="cotizacionesService"
                    isOpen={isOpen}
                    onDataLoaded={handleCotizacionesLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                />
            )}

        </View>

    );
}
export default PanelCotizaciones;
