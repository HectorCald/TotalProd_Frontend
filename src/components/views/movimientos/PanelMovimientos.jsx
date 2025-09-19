import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerMovimiento from './VerMovimiento';
import Filtros from '../../common/Filtros';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';
import { useMovimientosAcopio, useMovimientosAlmacen } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';


function PanelMovimientos({ isOpen, setIsOpen, tipoMovimiento = '' }) {
    // Estados para los modales
    const [isOpenVerMovimiento, setIsOpenVerMovimiento] = useState(false);
    const [infoMovimiento, setInfoMovimiento] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
    // Estado para acumular todos los movimientos de todas las páginas
    const [allMovimientos, setAllMovimientos] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroTipo, setFiltroTipo] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const useMovimientosHook = tipoMovimiento === 'acopio' ? useMovimientosAcopio : useMovimientosAlmacen;
    const { movimientos, hasMorePages, error, isLoading, refetch } = useMovimientosHook(
        isOpen ? debouncedSearchQuery : '', 
        isOpen ? currentPage : 1,
        isOpen,
        filtroTipo,
        ordenamiento
    );

    // Acumular datos de todas las páginas cuando llegan nuevos movimientos
    useEffect(() => {
        if (movimientos && movimientos.length > 0 && isOpen) {
            if (currentPage === 1) {
                // Si es la primera página, solo tomar los primeros 10
                const primeros10 = movimientos.slice(0, 10);
                setAllMovimientos(primeros10);
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

    // Efecto para inicializar datos cuando se abre el modal - SOLO los primeros 10
    useEffect(() => {
        if (isOpen && movimientos && movimientos.length > 0 && allMovimientos.length === 0 && currentPage === 1) {
            // Solo tomar los primeros 10 movimientos del cache
            const primeros10 = movimientos.slice(0, 10);
            setAllMovimientos(primeros10);
        }
    }, [isOpen, movimientos, allMovimientos.length, currentPage]);

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

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    // Estados para filtros y modales
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isOpenTipo, setOpenTipo] = useState(false);

    // Función para manejar el click en un movimiento
    const handleRegistro = (movimiento) => {
        setInfoMovimiento(movimiento);
        setIsOpenVerMovimiento(true);
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

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
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
    }, [debouncedSearchQuery, filtroTipo, ordenamiento]);

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
        // Actualizar el estado local acumulado removiendo el movimiento eliminado
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
            onClick: () => setOpenTipo(true)
        },
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
                        Movimientos
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
                    {tipoMovimiento === 'acopio' 
                        ? 'Materia Prima' 
                        : 'Almacén General'
                    }
                </p>
                <div className={styles.searchContainer}>
                    <InputSearch
                        placeholder='Buscar movimiento'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <Filtros options={opciones} />
                <div
                    className={styles.content}
                    onScroll={handleScroll}
                    style={{
                        minHeight: 'calc(100vh - 250px)',
                    }}
                >
                    {allMovimientos.length > 0 ? (
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
                                    description={`${movimiento.observations || 'Sin observaciones'} • ${new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString()}${movimiento.tipo === 'entrada' && movimiento.proveedor?.name ? ` • ${movimiento.proveedor.name}` : ''}${movimiento.tipo === 'salida' && movimiento.cliente?.name ? ` • ${movimiento.cliente.name}` : ''}`}
                                    icon={movimiento.tipo === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                    onClick={() => handleRegistro(movimiento)}
                                    arrow={false}
                                    flot2={movimiento?.estado === 'anulado' ? 'Anulado' : ''}
                                    flot1={movimiento?.estado === 'anulado' ? '' : 'Finalizado'}
                                />
                            );
                        })
                    ) : (
                        <div className={styles.noData}>
                            <p>{searchQuery ? 'No se encontraron movimientos' : 'No hay movimientos registrados'}</p>
                        </div>
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
            <VerMovimiento
                isOpen={isOpenVerMovimiento}
                setIsOpen={setIsOpenVerMovimiento}
                movimiento={infoMovimiento}
                tipoMovimiento={tipoMovimiento}
                onMovimientoAnulado={handleMovimientoAnulado}
                onMovimientoEliminado={handleMovimientoEliminado}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de filtro de tipo*/}
            <ViewModal isOpen={isOpenTipo} setIsOpen={setOpenTipo}>
                <HeaderModal
                    title="Tipo de Movimiento"
                    onClose={() => setOpenTipo(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona el tipo de movimiento a mostrar</p>
                    <ItemLine
                        title='Todos los tipos'
                        icon='list-ul'
                        onClick={() => {
                            handleFiltroTipo(null);
                            setOpenTipo(false);
                        }}
                    />
                    <ItemLine
                        title='Entradas'
                        icon='plus-circle'
                        onClick={() => {
                            handleFiltroTipo('entrada');
                            setOpenTipo(false);
                        }}
                    />
                    <ItemLine
                        title='Salidas'
                        icon='minus-circle'
                        onClick={() => {
                            handleFiltroTipo('salida');
                            setOpenTipo(false);
                        }}
                    />
                </div>
            </ViewModal>

            {/* Modal de ordenamiento*/}
            <ViewModal isOpen={isOpenOrden} setIsOpen={setOpenOrden}>
                <HeaderModal
                    title="Ordenamiento"
                    onClose={() => setOpenOrden(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para ordenar los movimientos</p>
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
                        title='Tipo A-Z'
                        icon='sort-a-z'
                        onClick={() => {
                            handleOrdenamiento('tipo_asc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Tipo Z-A'
                        icon='sort-z-a'
                        onClick={() => {
                            handleOrdenamiento('tipo_desc');
                            setOpenOrden(false);
                        }}
                    />
                </div>
            </ViewModal>
        </View>

    );
}
export default PanelMovimientos;