import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../../styles/Inicial.module.css';
import HeaderView, { getPrimaryNormalizedValue } from '../../../common/HeaderView';
import View from '../../../ui/View';
import ItemView from '../../../common/ItemView';
import VerMiProduccion from './VerMiProduccion';
import Filtros from '../../../common/Filtros';
import Notification from '../../../common/Notification';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';
import RefreshIndicator from '../../../common/RefreshIndicator';
import { useLayout } from '../../../../context/LayoutContext';
import Table from '../../../common/Table';
import FiltroOrdenamiento from '../../../mixed/FiltroOrdenamiento';
import FiltroEstados from '../../../mixed/FiltroEstados';
import NoData from '../../../common/NoData';
import LoadingSpinner from '../../../common/LoadingSpinner';
import PullToRefresh from '../../../common/PullToRefresh';
import FetchDataProgressive from '../../../mixed/FetchDataProgressive';
import useProgressiveSessionCache from '../../../../hooks/useProgressiveSessionCache';

function MiProduccion({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerMiProduccion, setIsOpenVerMiProduccion] = useState(false);
    const [infoProduccion, setInfoProduccion] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para acumular todos los registros de todas las páginas
    const [allRegistros, setAllRegistros] = useState([]);
    
    // Estados para rastrear qué datos se han cargado
    const [registrosLoaded, setRegistrosLoaded] = useState(false);

    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQueryNormalized, 500);

    // Estados para filtros (sin filtro de responsable)
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    const filterSignature = useMemo(() => JSON.stringify({
        filtroEstado,
        ordenamiento,
        search: debouncedSearchQuery || '',
    }), [filtroEstado, ordenamiento, debouncedSearchQuery]);

    const {
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    } = useProgressiveSessionCache({
        baseKey: 'miProduccion',
        filtersSignature: filterSignature,
        pageSize: 30,
    });

    // Estados para registros
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Callbacks para FetchDataProgressive
    const handleDataLoaded = useCallback((data) => {
        // Para página 1: reemplazar datos
        setAllRegistros(data.length > 0 ? data : []);
        setRegistrosLoaded(true);
        persistFirstPage(data);
    }, [persistFirstPage]);

    const handleDataAccumulated = useCallback((data) => {
        // Para páginas > 1: acumular datos
        setAllRegistros(prev => {
            const existingIds = new Set(prev.map(r => r.id));
            const merged = [...prev];
            data.forEach(item => {
                if (!existingIds.has(item.id)) merged.push(item);
            });
            return merged;
        });
    }, []);

    const handleLoadingStart = useCallback(() => {
        if (currentPage === 1) {
            if (allRegistros.length === 0 && !hasCachedItems) {
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
    }, [currentPage, allRegistros.length, hasCachedItems]);

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
            setRegistrosLoaded(false);
            setCurrentPage(1);
        }
    }, [isOpen]);

    const lastFilterSignatureRef = useRef(filterSignature);

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
    const [isOpenFiltroEstados, setIsOpenFiltroEstados] = useState(false);

    // Función para manejar el click en un registro
    const handleRegistro = (registro) => {
        setInfoProduccion(registro);
        setIsOpenVerMiProduccion(true);
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        // Limpiar estado acumulado y resetear página
        setAllRegistros([]);
        setCurrentPage(1);
        setRegistrosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
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

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || currentPage !== 1 || allRegistros.length > 0) {
            return;
        }
        hydrateFromCache(setAllRegistros);
    }, [isOpen, currentPage, allRegistros.length, hydrateFromCache]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (lastFilterSignatureRef.current === filterSignature) {
            return;
        }
        lastFilterSignatureRef.current = filterSignature;
        setAllRegistros([]);
        setCurrentPage(1);
        setRegistrosLoaded(false);
    }, [filterSignature, isOpen]);

    // Efecto para manejar errores
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo mis registros de producción:', error);
        }
    }, [error]);

    // Función para obtener el nombre del filtro de estado
    const getEstadoNombre = () => {
        if (filtroEstado === null) return 'Todos los estados';
        if (filtroEstado === 'pendiente') return 'Pendientes';
        if (filtroEstado === 'verificado') return 'Verificados';
        if (filtroEstado === 'Ingresado') return 'Ingresados';
        return 'Todos los estados';
    };

    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'fecha_desc': 'Más recientes',
            'fecha_asc': 'Más antiguos'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const opciones = [
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setIsOpenFiltroOrden(true)
        },
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstados(true)
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'producto', label: 'Producto', icon: 'package' },
        { key: 'lote', label: 'Lote', icon: 'hash' },
        { key: 'proceso', label: 'Proceso', icon: 'cog' },
        { key: 'terminados', label: 'Terminados', icon: 'check-circle' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' }
    ];

    // Datos para la tabla
    const tableData = allRegistros.map(registro => ({
        id: registro.id,
        producto: registro.producto_almacen?.name || 'Sin producto',
        lote: registro.lote || '0',
        proceso: registro.proceso === 'cernido' ? 'Cernido' :
            registro.proceso === 'seleccionado' ? 'Seleccionado' :
                registro.proceso === 'ninguno' ? 'Ninguno' : registro.proceso,
        terminados: `${registro.terminados || '0'} ud`,
        fecha: new Date(registro.fecha).toLocaleDateString(),
        estado: registro.estado === 'pendiente' ? 'Pendiente' :
            registro.estado === 'verificado' ? 'Verificado' :
                registro.estado === 'Ingresado' ? 'Ingresado' : registro.estado
    }));

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Pendiente': {
                    text: 'Pendiente',
                    className: 'error' // amarillo
                },
                'Verificado': {
                    text: 'Verificado',
                    className: 'success' // verde
                },
                'Ingresado': {
                    text: 'Ingresado',
                    className: 'info' // azul
                },
            };

            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }

        if (headerKey === 'proceso') {
            const proceso = item.proceso;
            const badgeConfig = {
                'Cernido': {
                    text: 'Cernido',
                    className: 'info' // azul
                },
                'Seleccionado': {
                    text: 'Seleccionado',
                    className: 'info' // verde
                },
                'Ninguno': {
                    text: 'Ninguno',
                    className: 'info' // gris
                },
            };

            return badgeConfig[proceso] || {
                text: proceso,
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
                searchPlaceholder="Buscar mis registros..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title="Mi Producción"
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
                            maxHeight: '100%'
                        }}
                    >
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(registro) => {
                                // Buscar el registro original sin formatear
                                const registroOriginal = allRegistros.find(r => r.id === registro.id);
                                handleRegistro(registroOriginal);
                            }}
                            getCellBadge={getCellBadge}
                            onScroll={handleScroll}
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
                        screenName="Mi Producción"
                        containerStyle={{
                            maxHeight: '100%',
                            minHeight: '100%'
                        }}
                        onScroll={handleScroll}
                    >
                        {allRegistros.length > 0 ? (
                            <>
                                {allRegistros.map((registro, index) => {
                                    return (
                                        <ItemView
                                            key={registro.id || index}
                                            title={registro.producto_almacen?.name || 'Sin producto'}
                                            description={`${registro.terminados || '0'} terminados • ${new Date(registro.fecha).toLocaleDateString()} • ${registro.proceso === 'cernido' ? 'Cernido' : registro.proceso === 'seleccionado' ? 'Seleccionado' : registro.proceso === 'ninguno' ? 'Ninguno' : registro.proceso}`}
                                            icon="package"
                                            onClick={() => handleRegistro(registro)}
                                            arrow={false}
                                            flot1={registro?.estado === 'verificado' ? 'Verificado' : registro?.estado === 'Ingresado' ? 'Ingresado' : ''}
                                            flot3={registro?.estado === 'pendiente' ? 'Pendiente' : ''}
                                            gris={true}
                                        />
                                    );
                                })}
                                
                                {/* Loading debajo del último registro */}
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
                                icon="file"
                                title={searchQuery ? 'Sin resultados' : 'No hay registros de producción'}
                                detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los registros de producción que necesitas' : 'Registra registros de producción para comenzar a gestionar tu producción'}
                                transparent={true}
                                minHeight="200px"
                            />
                        )}
                        </PullToRefresh>
                    )}
                    </>
                )}
            </div>

            {/* Modal de ver registro de producción */}
            <VerMiProduccion
                isOpen={isOpenVerMiProduccion}
                setIsOpen={setIsOpenVerMiProduccion}
                registro={infoProduccion}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Filtro de ordenamiento */}
            <FiltroOrdenamiento
                isOpen={isOpenFiltroOrden}
                setIsOpen={setIsOpenFiltroOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
            />

            {/* Filtro de estados */}
            <FiltroEstados
                isOpen={isOpenFiltroEstados}
                setIsOpen={setIsOpenFiltroEstados}
                onEstadoSeleccionado={setFiltroEstado}
                estadoSeleccionado={filtroEstado}
            />

            {/* Carga de datos progresiva - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={registrosProduccionDamabravaService}
                    method="getByUser"
                    methodParams={[
                        filtroEstado,
                        ordenamiento,
                        getPrimaryNormalizedValue(debouncedSearchQuery)
                    ]}
                    serviceName="registrosProduccionDamabravaService"
                    isOpen={isOpen && ((!registrosLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
                    page={currentPage}
                    limit={10}
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

export default MiProduccion;
