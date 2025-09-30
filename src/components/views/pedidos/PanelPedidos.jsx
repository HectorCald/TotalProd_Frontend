import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerPedido from './VerPedido';
import VerPedidoAcopio from './VerPedidoAcopio';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FiltroEstadoPedido from '../../mixed/FiltroEstadoPedido';

function PanelPedidos({ isOpen, setIsOpen, tipoPedido = '' }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modal de ver pedido
    const [isOpenVerPedido, setIsOpenVerPedido] = useState(false);
    const [infoPedido, setInfoPedido] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    

    // Estado para acumular todos los pedidos de todas las páginas
    const [allPedidos, setAllPedidos] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros y modales
    const [isOpenFiltroOrden, setIsOpenFiltroOrden] = useState(false);
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para pedidos
    const [pedidos, setPedidos] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    // Función para cargar pedidos
    const cargarPedidos = async (page = 1, search = '', estado = null, orden = 'fecha_desc') => {
        setIsLoading(true);
        setError(null);
        
        try {
            const response = tipoPedido === 'acopio' 
                ? await pedidosAcopioService.getAll(page, 10, search, estado, orden)
                : await pedidosAlmacenService.getAll(page, 10, search, estado, orden);
                
            if (response.success) {
                setPedidos(response.data);
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

    // Acumular datos de todas las páginas cuando llegan nuevos pedidos
    useEffect(() => {
        if (pedidos && pedidos.length > 0 && isOpen) {
            if (currentPage === 1) {
                // Si es la primera página, tomar todos los pedidos que vienen del servicio
                setAllPedidos(pedidos);
            } else {
                // Si es una página posterior, acumular los datos
                setAllPedidos(prevPedidos => {
                    // Evitar duplicados por si acaso
                    const existingIds = new Set(prevPedidos.map(p => p.id));
                    const newPedidos = pedidos.filter(p => !existingIds.has(p.id));
                    return [...prevPedidos, ...newPedidos];
                });
            }
        }
    }, [pedidos, currentPage, isOpen]);

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


    // Cargar pedidos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            // Mostrar indicador inmediatamente al abrir
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
            // Cargar primera página
            cargarPedidos(1, debouncedSearchQuery, filtroEstado, ordenamiento);
        }
    }, [isOpen]);

    // Cargar pedidos cuando cambian los parámetros
    useEffect(() => {
        if (isOpen) {
            cargarPedidos(currentPage, debouncedSearchQuery, filtroEstado, ordenamiento);
        }
    }, [currentPage, debouncedSearchQuery, filtroEstado, ordenamiento]);

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
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        // Limpiar estado acumulado y resetear página
        setAllPedidos([]);
        setCurrentPage(1);
        
        try {
            await cargarPedidos(1, debouncedSearchQuery, filtroEstado, ordenamiento);
            
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

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [isOpen, tipoPedido]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllPedidos([]);
            setCurrentPage(1);
        }
    }, [debouncedSearchQuery, filtroEstado, ordenamiento]);

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
        
        mostrarNotificacion('success', 'Pedido actualizado correctamente');
        setIsOpenVerPedido(false);
    };



    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
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
        { key: 'sucursal', label: 'Sucursal', icon: 'store' },
        { key: 'usuario', label: 'Usuario', icon: 'user' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'tipo_precio', label: 'Tipo de Precio', icon: 'dollar-sign' }
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
                sucursal: pedido.sucursal?.name || 'Sucursal desconocida',
                usuario: pedido.user?.name || 'Usuario desconocido',
                fecha: new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                tipo_precio: pedido.precio?.name || 'Precio desconocido',
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
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
            />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        {tipoPedido === 'acopio' ? 'Pedidos de Materia Prima' : 'Pedidos de Almacén'}
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <Filtros options={opciones} />

                {/* Lista de pedidos */}
                <div
                    className={styles.content}
                    onScroll={!isLargeScreen ? handleScroll : undefined}
                    style={{
                        maxHeight: tipoPedido === 'acopio' || tipoPedido === 'almacen'
                            ? '100%'
                            : ''
                    }}
                >
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(pedido) => {
                                // Buscar el pedido original sin formatear
                                const pedidoOriginal = allPedidos.find(p => p.id === pedido.id);
                                handleVerPedido(pedidoOriginal);
                            }}
                            getCellBadge={getCellBadge}
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        allPedidos.length > 0 ? (
                            allPedidos.map((pedido, index) => {
                                return (
                                    <ItemView
                                        key={pedido.id || index}
                                        title={tipoPedido === 'acopio' 
                                            ? (pedido.producto_acopio?.name || 'Producto desconocido')
                                            : (pedido.sucursal?.name || 'Sucursal desconocida')
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
                                        flot1={pedido.estado === 'Completado' ? 'Completado' :''}
                                        flot2={pedido.estado === 'Entregado' ? 'Entregado' :''}
                                        flot3={pedido.estado === 'Pendiente' ? 'Pendiente' :''}
                                    />
                                );
                            })
                        ) : (
                            <div className={styles.noData}>
                                <p>{searchQuery ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}</p>
                            </div>
                        )
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más pedidos...</p>
                        </div>
                    )}
                </div>
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

            {/* Notificación */}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default PanelPedidos;
