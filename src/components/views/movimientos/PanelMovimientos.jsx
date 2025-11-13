import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { getPrimaryNormalizedValue } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerMovimiento from './VerMovimiento';
import VerMovimientoAcopio from './VerMovimientoAcopio';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import NoData from '../../common/NoData';
import FiltroTipoMovimiento from '../../mixed/FiltroTipoMovimiento';
import FiltroEstadoMovimiento from '../../mixed/FiltroEstadoMovimiento';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import FiltroCliente from '../../mixed/FiltroCliente';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';
import { formatCurrency } from '../../../utils/numberUtils';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';

function PanelMovimientos({ isOpen, setIsOpen, tipoMovimiento = '' }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerMovimiento, setIsOpenVerMovimiento] = useState(false);
    const [infoMovimiento, setInfoMovimiento] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para loading
    const [isLoadingMovimientos, setIsLoadingMovimientos] = useState(false);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para acumular o reemplazar los movimientos mostrados
    const [allMovimientos, setAllMovimientos] = useState([]);
    const [currentTipoMovimiento, setCurrentTipoMovimiento] = useState(tipoMovimiento);

    // Estados para rastrear qué datos se han cargado
    const [movimientosLoaded, setMovimientosLoaded] = useState(false);

    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQueryNormalized, 500);

    // Estados para filtros
    const [filtroTipo, setFiltroTipo] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');
    const [filtroCliente, setFiltroCliente] = useState(null);
    const [filtroFecha, setFiltroFecha] = useState({ inicio: null, fin: null });
    const fechaInicioKey = useMemo(
        () => (filtroFecha.inicio ? filtroFecha.inicio.toISOString() : null),
        [filtroFecha.inicio]
    );
    const fechaFinKey = useMemo(
        () => (filtroFecha.fin ? filtroFecha.fin.toISOString() : null),
        [filtroFecha.fin]
    );

    // Estados para movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Callbacks para FetchDataProgressive
    const handleDataLoaded = useCallback((data) => {
        // Para página 1: reemplazar datos
        setAllMovimientos(data.length > 0 ? data : []);
        setMovimientosLoaded(true);
    }, []);

    const handleDataAccumulated = useCallback((data) => {
        // Para páginas > 1: acumular datos
        setAllMovimientos(prev => {
            const existingIds = new Set(prev.map(m => m.id));
            const merged = [...prev];
            data.forEach(item => {
                if (!existingIds.has(item.id)) merged.push(item);
            });
            return merged;
        });
    }, []);

    const handleLoadingStart = () => {
        if (currentPage === 1 && allMovimientos.length === 0) {
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
    };

    const handleLoadingEnd = () => {
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
    };

    const handleError = (err) => {
        setError(err);
    };

    const handleHasMorePagesChange = (hasMore) => {
        setHasMorePages(hasMore);
    };

    // Resetear flags cuando se abre el modal (NO los datos)
    useEffect(() => {
        if (isOpen) {
            setMovimientosLoaded(false);
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
        setAllMovimientos([]);
        setCurrentPage(1);
        setMovimientosLoaded(false);
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

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Estados para filtros y modales
    const [isOpenFiltroOrden, setIsOpenFiltroOrden] = useState(false);
    const [isOpenFiltroTipo, setIsOpenFiltroTipo] = useState(false);
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [isOpenFiltroCliente, setIsOpenFiltroCliente] = useState(false);
    const [isOpenFiltroFecha, setIsOpenFiltroFecha] = useState(false);

    // Función para manejar el click en un movimiento
    const handleRegistro = (movimiento) => {
        setInfoMovimiento(movimiento);
        setIsOpenVerMovimiento(true);
    };


    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
    };

    // Función para manejar filtro de tipo
    const handleFiltroTipo = (tipo) => {
        setFiltroTipo(tipo);
        setCurrentPage(1);
    };

    // Función para manejar filtro de estado
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        setCurrentPage(1);
    };

    // Función para manejar filtro de cliente
    const handleFiltroCliente = (cliente) => {
        setFiltroCliente(cliente);
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

    // Efecto para resetear búsqueda cuando se abre - solo resetear búsqueda, no limpiar datos
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
        }
    }, [isOpen]);

    // Efecto para limpiar datos SOLO cuando cambia el tipo de movimiento
    useEffect(() => {
        if (tipoMovimiento !== currentTipoMovimiento) {
            setAllMovimientos([]);
            setCurrentPage(1);
            setFiltroTipo(null);
            setFiltroEstado(null);
            setOrdenamiento('fecha_desc');
            setSearchQuery('');
            setSearchQueryNormalized('');
            setFiltroCliente(null);
            setMovimientosLoaded(false);
            setCurrentTipoMovimiento(tipoMovimiento);
            // FetchDataProgressive se encargará de recargar automáticamente
        }
    }, [tipoMovimiento, currentTipoMovimiento, isOpen]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllMovimientos([]);
            setCurrentPage(1);
            setMovimientosLoaded(false);
            // FetchDataProgressive se encargará de recargar automáticamente
        }
    }, [debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento, filtroCliente, fechaInicioKey, fechaFinKey, isOpen]);

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo movimientos:', error);
        }
    }, [error]);

    // Función para manejar cuando se anula un movimiento
    const handleMovimientoAnulado = (movimientoId, salidasEliminadasIds = []) => {
        // Normalizar IDs a string para comparación
        const salidasIdsNormalizados = salidasEliminadasIds.map(id => String(id));
        
        // Actualizar el estado local acumulado
        setAllMovimientos(prevMovimientos => {
            // Primero eliminar las salidas relacionadas si existen
            let movimientosFiltrados = prevMovimientos;
            if (salidasIdsNormalizados && salidasIdsNormalizados.length > 0) {
                movimientosFiltrados = prevMovimientos.filter(movimiento => {
                    const movimientoIdStr = String(movimiento.id);
                    return !salidasIdsNormalizados.includes(movimientoIdStr);
                });
            }
            
            // Luego actualizar el estado del movimiento anulado
            return movimientosFiltrados.map(movimiento =>
                String(movimiento.id) === String(movimientoId)
                    ? { ...movimiento, estado: 'anulado' }
                    : movimiento
            );
        });

        mostrarNotificacion('success', 'Movimiento anulado correctamente');
    };

    // Función para manejar cuando se elimina un movimiento
    const handleMovimientoEliminado = (movimientoId) => {
        // Actualizar el estado local acumulado
        setAllMovimientos(prevMovimientos =>
            prevMovimientos.filter(movimiento => movimiento.id !== movimientoId)
        );

        mostrarNotificacion('success', 'Movimiento eliminado correctamente');
    };

    const handleMovimientoEditado = () => {
        handleRefresh();
        mostrarNotificacion('success', 'Movimiento actualizado correctamente');
    };

    // Función para obtener el nombre del tipo de filtro
    const getTipoNombre = () => {
        if (filtroTipo === null) return 'Todos los tipos';
        if (filtroTipo === 'entrada') return 'Entradas';
        if (filtroTipo === 'salida') return 'Salidas';
        return 'Todos los tipos';
    };

    // Función para obtener el nombre del filtro de estado
    const getEstadoNombre = () => {
        if (filtroEstado === null) return 'Todos los estados';
        if (filtroEstado === 'finalizado') return 'Finalizados';
        if (filtroEstado === 'anulado') return 'Anulados';
        return 'Todos los estados';
    };

    // Función para obtener el nombre del filtro de cliente
    const getClienteNombre = () => {
        if (!filtroCliente) return 'Todos los clientes';
        return filtroCliente.name || 'Cliente seleccionado';
    };

    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'fecha_desc': 'Más recientes',
            'fecha_asc': 'Más antiguos',
            'tipo_asc': 'Tipo A-Z',
            'tipo_desc': 'Tipo Z-A'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const getFechaNombre = () => formatDateRangeForDisplay(filtroFecha?.inicio, filtroFecha?.fin, 'Fecha');

    const opciones = [
        {
            label: getTipoNombre(),
            active: filtroTipo !== null,
            onClick: () => setIsOpenFiltroTipo(true)
        },
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstado(true)
        },
        {
            label: getFechaNombre(),
            active: Boolean(filtroFecha?.inicio || filtroFecha?.fin),
            onClick: () => setIsOpenFiltroFecha(true)
        }
    ];

    if (tipoMovimiento !== 'acopio') {
        opciones.push({
            label: getClienteNombre(),
            active: filtroCliente !== null,
            onClick: () => setIsOpenFiltroCliente(true)
        });
    }

    opciones.push({
        label: getOrdenamientoNombre(),
        active: ordenamiento !== 'fecha_desc',
        onClick: () => setIsOpenFiltroOrden(true)
    });

    const obtenerNumeroOrdenFormateado = (numeroOrden) => {
        if (numeroOrden === null || numeroOrden === undefined) {
            return '--';
        }
        if (typeof numeroOrden === 'string' && numeroOrden.trim() === '') {
            return '--';
        }
        const numero = Number(numeroOrden);
        if (Number.isNaN(numero) || numero === 0) {
            return '--';
        }
        return String(numeroOrden);
    };

    const obtenerTotalFormateado = (movimiento) => {
        if (tipoMovimiento === 'acopio') {
            const candidatosTotales = [
                movimiento.total,
                movimiento.total_general,
                movimiento.total_calculado
            ];
            const totalAcopio = candidatosTotales
                .map((valor) => {
                    const numero = parseFloat(valor);
                    return Number.isNaN(numero) ? null : numero;
                })
                .find((numero) => numero !== null);
            if (typeof totalAcopio === 'number') {
                return formatCurrency(totalAcopio);
            }
            const quantity = parseFloat(movimiento.quantity) || 0;
            const price =
                parseFloat(movimiento.product?.precio) ||
                parseFloat(movimiento.product?.price) ||
                0;
            const subtotal = quantity * price;
            return formatCurrency(subtotal);
        }

        const subtotal = (movimiento.productos || []).reduce(
            (sum, producto) => sum + (parseFloat(producto.subtotal) || 0),
            0
        );
        const descuento = parseFloat(movimiento.descuento) || 0;
        const aumento = parseFloat(movimiento.aumento) || 0;
        const totalMovimiento = subtotal - descuento + aumento;
        return formatCurrency(totalMovimiento);
    };

    // Headers para la tabla
    const tableHeaders = [
        { key: 'numero_orden', label: 'Nº', icon: 'hash' },
        { key: 'producto', label: 'Detalle', icon: 'package' },
        { key: 'tipo', label: 'Tipo', icon: 'transfer' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'cliente_proveedor', label: tipoMovimiento === 'acopio' ? 'Proveedor' : 'Cliente', icon: 'user' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'total', label: 'Total', icon: 'dollar-circle' }
    ];

    // Datos para la tabla
    const tableData = allMovimientos.map(movimiento => {
        // Para tipo almacen, mostrar concepto si existe, sino mostrar cantidad/productos
        let productoValue;
        if (tipoMovimiento === 'acopio') {
            productoValue = movimiento.product?.name || 'Sin producto';
        } else {
            // Si tiene concepto, mostrarlo; sino mostrar cantidad/productos como antes
            if (movimiento.concepto && movimiento.concepto.trim() !== '') {
                productoValue = movimiento.concepto;
            } else if (movimiento.productos && movimiento.productos.length > 0) {
                productoValue = movimiento.productos.length === 1
                    ? movimiento.productos[0]?.producto?.name || 'Sin producto'
                    : `${movimiento.productos.length} productos`;
            } else {
                productoValue = 'Sin productos';
            }
        }
        
        return {
            id: movimiento.id,
            numero_orden: obtenerNumeroOrdenFormateado(movimiento.numero_orden),
            producto: productoValue,
            tipo: movimiento.type === 'entrada' ? 'Entrada' : 'Salida',
            fecha: new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString(),
            cliente_proveedor: tipoMovimiento === 'acopio'
                ? (movimiento.type === 'entrada' ? (movimiento.proveedor?.name || '--') : (movimiento.cliente?.name || '--'))
                : (movimiento.type === 'entrada' ? (movimiento.proveedor?.name || '--') : (movimiento.cliente?.name || '--')),
            estado: movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado',
            total: obtenerTotalFormateado(movimiento)
        };
    });

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Finalizado': {
                    text: 'Finalizado',
                    className: 'info' // verde
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

        if (headerKey === 'tipo') {
            const tipo = item.tipo;
            const badgeConfig = {
                'Entrada': {
                    text: 'Entrada',
                    className: 'success' // verde
                },
                'Salida': {
                    text: 'Salida',
                    className: 'error' // rojo
                },
            };

            return badgeConfig[tipo] || {
                text: tipo,
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
                searchPlaceholder="Buscar movimientos..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title={tipoMovimiento === 'acopio' ? 'Movimientos Materia Prima' : 'Movimientos Almacén'}
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
                                onScroll={handleScroll}
                                style={{
                                    maxHeight: tipoMovimiento === 'acopio' || tipoMovimiento === 'almacen'
                                        ? '100%'
                                        : ''
                                }}
                            >
                                <Table
                                    headers={tableHeaders}
                                    data={tableData}
                                    onRowClick={(movimiento) => {
                                        // Buscar el movimiento original sin formatear
                                        const movimientoOriginal = allMovimientos.find(m => m.id === movimiento.id);
                                        handleRegistro(movimientoOriginal);
                                    }}
                                    getCellBadge={getCellBadge}
                                    onScroll={handleScroll}
                                    columnWidths={{
                                        numero_orden: '5%',
                                        producto: '25%',
                                        tipo: '10%',
                                        fecha: '10%',
                                        cliente_proveedor: '20%',
                                        estado: '12%',
                                        total: '13%'
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
                                screenName="Movimientos"
                                containerStyle={{
                                    maxHeight: '100%',
                                    minHeight: '100%'
                                }}
                                onScroll={handleScroll}
                            >
                                {allMovimientos.length > 0 ? (
                                    <>
                                        {allMovimientos.map((movimiento, index) => {
                                            const numeroOrdenFormateado = obtenerNumeroOrdenFormateado(movimiento?.numero_orden);
                                            const numeroOrdenLabel = numeroOrdenFormateado !== '--'
                                                ? `Nº ${numeroOrdenFormateado}`
                                                : '';
                                            const totalLabel = obtenerTotalFormateado(movimiento);
                                            return (
                                                <ItemView
                                                    key={movimiento.id || index}
                                                    title={tipoMovimiento === 'acopio'
                                                        ? `${movimiento.product?.name || 'Sin producto'} - ${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`
                                                        : (movimiento.concepto && movimiento.concepto.trim() !== '')
                                                            ? movimiento.concepto
                                                            : (movimiento.productos && movimiento.productos.length > 0
                                                                ? movimiento.productos.length === 1
                                                                    ? `${movimiento.productos[0]?.producto?.name || 'Sin producto'}`
                                                                    : `${movimiento.productos.length} productos`
                                                                : 'Sin productos')
                                                    }
                                                    description={`${new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString()}${movimiento.type === 'entrada' && movimiento.proveedor?.name ? ` • ${movimiento.proveedor.name}` : ''}${movimiento.type === 'salida' && movimiento.cliente?.name ? ` • ${movimiento.cliente.name}` : ''}`}
                                                    description2={`Total: ${totalLabel}`}
                                                    icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                                    onClick={() => handleRegistro(movimiento)}
                                                    arrow={false}
                                                    flot3={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                                    flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                                                    flot2={numeroOrdenLabel}
                                                    colorIcon={movimiento.type === 'entrada' ? 'verde' : 'rojo'}
                                                />
                                            );
                                        })}

                                        {/* Loading debajo del último movimiento */}
                                        {isLoadingMore && (

                                            <LoadingSpinner />

                                        )}
                                    </>
                                ) : (
                                    <NoData
                                        icon="transfer"
                                        title={searchQuery ? 'Sin resultados' : 'No hay movimientos'}
                                        detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los movimientos que necesitas' : 'Realiza movimientos de inventario para comenzar a gestionar tu stock'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                            </PullToRefresh>
                        )}
                    </>
                )}

            </div>

            {/* Modal de ver movimiento*/}
            {tipoMovimiento === 'acopio' ? (
                <VerMovimientoAcopio
                    isOpen={isOpenVerMovimiento}
                    setIsOpen={setIsOpenVerMovimiento}
                    movimiento={infoMovimiento}
                    onMovimientoAnulado={handleMovimientoAnulado}
                    onMovimientoEliminado={handleMovimientoEliminado}
                />
            ) : (
                <VerMovimiento
                    isOpen={isOpenVerMovimiento}
                    setIsOpen={setIsOpenVerMovimiento}
                    movimiento={infoMovimiento}
                    onMovimientoAnulado={handleMovimientoAnulado}
                    onMovimientoEliminado={handleMovimientoEliminado}
                    onMovimientoEditado={handleMovimientoEditado}
                />
            )}

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Filtro de tipo de movimiento */}
            <FiltroTipoMovimiento
                isOpen={isOpenFiltroTipo}
                setIsOpen={setIsOpenFiltroTipo}
                onTipoSeleccionado={handleFiltroTipo}
            />

            {/* Filtro de clientes */}
            {tipoMovimiento !== 'acopio' && (
                <FiltroCliente
                    isOpen={isOpenFiltroCliente}
                    setIsOpen={setIsOpenFiltroCliente}
                    onClienteSeleccionado={handleFiltroCliente}
                    clienteSeleccionado={filtroCliente}
                />
            )}

            {/* Filtro de estado de movimiento */}
            <FiltroEstadoMovimiento
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

            {/* Filtro de fecha */}
            <FiltroFecha
                isOpen={isOpenFiltroFecha}
                setIsOpen={setIsOpenFiltroFecha}
                startDate={filtroFecha?.inicio}
                endDate={filtroFecha?.fin}
                onApply={(inicio, fin) => setFiltroFecha({ inicio, fin })}
                onClear={() => setFiltroFecha({ inicio: null, fin: null })}
                title="Filtrar por fecha"
            />

            {/* Carga de datos progresiva - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={tipoMovimiento === 'acopio' ? movimientosAcopioService : movimientosAlmacenService}
                    method="getAll"
                    methodParams={[
                        filtroTipo,
                        filtroEstado,
                        ordenamiento,
                        tipoMovimiento === 'acopio' ? null : (filtroCliente?.id || null),
                        null, // sucuIdParam (se obtiene internamente)
                        getPrimaryNormalizedValue(debouncedSearchQuery),
                        filtroFecha.inicio || filtroFecha.fin
                            ? {
                                inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
                                fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
                            }
                            : null
                    ]}
                    serviceName={tipoMovimiento === 'acopio' ? 'movimientosAcopioService' : 'movimientosAlmacenService'}
                    isOpen={isOpen && ((!movimientosLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
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
export default PanelMovimientos;