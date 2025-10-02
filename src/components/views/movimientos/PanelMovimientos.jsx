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
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FiltroTipoMovimiento from '../../mixed/FiltroTipoMovimiento';
import FiltroEstadoMovimiento from '../../mixed/FiltroEstadoMovimiento';


function PanelMovimientos({ isOpen, setIsOpen, tipoMovimiento = '' }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerMovimiento, setIsOpenVerMovimiento] = useState(false);
    const [infoMovimiento, setInfoMovimiento] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para acumular todos los movimientos de todas las páginas
    const [allMovimientos, setAllMovimientos] = useState([]);
    
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
    const [error, setError] = useState(null);


    // Función para cargar movimientos
    const cargarMovimientos = async (page = 1, search = '', filtro = null, estado = null, orden = 'fecha_desc') => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = tipoMovimiento === 'acopio' 
                ? await movimientosAcopioService.getAll(page, 10, filtro, estado, orden)
                : await movimientosAlmacenService.getAll(page, 10, filtro, estado, orden);
                
            if (response.success) {
                setMovimientos(response.data);
                setHasMorePages(response.pagination?.hasNextPage || false);
            } else {
                setError(response);
            }
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
        }
    };

    // Acumular datos de todas las páginas cuando llegan nuevos movimientos
    useEffect(() => {
        if (movimientos && movimientos.length > 0 && isOpen) {
            if (currentPage === 1) {
                // Si es la primera página, tomar todos los movimientos que vienen del servicio
                setAllMovimientos(movimientos);
            } else {
                // Si es una página posterior, acumular los datos
                setAllMovimientos(prevMovimientos => {
                    // Evitar duplicados por si acaso
                    const existingIds = new Set(prevMovimientos.map(m => m.id));
                    const newMovimientos = movimientos.filter(m => !existingIds.has(m.id));
                    return [...prevMovimientos, ...newMovimientos];
                });
            }
        }
    }, [movimientos, currentPage, isOpen]);

    // Mostrar indicador cuando se ejecuta fetcher (cualquier cambio en isLoading)
    useEffect(() => {
        if (isLoading && isOpen && !showRefreshIndicator) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        } else if (!isLoading && showRefreshIndicator && isOpen) {
            // Cuando termina de cargar, mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    }, [isLoading, isOpen, showRefreshIndicator]);

    // Cargar movimientos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            // Mostrar indicador inmediatamente al abrir
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
            // Cargar primera página
            cargarMovimientos(1, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
        }
    }, [isOpen]);

    // Cargar movimientos cuando cambian los parámetros
    useEffect(() => {
        if (isOpen) {
            cargarMovimientos(currentPage, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
        }
    }, [currentPage, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento]);

    // Limpiar indicador cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

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

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        // Limpiar estado acumulado y resetear página
        setAllMovimientos([]);
        setCurrentPage(1);
        
        try {
            await cargarMovimientos(1, debouncedSearchQuery, filtroTipo, filtroEstado, ordenamiento);
            
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        } catch (error) {
            setIsRefreshing(false);
            setShowRefreshIndicator(false);
        }
    };

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
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

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [isOpen, tipoMovimiento]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllMovimientos([]);
            setCurrentPage(1);
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
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <Filtros options={opciones} />
                <div
                    className={styles.content}
                    onScroll={!isLargeScreen ? handleScroll : undefined}
                    style={{
                        maxHeight: tipoMovimiento === 'acopio' || tipoMovimiento === 'almacen'
                            ? '100%'
                            : ''
                    }}
                >
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
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
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        allMovimientos.length > 0 ? (
                            allMovimientos.map((movimiento, index) => {
                                return (
                                    <ItemView
                                        key={movimiento.id || index}
                                        title={tipoMovimiento === 'acopio' 
                                            ? `${movimiento.product?.name || 'Sin producto'} - ${movimiento.quantity || '0'} ${movimiento.product?.type_measure?.code || ''}`
                                            : movimiento.productos && movimiento.productos.length > 0
                                                ? movimiento.productos.length === 1
                                                    ? `${movimiento.productos[0]?.producto?.name || 'Sin producto'} - ${movimiento.productos[0]?.cantidad || '0'} ud`
                                                    : `${movimiento.productos.length} productos`
                                                : 'Sin productos'
                                        }
                                        description={`${movimiento.observations || 'Sin observaciones'} • ${new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString()}${movimiento.type === 'entrada' && movimiento.proveedor?.name ? ` • ${movimiento.proveedor.name}` : ''}${movimiento.type === 'salida' && movimiento.cliente?.name ? ` • ${movimiento.cliente.name}` : ''}`}
                                        icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                        onClick={() => handleRegistro(movimiento)}
                                        arrow={false}
                                        flot3={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                        flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                                        gris={true}
                                    />
                                );
                            })
                        ) : (
                            <div className={styles.noData}>
                                <p>{searchQuery ? 'No se encontraron movimientos' : 'No hay movimientos registrados'}</p>
                            </div>
                        )
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más movimientos...</p>
                        </div>
                    )}
                </div>
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