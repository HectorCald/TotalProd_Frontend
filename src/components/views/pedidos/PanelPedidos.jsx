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
import Notification from '../../common/Notification';
import { usePedidosAcopio, usePedidosAlmacen } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';

function PanelPedidos({ isOpen, setIsOpen, tipoPedido = '' }) {
    // Estados para los modales
    const [isOpenVerPedido, setIsOpenVerPedido] = useState(false);
    const [infoPedido, setInfoPedido] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros y modales
    const [isOpenOrden, setOpenOrden] = useState(false);

    // Estados para filtros
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const usePedidosHook = tipoPedido === 'acopio' ? usePedidosAcopio : usePedidosAlmacen;
    const { pedidos, hasMorePages, error, isLoading, refetch } = usePedidosHook(
        isOpen ? debouncedSearchQuery : '', 
        isOpen ? currentPage : 1,
        isOpen,
        ordenamiento
    );

    // Mostrar indicador cuando se ejecuta fetcher (cualquier cambio en isLoading)
    useEffect(() => {
        if (isLoading && isOpen) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        } else if (!isLoading && showRefreshIndicator) {
            // Cuando termina de cargar, mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    }, [isLoading, isOpen, showRefreshIndicator]);

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

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        try {
            await refetch();
            
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

    // Función para actualizar estado de pedido
    const handleActualizarEstado = async (pedidoId, nuevoEstado) => {
        try {
            const service = getService();
            const response = await service.updateEstado(pedidoId, nuevoEstado);

            if (response.success) {
                // Actualizar el cache localmente con el estado actualizado
                refetch((currentData) => {
                    if (!currentData) return currentData;
                    
                    return {
                        ...currentData,
                        data: currentData.data.map(pedido => 
                            pedido.id === pedidoId 
                                ? { ...pedido, estado: nuevoEstado }
                                : pedido
                        )
                    };
                }, { revalidate: false }); // NO revalidar = NO petición al servidor
                
                mostrarNotificacion('success', 'Estado actualizado correctamente');
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
        // Actualizar el cache localmente removiendo el pedido eliminado
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.filter(pedido => pedido.id !== pedidoId)
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        mostrarNotificacion('success', 'Pedido eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un pedido
    const handlePedidoActualizado = (pedidoActualizado) => {
        // Actualizar el cache localmente con el pedido actualizado
        refetch((currentData) => {
            if (!currentData) return currentData;
            
            return {
                ...currentData,
                data: currentData.data.map(pedido => 
                    pedido.id === pedidoActualizado.id ? pedidoActualizado : pedido
                )
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor
        
        mostrarNotificacion('success', 'Pedido actualizado correctamente');
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
                        height: 'calc(100vh - 150px)'
                    }}
                >
                    {pedidos.length > 0 ? (
                        pedidos.map((pedido, index) => {
                            return (
                                <ItemView
                                    key={pedido.id || index}
                                    title={pedido.sucursal?.name || 'Sucursal desconocida'}
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
