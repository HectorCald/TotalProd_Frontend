import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { normalizeSearchValue, normalizedIncludes, getPrimaryNormalizedValue } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerCotizacion from './VerCotizacion';
import Filtros from '../../common/Filtros';
import InfoModal from '../../common/InfoModal';
import cotizacionesService from '../../../services/cotizacionesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroEstadoCotizacion from '../../mixed/FiltroEstadoCotizacion';
import NoData from '../../common/NoData';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import { formatCurrency } from '../../../utils/numberUtils';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';
import FiltroCliente from '../../mixed/FiltroCliente';
import useProgressiveSessionCache from '../../../hooks/useProgressiveSessionCache';

// Función de redondeo igual que en movimientos: redondea a la décima más cercana
const redondearADecima = (valor) => {
    if (!Number.isFinite(valor)) return 0;
    // Redondear a la décima más cercana (0.10, 0.20, etc.)
    // Si el segundo decimal es >= 5, redondear hacia arriba, si no hacia abajo
    const multiplicado = valor * 10;
    const decimal = multiplicado % 1;
    const redondeado = decimal >= 0.5 ? Math.ceil(multiplicado) : Math.floor(multiplicado);
    return redondeado / 10;
};


function PanelCotizaciones({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerCotizacion, setIsOpenVerCotizacion] = useState(false);
    const [infoCotizacion, setInfoCotizacion] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [debouncedSearchQuery] = useDebounce(searchQueryNormalized, 500);

    // Estados para loading
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [cotizacionesLoaded, setCotizacionesLoaded] = useState(false);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para acumular o reemplazar las cotizaciones mostradas
    const [allCotizaciones, setAllCotizaciones] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroEstadoNombre, setFiltroEstadoNombre] = useState('Todos los estados');
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');
    const [filtroFecha, setFiltroFecha] = useState({ inicio: null, fin: null });
    const [filtroCliente, setFiltroCliente] = useState(null);
    const fechaInicioKey = useMemo(
        () => (filtroFecha.inicio ? filtroFecha.inicio.toISOString() : null),
        [filtroFecha.inicio]
    );
    const fechaFinKey = useMemo(
        () => (filtroFecha.fin ? filtroFecha.fin.toISOString() : null),
        [filtroFecha.fin]
    );

    const [error, setError] = useState(null);

    const filtroFechaPayload = useMemo(() => ({
        fechaInicio: filtroFecha?.inicio ? filtroFecha.inicio.toISOString() : null,
        fechaFin: filtroFecha?.fin ? filtroFecha.fin.toISOString() : null
    }), [fechaFinKey, fechaInicioKey]);

    const filterSignature = useMemo(() => JSON.stringify({
        filtroEstado,
        ordenamiento,
        filtroClienteId: filtroCliente?.id || null,
        search: debouncedSearchQuery || '',
        fechaInicio: fechaInicioKey,
        fechaFin: fechaFinKey,
    }), [filtroEstado, ordenamiento, filtroCliente?.id, debouncedSearchQuery, fechaInicioKey, fechaFinKey]);

    const {
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    } = useProgressiveSessionCache({
        baseKey: 'panelCotizaciones',
        filtersSignature: filterSignature,
        pageSize: 30,
    });

    const lastFilterSignatureRef = useRef(filterSignature);

    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });

    const [isOpenFiltroFecha, setIsOpenFiltroFecha] = useState(false);
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [isOpenFiltroCliente, setIsOpenFiltroCliente] = useState(false);

    // Funciones de carga
    const handleCotizacionesLoaded = useCallback((data = []) => {
        setAllCotizaciones(data);
        setCotizacionesLoaded(true);
        setError(null);
        persistFirstPage(data);
    }, [persistFirstPage]);

    const handleCotizacionesAccumulated = useCallback((data = []) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setAllCotizaciones(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const merged = [...prev];
            data.forEach(item => {
                if (item && !existingIds.has(item.id)) {
                    merged.push(item);
                }
            });
            return merged;
        });
    }, []);

    const handleError = useCallback((fetchError) => {
        setError(fetchError);
    }, []);

    const handleLoadingStart = useCallback(() => {
        if (currentPage === 1) {
            if (allCotizaciones.length === 0 && !hasCachedItems) {
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
    }, [allCotizaciones.length, currentPage, hasCachedItems]);

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

    const handleHasMorePagesChange = useCallback((hasMore) => {
        setHasMorePages(Boolean(hasMore));
    }, []);

    const handleRefresh = () => {
        setAllCotizaciones([]);
        setCurrentPage(1);
        setCotizacionesLoaded(false);
        setHasMorePages(false);
    };

    // Funciones para filtros
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        if (estado === null) {
            setFiltroEstadoNombre('Todos los estados');
        } else if (estado === 'pendiente') {
            setFiltroEstadoNombre('Pendientes');
        } else if (estado === 'aprobada') {
            setFiltroEstadoNombre('Aprobadas');
        } else if (estado === 'anulado') {
            setFiltroEstadoNombre('Anuladas');
        } else if (estado === 'completado') {
            setFiltroEstadoNombre('Completadas');
        }
        setCurrentPage(1);
    };

    const handleFiltroCliente = (cliente) => {
        setFiltroCliente(cliente);
        setCurrentPage(1);
    };

    // Funciones de búsqueda
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

    // Función para manejar el click en una cotización
    const handleRegistro = (cotizacion) => {
        setInfoCotizacion(cotizacion);
        setIsOpenVerCotizacion(true);
    };

    const handleCotizacionAnulada = (cotizacionId) => {
        const cotizacionActualizada = allCotizaciones.find(c => c.id === cotizacionId);
        if (cotizacionActualizada) {
            handleCotizacionActualizada({
                ...cotizacionActualizada,
                estado: 'anulado'
            });
        }
    };

    const handleCotizacionEliminada = (cotizacionId) => {
        const aplicarEliminacion = (lista) =>
            lista.filter(cotizacion => String(cotizacion.id) !== String(cotizacionId));

        setAllCotizaciones(aplicarEliminacion);
        mutateCachedItems(aplicarEliminacion);
    };

    const handleCotizacionActualizada = (cotizacionActualizada) => {
        const aplicarActualizacion = (lista) =>
            lista.map(cotizacion =>
                String(cotizacion.id) === String(cotizacionActualizada.id)
                    ? cotizacionActualizada
                    : cotizacion
            );

        setAllCotizaciones(aplicarActualizacion);
        mutateCachedItems(aplicarActualizacion);

    };

    // Efectos
    useEffect(() => {
        if (isOpen) {
            setCotizacionesLoaded(false);
            setCurrentPage(1);
            setSearchQuery('');
            setSearchQueryNormalized('');
            setFiltroEstado(null);
            setFiltroEstadoNombre('Todos los estados');
            setOrdenamiento('fecha_desc');
            setFiltroFecha({ inicio: null, fin: null });
            setFiltroCliente(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
            setActiveRequests(0);
            return;
        }
        if (currentPage === 1 && allCotizaciones.length === 0) {
            hydrateFromCache(setAllCotizaciones);
        }
    }, [isOpen, currentPage, allCotizaciones.length, hydrateFromCache]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (lastFilterSignatureRef.current === filterSignature) {
            return;
        }
        lastFilterSignatureRef.current = filterSignature;
        setAllCotizaciones([]);
        setCurrentPage(1);
        setCotizacionesLoaded(false);
        setHasMorePages(false);
    }, [filterSignature, isOpen]);

    useEffect(() => {
        if (error) {
            console.error('Error obteniendo cotizaciones:', error);
        }
    }, [error]);

    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        } else if (!error || error.status !== 403) {
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    }, [error, isOpen]);

    // Helpers para filtros
    const getEstadoNombre = () => filtroEstadoNombre;
    const getFechaNombre = () => formatDateRangeForDisplay(filtroFecha?.inicio, filtroFecha?.fin, 'Fecha');
    const getClienteNombre = () => {
        if (!filtroCliente) return 'Todos los clientes';
        return filtroCliente.name || 'Cliente seleccionado';
    };

    const opciones = [
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setIsOpenFiltroEstado(true)
        },
        {
            label: getFechaNombre(),
            active: Boolean(filtroFecha?.inicio || filtroFecha?.fin),
            onClick: () => setIsOpenFiltroFecha(true)
        },
        {
            label: getClienteNombre(),
            active: filtroCliente !== null,
            onClick: () => setIsOpenFiltroCliente(true)
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'numero_cotizacion', label: 'Nº', icon: 'hash' },
        { key: 'detalle', label: 'Detalle', icon: 'package' },
        { key: 'total', label: 'Total', icon: 'dollar' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' },
        { key: 'metodo_pago', label: 'Método de pago', icon: 'credit-card' }
    ];

    // Filtrar cotizaciones localmente (solo búsqueda, estado y cliente vienen filtrados del backend)
    const cotizacionesFiltradas = allCotizaciones.filter(cotizacion => {
        const normalizedQuery = searchQueryNormalized || normalizeSearchValue(searchQuery);
        
        const matchesSearch = !normalizedQuery ||
            normalizedIncludes(normalizeSearchValue(cotizacion.numero_cotizacion?.toString() || ''), normalizedQuery) ||
            normalizedIncludes(normalizeSearchValue(cotizacion.cliente?.name || ''), normalizedQuery) ||
            normalizedIncludes(normalizeSearchValue(cotizacion.observaciones || ''), normalizedQuery) ||
            (cotizacion.productos && cotizacion.productos.some(producto => 
                normalizedIncludes(normalizeSearchValue(producto.producto?.name || ''), normalizedQuery) ||
                normalizedIncludes(normalizeSearchValue(producto.producto?.description || ''), normalizedQuery)
            ));

        // Estado y cliente ya vienen filtrados del backend, no filtrar localmente
        return matchesSearch;
    }).sort((a, b) => {
        switch (ordenamiento) {
            case 'fecha_desc':
                return new Date(b.fecha) - new Date(a.fecha);
            case 'fecha_asc':
                return new Date(a.fecha) - new Date(b.fecha);
            case 'numero_desc':
                return (b.numero_cotizacion || 0) - (a.numero_cotizacion || 0);
            case 'numero_asc':
                return (a.numero_cotizacion || 0) - (b.numero_cotizacion || 0);
            default:
                return new Date(b.fecha) - new Date(a.fecha);
        }
    });

    // Datos para la tabla
    const tableData = cotizacionesFiltradas.map(cotizacion => {
        let responsable = 'Usuario desconocido';
        if (cotizacion.user) {
            responsable = `${cotizacion.user.first_name || ''} ${cotizacion.user.last_name || ''}`.trim();
        } else if (cotizacion.personal) {
            responsable = `${cotizacion.personal.first_name || ''} ${cotizacion.personal.last_name || ''}`.trim();
        }

        // Determinar el valor de detalle: cliente si existe, sino cantidad de productos
        let detalleValue;
        if (cotizacion.cliente?.name) {
            detalleValue = cotizacion.cliente.name;
        } else if (cotizacion.productos && cotizacion.productos.length > 0) {
            detalleValue = cotizacion.productos.length === 1
                ? cotizacion.productos[0]?.producto?.name || 'Sin producto'
                : `${cotizacion.productos.length} productos`;
        } else {
            detalleValue = 'Sin productos';
        }

        // Calcular total redondeado: sumar subtotales redondeados de productos con grup, luego redondear el total final
        const totalCalculado = (cotizacion.productos || []).reduce((sum, producto) => {
            const subtotal = parseFloat(producto.subtotal) || 0;
            const grup = parseFloat(producto.producto?.grup) || 0;
            const tieneGrup = grup > 0;
            // Redondear subtotal a la décima más cercana si tiene grup
            const subtotalRedondeado = tieneGrup ? redondearADecima(subtotal) : subtotal;
            return sum + subtotalRedondeado;
        }, 0);
        // Redondear el total final a la décima más cercana
        const totalRedondeado = redondearADecima(totalCalculado);

        return {
            id: cotizacion.id,
            numero_cotizacion: cotizacion.numero_cotizacion || 'Sin número',
            detalle: detalleValue,
            total: formatCurrency(totalRedondeado),
            fecha: new Date(cotizacion.fecha).toLocaleDateString(),
            estado: cotizacion.estado === 'anulado' ? 'Anulado' : cotizacion.estado === 'aprobada' ? 'Aprobada' : cotizacion.estado === 'completado' ? 'Completado' : 'Pendiente',
            metodo_pago: cotizacion.metodo_pago || '--',
            responsable: responsable
        };
    });

    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Pendiente': {
                    text: 'Pendiente',
                    className: 'warning'
                },
                'Aprobada': {
                    text: 'Aprobada',
                    className: 'success'
                },
                'Anulado': {
                    text: 'Anulado',
                    className: 'error'
                },
                'Completado': {
                    text: 'Completado',
                    className: 'info'
                },
            };
            
            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }
        
        return null;
    };

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
            setCurrentPage(prev => prev + 1);
        }
    }, [hasMorePages, isLoading, isLoadingMore]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar por número, cliente o productos..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title="Cotizaciones"
            />
            <div className={styles.container}>
                {isLoading ? (
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
                                    onRowClick={(cotizacion) => {
                                        const cotizacionOriginal = cotizacionesFiltradas.find(c => c.id === cotizacion.id);
                                        handleRegistro(cotizacionOriginal);
                                    }}
                                    getCellBadge={getCellBadge}
                                    onScroll={handleScroll}
                                    columnWidths={{
                                        numero_cotizacion: '5%',
                                        detalle: '20%',
                                        total: '15%',
                                        fecha: '15%',
                                        estado: '15%',
                                        metodo_pago: '15%'
                                    }}
                                />

                                {isLoadingMore && (
                                    <LoadingSpinner />
                                )}
                            </div>
                        ) : (
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Cotizaciones"
                                containerStyle={{
                                    maxHeight: '100%',
                                    minHeight: '100%'
                                }}
                                onScroll={handleScroll}
                            >
                                {cotizacionesFiltradas.length > 0 ? (
                                    <>
                                        {cotizacionesFiltradas.map((cotizacion, index) => {
                                            // Determinar el título: cliente si existe, sino cantidad de productos
                                            let tituloDetalle;
                                            if (cotizacion.cliente?.name) {
                                                tituloDetalle = cotizacion.cliente.name;
                                            } else if (cotizacion.productos && cotizacion.productos.length > 0) {
                                                tituloDetalle = cotizacion.productos.length === 1
                                                    ? cotizacion.productos[0]?.producto?.name || 'Sin producto'
                                                    : `${cotizacion.productos.length} productos`;
                                            } else {
                                                tituloDetalle = 'Sin productos';
                                            }
                                            
                                            return (
                                                <ItemView
                                                    key={cotizacion.id || index}
                                                    title={`Cotización #${cotizacion.numero_cotizacion || 'Sin número'} - ${tituloDetalle}`}
                                                    description={`Total: ${formatCurrency(parseFloat(cotizacion.total) || 0)} • ${new Date(cotizacion.fecha).toLocaleDateString()}${cotizacion.metodo_pago ? ` • ${cotizacion.metodo_pago}` : ''}`}
                                                    icon='file'
                                                    onClick={() => handleRegistro(cotizacion)}
                                                    arrow={false}
                                                    flot3={cotizacion?.estado === 'anulado' ? 'Anulado' : ''}
                                                    flot4={cotizacion?.estado === 'aprobada' ? 'Aprobada' : ''}
                                                    flot2={cotizacion?.estado === 'pendiente' ? 'Pendiente' : ''}
                                                    flot5={cotizacion?.estado === 'completado' ? 'Completado' : ''}
                                                />
                                            );
                                        })}

                                        {isLoadingMore && (
                                            <LoadingSpinner />
                                        )}
                                    </>
                                ) : (
                                    <NoData 
                                        icon="file"
                                        title={searchQuery || filtroEstado !== null || filtroCliente !== null ? 'Sin resultados' : 'No hay cotizaciones'}
                                        detail={searchQuery || filtroEstado !== null || filtroCliente !== null ? 'Intenta ajustar los filtros de búsqueda para encontrar las cotizaciones que necesitas' : 'Crea cotizaciones para comenzar a gestionar tus presupuestos'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                            </PullToRefresh>
                        )}
                    </>
                )}
            </div>
            
            {/* Modal de ver cotización*/}
            <VerCotizacion
                isOpen={isOpenVerCotizacion}
                setIsOpen={setIsOpenVerCotizacion}
                cotizacion={infoCotizacion}
                onCotizacionAnulada={handleCotizacionAnulada}
                onCotizacionEliminada={handleCotizacionEliminada}
                onCotizacionActualizada={handleCotizacionActualizada}
            />

            {/* Filtro de estado de cotización */}
            <FiltroEstadoCotizacion
                isOpen={isOpenFiltroEstado}
                setIsOpen={setIsOpenFiltroEstado}
                onEstadoSeleccionado={handleFiltroEstado}
            />

            <FiltroCliente
                isOpen={isOpenFiltroCliente}
                setIsOpen={setIsOpenFiltroCliente}
                onClienteSeleccionado={handleFiltroCliente}
                clienteSeleccionado={filtroCliente}
            />

            <FiltroFecha
                isOpen={isOpenFiltroFecha}
                setIsOpen={setIsOpenFiltroFecha}
                startDate={filtroFecha?.inicio}
                endDate={filtroFecha?.fin}
                onApply={(inicio, fin) => setFiltroFecha({ inicio, fin })}
                onClear={() => setFiltroFecha({ inicio: null, fin: null })}
                title="Filtrar por fecha"
                defaultToToday={false}
            />

            {/* Modal de Información */}
            <InfoModal
                isOpen={modalConfig.isOpen}
                setIsOpen={(modalIsOpen) => setModalConfig(prev => ({ ...prev, isOpen: modalIsOpen }))}
                type={modalConfig.type}
                title={modalConfig.title}
                description={modalConfig.description}
                showButton={modalConfig.showButton}
                buttonText="Aceptar"
                onButtonClick={() => setIsOpen(false)}
            />

            {/* Carga de datos progresiva - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={cotizacionesService}
                    method="getAll"
                    methodParams={[
                        filtroEstado,
                        ordenamiento,
                        filtroCliente?.id || null,
                        getPrimaryNormalizedValue(debouncedSearchQuery),
                        filtroFechaPayload
                    ]}
                    serviceName="cotizacionesService"
                    isOpen={isOpen && ((!cotizacionesLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
                    page={currentPage}
                    limit={30}
                    onDataLoaded={handleCotizacionesLoaded}
                    onDataAccumulated={handleCotizacionesAccumulated}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onHasMorePagesChange={handleHasMorePagesChange}
                />
            )}

        </View>

    );
}
export default PanelCotizaciones;
