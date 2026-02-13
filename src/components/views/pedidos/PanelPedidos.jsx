import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { getPrimaryNormalizedValue } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPedido from './VerPedido';
import VerPedidoAcopio from './VerPedidoAcopio';
import Filtros from '../../common/Filtros';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import NoData from '../../common/NoData';
import { formatCurrency } from '../../../utils/numberUtils';
import FiltroEstadoPedido from '../../mixed/FiltroEstadoPedido';
import FiltroSolicitante from '../../mixed/FiltroSolicitante';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';
import Select from '../../common/Select';
import HistorialWhatsapp from './HistorialWhatsapp';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';
import useProgressiveSessionCache from '../../../hooks/useProgressiveSessionCache';

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
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [isOpenFiltroSolicitante, setIsOpenFiltroSolicitante] = useState(false);
    const [isOpenFiltroFecha, setIsOpenFiltroFecha] = useState(false);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroSolicitante, setFiltroSolicitante] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState({ inicio: null, fin: null });
    const fechaInicioKey = useMemo(
        () => (filtroFecha.inicio ? filtroFecha.inicio.toISOString() : null),
        [filtroFecha.inicio]
    );
    const fechaFinKey = useMemo(
        () => (filtroFecha.fin ? filtroFecha.fin.toISOString() : null),
        [filtroFecha.fin]
    );

    const filterSignature = useMemo(() => JSON.stringify({
        tipoPedido: tipoPedido || 'all',
        filtroEstado,
        filtroSolicitanteUserId: filtroSolicitante?.user_id || null,
        filtroSolicitantePersonalId: filtroSolicitante?.personal_id || null,
        search: debouncedSearchQuery || '',
        fechaInicio: fechaInicioKey,
        fechaFin: fechaFinKey,
    }), [tipoPedido, filtroEstado, filtroSolicitante?.user_id, filtroSolicitante?.personal_id, debouncedSearchQuery, fechaInicioKey, fechaFinKey]);

    const {
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    } = useProgressiveSessionCache({
        baseKey: 'panelPedidos',
        filtersSignature: filterSignature,
        pageSize: 30,
    });

    const lastFilterSignatureRef = useRef(filterSignature);

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
        persistFirstPage(data);
    }, [persistFirstPage]);

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
        if (currentPage === 1) {
            if (allPedidos.length === 0 && !hasCachedItems) {
                setIsLoading(true);
            }
        } else if (currentPage > 1) {
            setIsLoadingMore(true);
        }
        
        setActiveRequests(prev => {
            const newCount = prev + 1;
            if (newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [currentPage, allPedidos.length, hasCachedItems]);

    const handleLoadingEnd = useCallback(() => {
        if (currentPage === 1) {
            setIsLoading(false);
        } else {
            setIsLoadingMore(false);
        }
        
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
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
    }, [currentPage]);

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

    // Hidratar lista inicial desde cache
    useEffect(() => {
        if (!isOpen || currentPage !== 1 || allPedidos.length > 0) {
            return;
        }
        hydrateFromCache(setAllPedidos);
    }, [isOpen, currentPage, allPedidos.length, hydrateFromCache]);

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
            setSearchQuery('');
            setSearchQueryNormalized('');
            setPedidosLoaded(false);
            setCurrentTipoPedido(tipoPedido);
            setFiltroSolicitante(null);
            setFiltroFecha({ inicio: null, fin: null });
            // FetchDataProgressive se encargará de recargar automáticamente
        }
    }, [tipoPedido, currentTipoPedido, isOpen]);

    // Efecto para limpiar datos acumulados SOLO cuando cambian filtros/búsqueda
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (lastFilterSignatureRef.current === filterSignature) {
            return;
        }
        lastFilterSignatureRef.current = filterSignature;
        setAllPedidos([]);
        setCurrentPage(1);
        setPedidosLoaded(false);
    }, [filterSignature, isOpen]);

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
        const aplicarEliminacion = (lista) =>
            lista.filter(pedido => String(pedido.id) !== String(pedidoId));

        setAllPedidos(aplicarEliminacion);
        mutateCachedItems(aplicarEliminacion);

        setIsOpenVerPedido(false);
    };
    // Función para manejar cuando se actualiza un pedido
    const handlePedidoActualizado = (pedidoActualizado) => {
        const aplicarActualizacion = (lista) =>
            lista.map(pedido =>
                String(pedido.id) === String(pedidoActualizado.id) ? pedidoActualizado : pedido
            );

        setAllPedidos(aplicarActualizacion);
        mutateCachedItems(aplicarActualizacion);

        if (infoPedido && infoPedido.id === pedidoActualizado.id) {
            setInfoPedido(pedidoActualizado);
        }
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

    // Función para manejar filtro de solicitante
    const handleFiltroSolicitante = (solicitante) => {
        setFiltroSolicitante(solicitante);
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

    // Función para obtener el nombre del solicitante
    const getSolicitanteNombre = () => {
        if (!filtroSolicitante) return 'Todos los solicitantes';
        return filtroSolicitante.name || 'Solicitante';
    };

    // Función para obtener el nombre del filtro de fecha
    const getFechaNombre = () => formatDateRangeForDisplay(filtroFecha?.inicio, filtroFecha?.fin, 'Fecha');

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
            label: getSolicitanteNombre(),
            active: filtroSolicitante !== null,
            onClick: () => setIsOpenFiltroSolicitante(true)
        },
        {
            label: getFechaNombre(),
            active: Boolean(filtroFecha?.inicio || filtroFecha?.fin),
            onClick: () => setIsOpenFiltroFecha(true)
        },
    ];

    // Headers para la tabla
    const tableHeaders = tipoPedido === 'acopio' ? [
        { key: 'producto', label: 'Producto', icon: 'package' },
        { key: 'usuario', label: 'Solicitante', icon: 'user' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'cantidad', label: 'Cantidad', icon: 'calculator' }
    ] : [
        { key: 'numero_pedido', label: 'Nº', icon: 'hash' },
        { key: 'sucursal', label: 'Sucursal', icon: 'store' },
        { key: 'usuario', label: 'Solicitante', icon: 'user' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'observaciones', label: 'Observaciones', icon: 'file' },
        { key: 'total', label: 'Total', icon: 'dollar-circle' }
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
            // Calcular total del pedido (mismo cálculo que en VerPedido.jsx)
            const total = (pedido.pedido_almacen_detalle || []).reduce((total, detalle) => {
                const precio = detalle.precio || 0;
                const cantidad = detalle.cantidad || 0;
                let subtotal = precio * cantidad;
                // Redondear subtotal solo si el pedido es agrupado
                if (pedido.agrupado && detalle.producto_almacen?.grup) {
                    subtotal = Math.round(subtotal);
                }
                return total + subtotal;
            }, 0);

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
                estado: pedido.estado,
                total: formatCurrency(total)
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
                                        sucursal: '12%',
                                        usuario: '18%',
                                        fecha: '14%',
                                        estado: '10%',
                                        observaciones: '18%',
                                        total: '12%'
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
                                            // Calcular total del pedido para almacén
                                            let totalPedido = 0;
                                            if (tipoPedido !== 'acopio') {
                                                totalPedido = (pedido.pedido_almacen_detalle || []).reduce((total, detalle) => {
                                                    const precio = detalle.precio || 0;
                                                    const cantidad = detalle.cantidad || 0;
                                                    let subtotal = precio * cantidad;
                                                    // Redondear subtotal solo si el pedido es agrupado
                                                    if (pedido.agrupado && detalle.producto_almacen?.grup) {
                                                        subtotal = Math.round(subtotal);
                                                    }
                                                    return total + subtotal;
                                                }, 0);
                                            }

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
                                                        : `${new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                                                            year: 'numeric',
                                                            month: '2-digit',
                                                            day: '2-digit',
                                                            hour: '2-digit',
                                                            minute: '2-digit'
                                                        })} - ${formatCurrency(totalPedido)}`
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

            {/* Filtro de solicitante */}
            <FiltroSolicitante
                isOpen={isOpenFiltroSolicitante}
                setIsOpen={setIsOpenFiltroSolicitante}
                onSolicitanteSeleccionado={handleFiltroSolicitante}
                solicitanteSeleccionado={filtroSolicitante}
                tipoPedido={tipoPedido}
            />

            {/* Filtro de fecha */}
            <FiltroFecha
                isOpen={isOpenFiltroFecha}
                setIsOpen={setIsOpenFiltroFecha}
                startDate={filtroFecha?.inicio}
                endDate={filtroFecha?.fin}
                onApply={(inicio, fin) => {
                    setFiltroFecha({ inicio, fin });
                    setCurrentPage(1);
                }}
                onClear={() => {
                    setFiltroFecha({ inicio: null, fin: null });
                    setCurrentPage(1);
                }}
                title="Filtrar por fecha"
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
                            null, // ordenamiento removido
                            filtroSolicitante?.user_id || filtroSolicitante?.personal_id || null,
                            filtroFecha.inicio || filtroFecha.fin
                                ? {
                                    inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
                                    fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
                                  }
                                : null
                          ]
                        : [
                            getPrimaryNormalizedValue(debouncedSearchQuery),
                            filtroEstado,
                            null, // ordenamiento removido
                            null, // sucuIdParam (se obtiene internamente)
                            filtroSolicitante?.user_id || filtroSolicitante?.personal_id || null,
                            filtroFecha.inicio || filtroFecha.fin
                                ? {
                                    inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
                                    fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
                                  }
                                : null
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
