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


function PanelMovimientos({ isOpen, setIsOpen, tipoMovimiento = '' }) {
    // Estados para los modales
    const [isOpenVerMovimiento, setIsOpenVerMovimiento] = useState(false);
    const [infoMovimiento, setInfoMovimiento] = useState(null);

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
    const [movimientosData, setMovimientosData] = useState([]);

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

    // Estados para filtros
    const [filtroTipo, setFiltroTipo] = useState(null); // null = todos, 'entrada', 'salida'
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Función para manejar el click en un movimiento
    const handleRegistro = (movimiento) => {
        setInfoMovimiento(movimiento);
        setIsOpenVerMovimiento(true);
    };


    // Función para obtener los movimientos
    const fetchMovimientos = async (page = 1, reset = true, isSearch = false, tipoOverride = null, ordenamientoOverride = null) => {
        try {
            if (reset) {
                if (isSearch) {
                    setIsSearching(true);
                } else {
                    setLoading(true);
                }
            } else {
                setLoadingMore(true);
            }

            // Usar override si se proporciona, sino usar el estado
            const tipoToUse = tipoOverride !== undefined ? tipoOverride : filtroTipo;
            const ordenamientoToUse = ordenamientoOverride !== undefined ? ordenamientoOverride : ordenamiento;

            let response;
            if (tipoMovimiento === 'acopio') {
                response = await movimientosAcopioService.getAll(page, 20, tipoToUse, ordenamientoToUse);
            } else if (tipoMovimiento === 'almacen') {
                response = await movimientosAlmacenService.getAll(page, 20, tipoToUse, ordenamientoToUse);
            } else {
                return;
            }

            if (response.success && response.data) {
                if (reset) {
                    setMovimientosData(response.data);
                } else {
                    setMovimientosData(prev => [...prev, ...response.data]);
                }

                setCurrentPage(page);
                setHasMorePages(response.pagination?.hasNextPage || false);

            } else {
                console.log('Respuesta del servidor:', response);
            }
        } catch (error) {
            console.error('Error obteniendo movimientos:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setIsSearching(false);
        }
    };

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !loadingMore) {
            fetchMovimientos(currentPage + 1, false);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchMovimientos(1, true, true, null, null); // isSearch = true
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchMovimientos(1, true, false, null, orden);
    };

    // Función para manejar filtro de tipo
    const handleFiltroTipo = (tipo) => {
        setFiltroTipo(tipo);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchMovimientos(1, true, false, tipo, null);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen, tipoMovimiento]);

    // Efecto único para cargar datos y búsqueda
    useEffect(() => {
        if (isOpen) {
            console.log('PanelMovimientos - Cargando datos');
            // Asegurar que el modal esté cerrado al abrir el componente
            setCurrentPage(1);
            setHasMorePages(true);
            
            // Si hay búsqueda, buscar; si no, cargar todos
            if (debouncedSearchQuery) {
                handleSearch(debouncedSearchQuery);
            } else {
                fetchMovimientos(1, true, false, filtroTipo, ordenamiento);
            }
        }
    }, [isOpen, tipoMovimiento, debouncedSearchQuery]);

    // Función para manejar cuando se anula un movimiento
    const handleMovimientoAnulado = (movimientoId) => {
        setMovimientosData(prev => 
            prev.map(movimiento => 
                movimiento.id === movimientoId 
                    ? { ...movimiento, estado: 'anulado' }
                    : movimiento
            )
        );
        mostrarNotificacion('success', 'Movimiento anulado correctamente');
    };

    // Función para manejar cuando se elimina un movimiento
    const handleMovimientoEliminado = (movimientoId) => {
        setMovimientosData(prev => 
            prev.filter(movimiento => movimiento.id !== movimientoId)
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
            {loading && <LoadingSpinner iconName='box' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {tipoMovimiento === 'acopio' ? 'Materia Prima' : 'Almacén General'}
                </h1>
                <p className={styles.subTitle}>
                    {tipoMovimiento === 'acopio' 
                        ? 'Administra los movimientos de materia prima' 
                        : 'Administra los movimientos del almacén general'
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
                        height: 'calc(100vh - 150px)'
                    }}
                >
                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : movimientosData.length > 0 ? (
                        movimientosData.map((movimiento, index) => {
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
                                    description={
                                        <div>
                                            <div>{movimiento.observations || 'Sin observaciones'}</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                {new Date(tipoMovimiento === 'acopio' ? movimiento.date : movimiento.fecha).toLocaleDateString()}
                                                {movimiento.type === 'entrada' && movimiento.proveedor?.name && ` • ${movimiento.proveedor.name}`}
                                                {movimiento.type === 'salida' && movimiento.cliente?.name && ` • ${movimiento.cliente.name}`}
                                            </div>
                                        </div>
                                    }
                                    icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
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
                    {loadingMore && (
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