import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { normalizeSearchValue, normalizedIncludes, getPrimaryNormalizedValue } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerTransferencia from './VerTransferencia';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import InfoModal from '../../common/InfoModal';
import transferenciasAlmacenService from '../../../services/transferenciasAlmacenService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroEstadoTransferencia from '../../mixed/FiltroEstadoTransferencia';
import NoData from '../../common/NoData';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import { formatCurrency } from '../../../utils/numberUtils';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';
import useProgressiveSessionCache from '../../../hooks/useProgressiveSessionCache';


function PanelTransferencias({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerTransferencia, setIsOpenVerTransferencia] = useState(false);
    const [infoTransferencia, setInfoTransferencia] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [debouncedSearchQuery] = useDebounce(searchQueryNormalized, 500);

    // Estados para loading
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [transferenciasLoaded, setTransferenciasLoaded] = useState(false);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estado para acumular o reemplazar las transferencias mostradas
    const [allTransferencias, setAllTransferencias] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroEstadoNombre, setFiltroEstadoNombre] = useState('Todos los estados');
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');
    const [filtroFecha, setFiltroFecha] = useState({ inicio: null, fin: null });
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
        inicio: filtroFecha?.inicio ? filtroFecha.inicio.toISOString() : null,
        fin: filtroFecha?.fin ? filtroFecha.fin.toISOString() : null
    }), [fechaFinKey, fechaInicioKey]);

    const filterSignature = useMemo(() => JSON.stringify({
        filtroEstado,
        ordenamiento,
        search: debouncedSearchQuery || '',
        fechaInicio: fechaInicioKey,
        fechaFin: fechaFinKey,
    }), [filtroEstado, ordenamiento, debouncedSearchQuery, fechaInicioKey, fechaFinKey]);

    const {
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    } = useProgressiveSessionCache({
        baseKey: 'panelTransferencias',
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

    // Funciones de carga
    const handleTransferenciasLoaded = useCallback((data = []) => {
        setAllTransferencias(data);
        setTransferenciasLoaded(true);
        setError(null);
        persistFirstPage(data);
    }, [persistFirstPage]);

    const handleTransferenciasAccumulated = useCallback((data = []) => {
        if (!Array.isArray(data) || data.length === 0) return;
        setAllTransferencias(prev => {
            const existingIds = new Set(prev.map(t => t.id));
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
            if (allTransferencias.length === 0 && !hasCachedItems) {
                setIsLoading(true);
            }
        } else if (currentPage > 1) {
            setIsLoadingMore(true);
        }

        setActiveRequests(prev => {
            const newCount = prev + 1;
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [allTransferencias.length, currentPage, isLargeScreen, hasCachedItems]);

    const handleLoadingEnd = useCallback(() => {
        if (currentPage === 1) {
            setIsLoading(false);
        } else {
            setIsLoadingMore(false);
        }

        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            if (newCount === 0 && isLargeScreen) {
                setTimeout(() => {
                    setIsRefreshing(false);
                    setTimeout(() => {
                        setShowRefreshIndicator(false);
                    }, 500);
                }, 300);
            }
            return newCount;
        });
    }, [currentPage, isLargeScreen]);

    const handleHasMorePagesChange = useCallback((hasMore) => {
        setHasMorePages(Boolean(hasMore));
    }, []);

    const handleRefresh = () => {
        setAllTransferencias([]);
        setCurrentPage(1);
        setTransferenciasLoaded(false);
        setHasMorePages(false);
    };

    // Funciones para filtros
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        if (estado === null) {
            setFiltroEstadoNombre('Todos los estados');
        } else if (estado === 'Transferido') {
            setFiltroEstadoNombre('Transferidas');
        } else if (estado === 'Finalizado') {
            setFiltroEstadoNombre('Finalizadas');
        } else if (estado === 'Anulado') {
            setFiltroEstadoNombre('Anuladas');
        }
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

    // Función para manejar el click en una transferencia
    const handleRegistro = (transferencia) => {
        setInfoTransferencia(transferencia);
        setIsOpenVerTransferencia(true);
    };

    const handleTransferenciaAnulada = (transferenciaId) => {
        const transferenciaActualizada = allTransferencias.find(t => t.id === transferenciaId);
        if (transferenciaActualizada) {
            handleTransferenciaActualizada({
                ...transferenciaActualizada,
                estado: 'Anulado'
            });
        }
    };

    const handleTransferenciaEliminada = (transferenciaId) => {
        const aplicarEliminacion = (lista) =>
            lista.filter(transferencia => String(transferencia.id) !== String(transferenciaId));

        setAllTransferencias(aplicarEliminacion);
        mutateCachedItems(aplicarEliminacion);
        
        mostrarNotificacion('success', 'Transferencia eliminada correctamente');
    };

    const handleTransferenciaActualizada = (transferenciaActualizada) => {
        const aplicarActualizacion = (lista) =>
            lista.map(transferencia =>
                String(transferencia.id) === String(transferenciaActualizada.id)
                    ? transferenciaActualizada
                    : transferencia
            );

        setAllTransferencias(aplicarActualizacion);
        mutateCachedItems(aplicarActualizacion);
        
        // Actualizar infoTransferencia si es la transferencia que se está viendo
        if (infoTransferencia && String(infoTransferencia.id) === String(transferenciaActualizada.id)) {
            setInfoTransferencia(transferenciaActualizada);
        }
        
        if (transferenciaActualizada.estado === 'Finalizado') {
            mostrarNotificacion('success', 'Transferencia finalizada correctamente');
        } else if (transferenciaActualizada.estado === 'Anulado') {
            mostrarNotificacion('success', 'Transferencia anulada correctamente');
        }
    };

    // Efectos
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
            setFiltroEstado(null);
            setFiltroEstadoNombre('Todos los estados');
            setOrdenamiento('fecha_desc');
            setFiltroFecha({ inicio: null, fin: null });
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
            setActiveRequests(0);
            return;
        }
        if (currentPage === 1 && allTransferencias.length === 0) {
            hydrateFromCache(setAllTransferencias);
        }
    }, [isOpen, currentPage, allTransferencias.length, hydrateFromCache]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (lastFilterSignatureRef.current === filterSignature) {
            return;
        }
        lastFilterSignatureRef.current = filterSignature;
        setAllTransferencias([]);
        setCurrentPage(1);
        setTransferenciasLoaded(false);
        setHasMorePages(false);
    }, [filterSignature, isOpen]);

    useEffect(() => {
        if (error) {
            console.error('Error obteniendo transferencias:', error);
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
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'sucursal_origen', label: 'Origen', icon: 'building' },
        { key: 'sucursal_destino', label: 'Destino', icon: 'building' },
        { key: 'concepto', label: 'Concepto', icon: 'text' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' }
    ];

    // Filtrar transferencias localmente
    const transferenciasFiltradas = allTransferencias.filter(transferencia => {
        const normalizedQuery = searchQueryNormalized || normalizeSearchValue(searchQuery);
        
        const matchesSearch = !normalizedQuery ||
            normalizedIncludes(normalizeSearchValue(transferencia.concepto || ''), normalizedQuery) ||
            normalizedIncludes(normalizeSearchValue(transferencia.sucursal_origen?.name || ''), normalizedQuery) ||
            normalizedIncludes(normalizeSearchValue(transferencia.sucursal_destino?.name || ''), normalizedQuery) ||
            (transferencia.productos && transferencia.productos.some(producto => 
                normalizedIncludes(normalizeSearchValue(producto.producto?.name || ''), normalizedQuery) ||
                normalizedIncludes(normalizeSearchValue(producto.producto?.description || ''), normalizedQuery)
            ));

        const matchesEstado = filtroEstado === null || transferencia.estado === filtroEstado;

        return matchesSearch && matchesEstado;
    }).sort((a, b) => {
        switch (ordenamiento) {
            case 'fecha_desc':
                return new Date(b.fecha) - new Date(a.fecha);
            case 'fecha_asc':
                return new Date(a.fecha) - new Date(b.fecha);
            default:
                return new Date(b.fecha) - new Date(a.fecha);
        }
    });

    // Datos para la tabla
    const tableData = transferenciasFiltradas.map(transferencia => {
        return {
            id: transferencia.id,
            sucursal_origen: transferencia.sucursal_origen?.name || 'Sin origen',
            sucursal_destino: transferencia.sucursal_destino?.name || 'Sin destino',
            concepto: transferencia.concepto || 'Sin concepto',
            fecha: new Date(transferencia.fecha).toLocaleDateString(),
            estado: transferencia.estado === 'Anulado' ? 'Anulado' : transferencia.estado === 'Finalizado' ? 'Finalizado' : 'Transferido'
        };
    });

    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'Transferido': {
                    text: 'Transferido',
                    className: 'warning'
                },
                'Finalizado': {
                    text: 'Finalizado',
                    className: 'info'
                },
                'Anulado': {
                    text: 'Anulado',
                    className: 'error'
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
                searchPlaceholder="Buscar por concepto, sucursal o productos..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title="Transferencias"
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
                                    onRowClick={(transferencia) => {
                                        const transferenciaOriginal = transferenciasFiltradas.find(t => t.id === transferencia.id);
                                        handleRegistro(transferenciaOriginal);
                                    }}
                                    getCellBadge={getCellBadge}
                                    onScroll={handleScroll}
                                    columnWidths={{
                                        sucursal_origen: '20%',
                                        sucursal_destino: '20%',
                                        concepto: '30%',
                                        fecha: '15%',
                                        estado: '15%'
                                    }}
                                />

                                {isLoadingMore && (
                                    <LoadingSpinner />
                                )}
                            </div>
                        ) : (
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Transferencias"
                                containerStyle={{
                                    maxHeight: '100%',
                                    minHeight: '100%'
                                }}
                                onScroll={handleScroll}
                            >
                                {transferenciasFiltradas.length > 0 ? (
                                    <>
                                        {transferenciasFiltradas.map((transferencia, index) => (
                                            <ItemView
                                                key={transferencia.id || index}
                                                title={`${transferencia.sucursal_origen?.name || 'Origen'} → ${transferencia.sucursal_destino?.name || 'Destino'}`}
                                                description={`${transferencia.concepto || 'Sin concepto'} • ${new Date(transferencia.fecha).toLocaleDateString()}`}
                                                icon='transfer'
                                                onClick={() => handleRegistro(transferencia)}
                                                arrow={false}
                                                flot3={transferencia?.estado === 'Anulado' ? 'Anulado' : ''}
                                                flot4={transferencia?.estado === 'Finalizado' ? 'Finalizado' : ''}
                                                flot2={transferencia?.estado === 'Transferido' ? 'Transferido' : ''}
                                            />
                                        ))}

                                        {isLoadingMore && (
                                            <LoadingSpinner />
                                        )}
                                    </>
                                ) : (
                                    <NoData 
                                        icon="transfer"
                                        title={searchQuery || filtroEstado !== null ? 'Sin resultados' : 'No hay transferencias'}
                                        detail={searchQuery || filtroEstado !== null ? 'Intenta ajustar los filtros de búsqueda para encontrar las transferencias que necesitas' : 'Crea transferencias para comenzar a gestionar tus movimientos entre sucursales'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                            </PullToRefresh>
                        )}
                    </>
                )}
            </div>
            
            {/* Modal de ver transferencia*/}
            <VerTransferencia
                isOpen={isOpenVerTransferencia}
                setIsOpen={setIsOpenVerTransferencia}
                transferencia={infoTransferencia}
                onTransferenciaAnulada={handleTransferenciaAnulada}
                onTransferenciaEliminada={handleTransferenciaEliminada}
                onTransferenciaActualizada={handleTransferenciaActualizada}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Filtro de estado de transferencia */}
            <FiltroEstadoTransferencia
                isOpen={isOpenFiltroEstado}
                setIsOpen={setIsOpenFiltroEstado}
                onEstadoSeleccionado={handleFiltroEstado}
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
                    service={transferenciasAlmacenService}
                    method="getAll"
                    methodParams={[
                        filtroEstado,
                        ordenamiento,
                        getPrimaryNormalizedValue(debouncedSearchQuery),
                        filtroFechaPayload
                    ]}
                    serviceName="transferenciasAlmacenService"
                    isOpen={isOpen && ((!transferenciasLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
                    page={currentPage}
                    limit={30}
                    onDataLoaded={handleTransferenciasLoaded}
                    onDataAccumulated={handleTransferenciasAccumulated}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onHasMorePagesChange={handleHasMorePagesChange}
                />
            )}

        </View>

    );
}
export default PanelTransferencias;
