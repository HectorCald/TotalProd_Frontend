import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { getPrimaryNormalizedValue } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPedido from './VerPedido';
import VerPedidoAcopio from './VerPedidoAcopio';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import NoData from '../../common/NoData';
import FiltroEstadoPedido from '../../mixed/FiltroEstadoPedido';
import FiltroResponsable from '../../mixed/FiltroResponsable';
import Select from '../../common/Select';
import HistorialWhatsapp from './HistorialWhatsapp';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';

function PanelPedidos({ isOpen, setIsOpen, tipoPedido = '' }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modal de ver pedido
    const [isOpenVerPedido, setIsOpenVerPedido] = useState(false);
    const [infoPedido, setInfoPedido] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para loading
    const [isLoadingPedidos, setIsLoadingPedidos] = useState(false);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);


    // Estado para acumular todos los pedidos de todas las páginas
    const [allPedidos, setAllPedidos] = useState([]);
    const [currentTipoPedido, setCurrentTipoPedido] = useState(tipoPedido);

    // Estados para rastrear qué datos se han cargado
    const [pedidosLoaded, setPedidosLoaded] = useState(false);

    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQueryNormalized, 500);

    // Estados para filtros y modales
    const [isOpenFiltroOrden, setIsOpenFiltroOrden] = useState(false);
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [isOpenFiltroResponsable, setIsOpenFiltroResponsable] = useState(false);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');
    const [filtroResponsable, setFiltroResponsable] = useState(null);

    // Estados para pedidos
    const [pedidos, setPedidos] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Estados para el modal de historial WhatsApp
    const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
    const [historialData, setHistorialData] = useState({
        titulo: '',
        descripcion: '',
        tipo: '',
        datos: null
    });

    // Callbacks para FetchDataProgressive
    const handleDataLoaded = useCallback((data) => {
        setAllPedidos(data.length > 0 ? data : []);
        setPedidosLoaded(true);
    }, []);

    const handleDataAccumulated = useCallback((data) => {
        setAllPedidos(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const merged = [...prev];
            data.forEach(item => {
                if (!existingIds.has(item.id)) merged.push(item);
            });
            return merged;
        });
    }, []);

    const handleLoadingStart = useCallback(() => {
        if (currentPage === 1 && allPedidos.length === 0) {
            setIsLoading(true);
        } else if (currentPage > 1) {
            setIsLoadingMore(true);
        }
        
        setActiveRequests(prev => {
            const newCount = prev + 1;
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [currentPage, allPedidos.length, isLargeScreen]);

    const handleLoadingEnd = useCallback(() => {
        if (currentPage === 1) {
            setIsLoading(false);
        } else {
            setIsLoadingMore(false);
        }
        
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
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
    }, [currentPage, isLargeScreen]);

    const handleError = useCallback((err) => {
        setError(err);
    }, []);

    const handleHasMorePagesChange = useCallback((hasMore) => {
        setHasMorePages(hasMore);
    }, []);

    // Resetear flags cuando se abre el modal (NO los datos)
    useEffect(() => {
        if (isOpen) {
            setPedidosLoaded(false);
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

    // Función para manejar refresh
    const handleRefresh = async () => {
        // Limpiar estado acumulado y resetear página
        setAllPedidos([]);
        setCurrentPage(1);
        setPedidosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
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
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };


    // Efecto para resetear búsqueda cuando se abre - solo resetear búsqueda, no limpiar datos
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
        }
    }, [isOpen]);

    // Efecto para limpiar datos SOLO cuando cambia el tipo de pedido
    useEffect(() => {
        if (tipoPedido !== currentTipoPedido) {
            setAllPedidos([]);
            setCurrentPage(1);
            setFiltroEstado(null);
            setOrdenamiento('fecha_desc');
            setSearchQuery('');
            setSearchQueryNormalized('');
            setPedidosLoaded(false);
            setCurrentTipoPedido(tipoPedido);
            setFiltroResponsable(null);
            // FetchDataProgressive se encargará de recargar automáticamente
        }
    }, [tipoPedido, currentTipoPedido, isOpen]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllPedidos([]);
            setCurrentPage(1);
            setPedidosLoaded(false);
            // FetchDataProgressive se encargará de recargar automáticamente
        }
    }, [debouncedSearchQuery, filtroEstado, ordenamiento, filtroResponsable, isOpen]);

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo pedidos:', error);
        }
    }, [error]);




    // Función para ver un pedido
    const handleVerPedido = (pedido) => {
        setInfoPedido(pedido);
        setIsOpenVerPedido(true);
    };
    // Función para manejar cuando se elimina un pedido
    const handlePedidoEliminado = (pedidoId) => {
        // Actualizar el estado local acumulado
        setAllPedidos(prevPedidos =>
            prevPedidos.filter(pedido => pedido.id !== pedidoId)
        );

        mostrarNotificacion('success', 'Pedido eliminado correctamente');
        setIsOpenVerPedido(false);
    };
    // Función para manejar cuando se actualiza un pedido
    const handlePedidoActualizado = (pedidoActualizado) => {
        // Actualizar el estado local acumulado
        setAllPedidos(prevPedidos =>
            prevPedidos.map(pedido =>
                pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido
            )
        );

        // Actualizar también infoPedido si es el mismo pedido que se está viendo
        if (infoPedido && infoPedido.id === pedidoActualizado.id) {
            setInfoPedido(pedidoActualizado);
        }

        // No mostrar notificación aquí, ya que VerPedidoAcopio maneja las notificaciones específicas
        // No cerrar VerPedido para permitir que se mantenga abierto después de entregas/ediciones
    };



    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar filtro de estado
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        setCurrentPage(1);
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
    };

    // Función para manejar filtro de responsable
    const handleFiltroResponsable = (responsable) => {
        setFiltroResponsable(responsable);
        setCurrentPage(1);
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

    // Función para manejar el Select de WhatsApp
    const handleWhatsAppSelect = (value) => {
        if (value === 'historial') {
            const historial = JSON.parse(localStorage.getItem('historialEntregasAcopio') || '[]');
            setHistorialData({
                titulo: 'Historial de entregas realizadas',
                descripcion: 'HISTORIAL DE ENTREGAS',
                tipo: 'historial',
                datos: historial
            });
            setIsHistorialModalOpen(true);
        } else if (value === 'ultima-entrega') {
            const ultimaEntrega = JSON.parse(localStorage.getItem('ultimaEntregaAcopio') || 'null');
            setHistorialData({
                titulo: 'Detalles de la última entrega realizada',
                descripcion: 'DETALLES DE LA ÚLTIMA ENTREGA',
                tipo: 'ultima-entrega',
                datos: ultimaEntrega
            });
            setIsHistorialModalOpen(true);
        }
    };

    // Función para obtener el nombre del filtro de estado
    const getEstadoNombre = () => {
        if (filtroEstado === null) return 'Todos los estados';
        if (filtroEstado === 'Pendiente') return 'Pendientes';
        if (filtroEstado === 'Entregado') return 'Entregados';
        if (filtroEstado === 'Completado') return 'Completados';
        return 'Todos los estados';
    };

    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'fecha_desc': 'Más recientes',
            'fecha_asc': 'Más antiguos',
            'estado_asc': 'Estado A-Z',
            'estado_desc': 'Estado Z-A'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    // Función para obtener el nombre del responsable
    const getResponsableNombre = () => {
        if (!filtroResponsable) return 'Todos los responsables';
        return filtroResponsable.name || 'Responsable';
    };

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Pendiente': {
                    text: 'Pendiente',
                    className: 'error' // rojo
                },
                'Entregado': {
                    text: 'Entregado',
                    className: 'warning' // naranja
                },
                'Completado': {
                    text: 'Completado',
                    className: 'info' // verde
                },
            };

            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }
        return null;
    };

    const opciones = [
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstado(true)
        },
        {
            label: getResponsableNombre(),
            active: filtroResponsable !== null,
            onClick: () => setIsOpenFiltroResponsable(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setIsOpenFiltroOrden(true)
        },
    ];

    // Headers para la tabla
    const tableHeaders = tipoPedido === 'acopio' ? [
        { key: 'producto', label: 'Producto', icon: 'package' },
        { key: 'usuario', label: 'Usuario', icon: 'user' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'cantidad', label: 'Cantidad', icon: 'calculator' }
    ] : [
        { key: 'numero_pedido', label: 'Nº', icon: 'hash' },
        { key: 'sucursal', label: 'Sucursal', icon: 'store' },
        { key: 'usuario', label: 'Usuario', icon: 'user' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'cliente', label: 'Cliente', icon: 'user' },
        { key: 'observaciones', label: 'Observaciones', icon: 'file' }
    ];

    // Datos para la tabla
    const tableData = allPedidos.map(pedido => {
        if (tipoPedido === 'acopio') {
            return {
                id: pedido.id,
                producto: pedido.producto_acopio?.name || 'Producto desconocido',
                usuario: pedido.user?.name || pedido.personal?.name || 'Usuario desconocido',
                fecha: new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                cantidad: `${pedido.cantidad || 0} ${pedido.tipo_medida || ''}`,
                estado: pedido.estado
            };
        } else {
            return {
                id: pedido.id,
                numero_pedido: pedido.numero_pedido !== undefined && pedido.numero_pedido !== null ? `${pedido.numero_pedido}` : '0',
                sucursal: pedido.sucursal?.name || 'Sucursal desconocida',
                usuario: pedido.user?.name || pedido.personal?.name || 'Usuario desconocido',
                fecha: new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                cliente: pedido.cliente?.name || '--',
                observaciones: pedido.observaciones || '--',
                estado: pedido.estado
            };
        }
    });

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar pedidos..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title={tipoPedido === 'acopio' ? 'Pedidos de Materia Prima' : 'Pedidos de Almacén'}
            />
            <div className={styles.container}>
                {isLoading ? (
                    // Mostrar LoadingSpinner cuando está cargando inicialmente
                    <LoadingSpinner />
                ) : (
                    <>
                        <div className={styles.titleContainer}>
                            <RefreshIndicator
                                isVisible={showRefreshIndicator}
                                isLoading={isRefreshing}
                            />
                        </div>
                        <Filtros options={opciones} />

                        {isLargeScreen ? (
                            <div
                                className={styles.content}
                                onScroll={!isLargeScreen ? handleScroll : undefined}
                                style={{
                                    maxHeight: tipoPedido === 'acopio' || tipoPedido === 'almacen'
                                        ? '100%'
                                        : ''
                                }}
                            >
                                <Table
                                    headers={tableHeaders}
                                    data={tableData}
                                    onRowClick={(pedido) => {
                                        // Buscar el pedido original sin formatear
                                        const pedidoOriginal = allPedidos.find(p => p.id === pedido.id);
                                        handleVerPedido(pedidoOriginal);
                                    }}
                                    getCellBadge={getCellBadge}
                                    onScroll={handleScroll}
                                    columnWidths={tipoPedido === 'almacen' ? {
                                        numero_pedido: '3%',
                                        sucursal: '15%',
                                        usuario: '15%',
                                        fecha: '15%',
                                        estado: '10%',
                                        cliente: '15%',
                                        observaciones: '15%'
                                    } : {
                                        producto: '15%',
                                        usuario: '15%',
                                        fecha: '15%',
                                        estado: '10%',
                                        cantidad: '10%'
                                    }}
                                />

                                {/* Loading al final de la tabla */}
                                {isLoadingMore && (
                                    <LoadingSpinner />
                                )}
                            </div>
                        ) : (
                            // Vista de cards para pantallas pequeñas con PullToRefresh
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Pedidos"
                                containerStyle={{
                                    maxHeight: '100%',
                                    minHeight: '100%',
                                }}
                                onScroll={handleScroll}
                            >
                                {allPedidos.length > 0 ? (
                                    <>
                                        {allPedidos.map((pedido, index) => {
                                            return (
                                                <ItemView
                                                    key={pedido.id || index}
                                                    title={tipoPedido === 'acopio'
                                                        ? (pedido.producto_acopio?.name || 'Producto desconocido')
                                                        : (pedido.user?.name || pedido.personal?.name || 'Usuario desconocido')
                                                    }
                                                    description={tipoPedido === 'acopio'
                                                        ? `${pedido.cantidad || 0} ${pedido.tipo_medida || ''} - ${new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })}`
                                                        : new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })
                                                    }
                                                    icon="file"
                                                    onClick={() => handleVerPedido(pedido)}
                                                    flot1={pedido.estado === 'Completado' ? 'Completado' : ''}
                                                    flot2={pedido.estado === 'Entregado' ? 'Entregado' : ''}
                                                    flot3={pedido.estado === 'Pendiente' ? 'Pendiente' : ''}
                                                />
                                            );
                                        })}

                                        {/* Loading debajo del último pedido */}
                                        {isLoadingMore && (
                                            <LoadingSpinner />
                                        )}
                                    </>
                                ) : (
                                    <NoData
                                        icon="shopping-bag"
                                        title={searchQuery ? 'Sin resultados' : 'No hay pedidos'}
                                        detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los pedidos que necesitas' : 'Crea pedidos para comenzar a gestionar tus ventas'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                            </PullToRefresh>
                        )}
                    </>
                )}

            </div>

            {/* Modal para ver pedido */}
            {tipoPedido === 'acopio' ? (
                <VerPedidoAcopio
                    isOpen={isOpenVerPedido}
                    setIsOpen={setIsOpenVerPedido}
                    pedido={infoPedido}
                    onPedidoEliminado={handlePedidoEliminado}
                    onPedidoActualizado={handlePedidoActualizado}
                />
            ) : (
                <VerPedido
                    isOpen={isOpenVerPedido}
                    setIsOpen={setIsOpenVerPedido}
                    pedido={infoPedido}
                    tipoPedido={tipoPedido}
                    onPedidoEliminado={handlePedidoEliminado}
                    onPedidoActualizado={handlePedidoActualizado}
                />
            )}

            {/* Filtro de estado de pedido */}
            <FiltroEstadoPedido
                isOpen={isOpenFiltroEstado}
                setIsOpen={setIsOpenFiltroEstado}
                onEstadoSeleccionado={handleFiltroEstado}
            />

            {/* Filtro de ordenamiento */}
            <FiltroOrdenamiento
                isOpen={isOpenFiltroOrden}
                setIsOpen={setIsOpenFiltroOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
            />

            {/* Filtro de responsable */}
            <FiltroResponsable
                isOpen={isOpenFiltroResponsable}
                setIsOpen={setIsOpenFiltroResponsable}
                onResponsableSeleccionado={handleFiltroResponsable}
                responsableSeleccionado={filtroResponsable}
            />

            {/* Notificación */}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Botón flotante de WhatsApp - solo para pedidos de acopio */}
            {tipoPedido === 'acopio' ? (
                <div style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                    zIndex: 200
                }}>
                    <Select
                        icon="whatsapp"
                        iconOnly={true}
                        options={[
                            { value: 'historial', label: 'Historial', icon: 'history' },
                            { value: 'ultima-entrega', label: 'Última entrega', icon: 'time-five' }
                        ]}
                        onChange={handleWhatsAppSelect}
                        dropdownDirection="right"
                        containerStyle={{ background: 'none' }}
                    />
                </div>
            ) : ''}

            {/* Modal de Historial WhatsApp */}
            <HistorialWhatsapp
                isOpen={isHistorialModalOpen}
                setIsOpen={setIsHistorialModalOpen}
                titulo={historialData.titulo}
                descripcion={historialData.descripcion}
                tipo={historialData.tipo}
                datos={historialData.datos}
            />

            {/* Carga de datos progresiva - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={tipoPedido === 'acopio' ? pedidosAcopioService : pedidosAlmacenService}
                    method="getAll"
                    methodParams={tipoPedido === 'acopio' 
                        ? [
                            getPrimaryNormalizedValue(debouncedSearchQuery),
                            filtroEstado,
                            ordenamiento,
                            filtroResponsable?.id || null
                          ]
                        : [
                            getPrimaryNormalizedValue(debouncedSearchQuery),
                            filtroEstado,
                            ordenamiento,
                            null, // sucuIdParam (se obtiene internamente)
                            filtroResponsable?.id || null
                          ]
                    }
                    serviceName={tipoPedido === 'acopio' ? 'pedidosAcopioService' : 'pedidosAlmacenService'}
                    isOpen={isOpen && ((!pedidosLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
                    page={currentPage}
                    limit={30}
                    onDataLoaded={handleDataLoaded}
                    onDataAccumulated={handleDataAccumulated}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onHasMorePagesChange={handleHasMorePagesChange}
                />
            )}
        </View>
    );
}

export default PanelPedidos;
