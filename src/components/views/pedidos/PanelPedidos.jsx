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
import pedidosAcopioService from '../../../services/pedidosAcopioService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';

function PanelPedidos({ isOpen, setIsOpen, tipoPedido = '' }) {
    // Estados para los modales
    const [isOpenVerPedido, setIsOpenVerPedido] = useState(false);
    const [infoPedido, setInfoPedido] = useState(null);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para los datos
    const [pedidosData, setPedidosData] = useState([]);

    // Estados para filtros y modales
    const [isOpenOrden, setOpenOrden] = useState(false);

    // Estados para filtros
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

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

    // Función para obtener el servicio correcto
    const getService = () => {
        return tipoPedido === 'acopio' ? pedidosAcopioService : pedidosAlmacenService;
    };

    // Función para cargar pedidos
    const cargarPedidos = async (page = 1, isLoadMore = false) => {
        try {
            if (isLoadMore) {
                setLoadingMore(true);
            } else {
                setLoading(true);
                setCurrentPage(1);
            }

            const service = getService();
            const response = await service.getAll(page, 20, null, ordenamiento);

            if (response.success) {
                if (isLoadMore) {
                    setPedidosData(prev => [...prev, ...response.data]);
                } else {
                    setPedidosData(response.data);
                }
                
                setHasMorePages(response.pagination?.hasNextPage || false);
                setCurrentPage(page);
            } else {
                mostrarNotificacion('error', response.message || 'Error al cargar pedidos');
            }
        } catch (error) {
            console.error('Error al cargar pedidos:', error);
            mostrarNotificacion('error', 'Error de conexión');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    };

    // Cargar pedidos al abrir el modal
    useEffect(() => {
        if (isOpen && tipoPedido) {
            cargarPedidos();
        }
    }, [isOpen, tipoPedido]);

    // Búsqueda con debounce
    useEffect(() => {
        if (debouncedSearchQuery) {
            setIsSearching(true);
            // Aquí implementarías la búsqueda específica
            // Por ahora solo recargamos los datos
            cargarPedidos();
        } else if (searchQuery === '') {
            setIsSearching(false);
            cargarPedidos();
        }
    }, [debouncedSearchQuery]);

    // Función para ver un pedido
    const handleVerPedido = (pedido) => {
        setInfoPedido(pedido);
        setIsOpenVerPedido(true);
    };

    // Función para actualizar estado de pedido
    const handleActualizarEstado = async (pedidoId, nuevoEstado) => {
        try {
            const service = getService();
            const response = await service.updateEstado(pedidoId, nuevoEstado);

            if (response.success) {
                mostrarNotificacion('success', 'Estado actualizado correctamente');
                // Recargar la lista
                cargarPedidos();
            } else {
                mostrarNotificacion('error', response.message || 'Error al actualizar estado');
            }
        } catch (error) {
            console.error('Error al actualizar estado:', error);
            mostrarNotificacion('error', 'Error de conexión');
        }
    };

    // Función para manejar cuando se elimina un pedido
    const handlePedidoEliminado = (pedidoId) => {
        setPedidosData(prev => 
            prev.filter(pedido => pedido.id !== pedidoId)
        );
        mostrarNotificacion('success', 'Pedido eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un pedido
    const handlePedidoActualizado = (pedidoActualizado) => {
        setPedidosData(prev => 
            prev.map(pedido => 
                pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido
            )
        );
        mostrarNotificacion('success', 'Pedido actualizado correctamente');
    };

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !loadingMore) {
            cargarPedidos(currentPage + 1, true);
        }
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
        setHasMorePages(true);
        cargarPedidos(1, true);
    };

    // Función para formatear fecha
    const formatearFecha = (fecha) => {
        return new Date(fecha).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
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
            {loading && <LoadingSpinner iconName='box' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Pedidos de {tipoPedido === 'acopio' ? 'Materia Prima' : 'Almacén'}
                </h1>

                {/* Barra de búsqueda */}
                <div className={styles.searchContainer}>
                    <InputSearch
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Buscar pedidos..."
                        loading={isSearching}
                    />
                </div>
                <Filtros options={opciones} />

                {/* Lista de pedidos */}
                <div
                    className={styles.content}
                    onScroll={handleScroll}
                    style={{
                        height: 'calc(100vh - 150px)'
                    }}
                >
                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : pedidosData.length > 0 ? (
                        pedidosData.map((pedido, index) => {
                            return (
                                <ItemView
                                    key={pedido.id || index}
                                    title={pedido.user?.name || pedido.personal?.name || 'Usuario desconocido'}
                                    description={formatearFecha(pedido.fecha || pedido.created_at)}
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
                    {loadingMore && (
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
                onEstadoActualizado={handleActualizarEstado}
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
