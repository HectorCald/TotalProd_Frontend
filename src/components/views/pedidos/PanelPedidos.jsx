import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerPedido from './VerPedido';
import Filtros from '../../common/Filtros';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import Notification from '../../common/Notification';
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

function PanelPedidos({ isOpen, setIsOpen, tipoPedido = '' }) {
    // Estados para los modal de ver pedido
    const [isOpenVerPedido, setIsOpenVerPedido] = useState(false);
    const [infoPedido, setInfoPedido] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    

    // Estado para acumular todos los pedidos de todas las páginas
    const [allPedidos, setAllPedidos] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros y modales
    const [isOpenOrden, setOpenOrden] = useState(false);

    // Estados para filtros
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para pedidos
    const [pedidos, setPedidos] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);


    // Función para cargar pedidos
    const cargarPedidos = async (page = 1, search = '', orden = 'fecha_desc') => {
        console.log('cargando pedidos');
        setIsLoading(true);
        setError(null);
        
        try {
            const response = tipoPedido === 'acopio' 
                ? await pedidosAcopioService.getAll(page, 10, search, orden)
                : await pedidosAlmacenService.getAll(page, 10, search, orden);
                
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
            cargarPedidos(1, debouncedSearchQuery, ordenamiento);
        }
    }, [isOpen]);

    // Cargar pedidos cuando cambian los parámetros
    useEffect(() => {
        if (isOpen) {
            cargarPedidos(currentPage, debouncedSearchQuery, ordenamiento);
        }
    }, [currentPage, debouncedSearchQuery, ordenamiento]);

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
        
        try {
            await cargarPedidos(currentPage, debouncedSearchQuery, ordenamiento);
            
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

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllPedidos([]);
            setCurrentPage(1);
        }
    }, [debouncedSearchQuery, ordenamiento]);

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

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
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

    const opciones = [
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setOpenOrden(true)
        },
    ];

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        Pedidos
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <p className={styles.subTitle}>
                    {tipoPedido === 'acopio' 
                        ? 'Materia Prima' 
                        : 'Almacén General'
                    }
                </p>
                {/* Barra de búsqueda */}
                <div className={styles.searchContainer}>
                <InputSearch
                        placeholder='Buscar pedidos...'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <Filtros options={opciones} />

                {/* Lista de pedidos */}
                <div
                    className={styles.content}
                    onScroll={handleScroll}
                    style={{
                        minHeight: 'calc(100vh - 250px)',
                    }}
                >
                    {allPedidos.length > 0 ? (
                        allPedidos.map((pedido, index) => {
                            return (
                                <ItemView
                                    key={pedido.id || index}
                                    title={pedido.sucursal?.name || 'Sucursal desconocida'}
                                    description={new Date(pedido.fecha || pedido.created_at).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: '2-digit',
                                        day: '2-digit',
                                        hour: '2-digit',
                                        minute: '2-digit'
                                    })}
                                    icon="file"
                                    onClick={() => handleVerPedido(pedido)}
                                    flot1={pedido.estado}
                                />
                            );
                        })
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontraron pedidos' : 'No hay pedidos registrados'}</p>
                        </div>
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
            <VerPedido
                isOpen={isOpenVerPedido}
                setIsOpen={setIsOpenVerPedido}
                pedido={infoPedido}
                tipoPedido={tipoPedido}
                onPedidoEliminado={handlePedidoEliminado}
                onPedidoActualizado={handlePedidoActualizado}
            />

            {/* Modal de ordenamiento*/}
            <ViewModal isOpen={isOpenOrden} setIsOpen={setOpenOrden}>
                <HeaderModal
                    title="Ordenamiento"
                    onClose={() => setOpenOrden(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para ordenar los pedidos</p>
                    <ItemLine
                        title='Más recientes'
                        icon='time'
                        onClick={() => {
                            handleOrdenamiento('fecha_desc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Más antiguos'
                        icon='time-five'
                        onClick={() => {
                            handleOrdenamiento('fecha_asc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Estado A-Z'
                        icon='sort-a-z'
                        onClick={() => {
                            handleOrdenamiento('estado_asc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Estado Z-A'
                        icon='sort-z-a'
                        onClick={() => {
                            handleOrdenamiento('estado_desc');
                            setOpenOrden(false);
                        }}
                    />
                </div>
            </ViewModal>

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
