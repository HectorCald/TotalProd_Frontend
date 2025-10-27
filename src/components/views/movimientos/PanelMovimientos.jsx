import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
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

// Función helper para normalizar texto (quitar acentos)
const normalizeText = (text) => {
    if (!text) return '';
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Quitar acentos
        .trim();
};

function PanelMovimientos({ isOpen, setIsOpen, tipoMovimiento = '' }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerMovimiento, setIsOpenVerMovimiento] = useState(false);
    const [infoMovimiento, setInfoMovimiento] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
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
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroTipo, setFiltroTipo] = useState(null);
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);


    // Función para cargar movimientos
    const cargarMovimientos = async (page = 1, search = '', filtro = null, estado = null, orden = 'fecha_desc') => {
        // Solo mostrar loading si no hay datos cargados Y es página 1
        if (page === 1 && allMovimientos.length === 0) {
            setIsLoading(true);
        } else if (page > 1) {
            setIsLoadingMore(true);
        }
        setError(null);

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

        // Normalizar el texto de búsqueda (quitar acentos)
        const normalizedSearch = normalizeText(search);

        try {
            const response = tipoMovimiento === 'acopio'
                ? await movimientosAcopioService.getAll(page, 30, filtro, estado, orden, null, normalizedSearch)
                : await movimientosAlmacenService.getAll(page, 30, filtro, estado, orden, null, normalizedSearch);

            if (response.success) {
                const newData = response.data || [];
                setMovimientos(newData);
                setHasMorePages(response.pagination?.hasNextPage || false);

                // Reemplazar o acumular SOLO después de que llega la data
                if (page === 1) {
                    // Si no llegó nada, limpiar; si llegó, reemplazar
                    setAllMovimientos(newData.length > 0 ? newData : []);
                } else {
                    // Paginación: acumular sin borrar lo anterior
                    setAllMovimientos(prev => {
                        // Evitar duplicados por id
                        const existingIds = new Set(prev.map(m => m.id));
                        const merged = [...prev];
                        newData.forEach(item => {
                            if (!existingIds.has(item.id)) merged.push(item);
                        });
                        return merged;
                    });
                }
                
                // Marcar como cargado solo en página 1
                if (page === 1) {
                    setMovimientosLoaded(true);
                }
            } else {
                setError(response);
            }
        } catch (error) {
            setError(error);
        } finally {
            if (page === 1) {
                setIsLoading(false);
            } else {
                setIsLoadingMore(false);
            }
            // Decrementar contador de peticiones activas
            setActiveRequests(prev => {
                const newCount = Math.max(0, prev - 1);
                // Solo ocultar loading y RefreshIndicator cuando no hay peticiones activas
                if (newCount === 0) {
                    if (page === 1) {
                        setIsLoading(false);
                    }
                    if (isLargeScreen) {
                        setTimeout(() => {
                            setIsRefreshing(false);
                            setTimeout(() => {
                                setShowRefreshIndicator(false);
                            }, 500);
                        }, 300);
                    }
                }
                return newCount;
            });
        }
    };

    // Cargar movimientos cuando se abre el modal - solo si no hay datos cargados
    useEffect(() => {
        if (isOpen && !movimientosLoaded) {
            cargarMovimientos(1, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
        }
    }, [isOpen, movimientosLoaded]);

    // Resetear flags cuando se abre el modal (NO los datos)
    useEffect(() => {
        if (isOpen) {
            // Solo resetear flags, NO los datos acumulados
            setMovimientosLoaded(false);
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Cargar movimientos cuando cambia la página (para paginación)
    useEffect(() => {
        if (isOpen && currentPage > 1) {
            cargarMovimientos(currentPage, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
        }
    }, [currentPage]);

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

        // La función cargarMovimientos ya maneja el RefreshIndicator
        await cargarMovimientos(1, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
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

    // Efecto para resetear búsqueda cuando se abre - solo resetear búsqueda, no limpiar datos
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
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
            setMovimientosLoaded(false);
            setCurrentTipoMovimiento(tipoMovimiento);
            // Cargar datos del nuevo tipo si el panel está abierto
            if (isOpen) {
                cargarMovimientos(1, '', null, null, 'fecha_desc');
            }
        }
    }, [tipoMovimiento, currentTipoMovimiento, isOpen]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllMovimientos([]);
            setCurrentPage(1);
            setMovimientosLoaded(false);
            // Cargar movimientos inmediatamente después de limpiar
            cargarMovimientos(1, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
        }
    }, [debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento]);

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo movimientos:', error);
        }
    }, [error]);

    // Función para manejar cuando se anula un movimiento
    const handleMovimientoAnulado = (movimientoId) => {
        // Actualizar el estado local acumulado
        setAllMovimientos(prevMovimientos =>
            prevMovimientos.map(movimiento =>
                movimiento.id === movimientoId
                    ? { ...movimiento, estado: 'anulado' }
                    : movimiento
            )
        );

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
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setIsOpenFiltroOrden(true)
        },
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'producto', label: 'Producto', icon: 'package' },
        { key: 'tipo', label: 'Tipo', icon: 'transfer' },
        { key: 'cantidad', label: 'Cantidad', icon: 'bar-chart-alt-2' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'cliente_proveedor', label: tipoMovimiento === 'acopio' ? 'Proveedor' : 'Cliente', icon: 'user' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' }
    ];

    // Datos para la tabla
    const tableData = allMovimientos.map(movimiento => ({
        id: movimiento.id,
        producto: tipoMovimiento === 'acopio'
            ? movimiento.product?.name || 'Sin producto'
            : movimiento.productos && movimiento.productos.length > 0
                ? movimiento.productos.length === 1
                    ? movimiento.productos[0]?.producto?.name || 'Sin producto'
                    : `${movimiento.productos.length} productos`
                : 'Sin productos',
        tipo: movimiento.type === 'entrada' ? 'Entrada' : 'Salida',
        cantidad: tipoMovimiento === 'acopio'
            ? `${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`
            : movimiento.productos && movimiento.productos.length > 0
                ? movimiento.productos.length === 1
                    ? `${movimiento.productos[0]?.cantidad || '0'} ud`
                    : `${movimiento.productos.length} productos`
                : '0 ud',
        fecha: new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString(),
        cliente_proveedor: tipoMovimiento === 'acopio'
            ? (movimiento.type === 'entrada' ? (movimiento.proveedor?.name || '--') : (movimiento.cliente?.name || '--'))
            : (movimiento.type === 'entrada' ? (movimiento.proveedor?.name || '--') : (movimiento.cliente?.name || '--')),
        estado: movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado'
    }));

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
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title={tipoMovimiento === 'acopio' ? 'Mov. Materia Prima' : 'Mov. Almacén'}
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
                                producto: '25%',
                                tipo: '10%',
                                cantidad: '10%',
                                fecha: '10%',
                                cliente_proveedor: '20%',
                                estado: '15%'
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
                                    return (
                                        <ItemView
                                            key={movimiento.id || index}
                                            title={tipoMovimiento === 'acopio'
                                                ? `${movimiento.product?.name || 'Sin producto'} - ${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`
                                                : movimiento.productos && movimiento.productos.length > 0
                                                    ? movimiento.productos.length === 1
                                                        ? `${movimiento.productos[0]?.producto?.name || 'Sin producto'}`
                                                        : `${movimiento.productos.length} productos`
                                                    : 'Sin productos'
                                            }
                                            description={`${new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString()}${movimiento.type === 'entrada' && movimiento.proveedor?.name ? ` • ${movimiento.proveedor.name}` : ''}${movimiento.type === 'salida' && movimiento.cliente?.name ? ` • ${movimiento.cliente.name}` : ''}`}
                                            icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                            onClick={() => handleRegistro(movimiento)}
                                            arrow={false}
                                            flot3={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                            flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                                            colorIcon={movimiento.type === 'entrada' ? 'verde' : 'rojo'}
                                        />
                                    );
                                })}
                                
                                {/* Loading debajo del último movimiento */}
                                {isLoadingMore && (
                                    <div style={{ 
                                        display: 'flex', 
                                        justifyContent: 'center', 
                                        padding: '20px',
                                        marginTop: '10px'
                                    }}>
                                        <LoadingSpinner />
                                    </div>
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
        </View>

    );
}
export default PanelMovimientos;