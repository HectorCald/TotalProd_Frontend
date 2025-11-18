import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../../../styles/Inicial.module.css';
import View from '../../../../ui/View';
import HeaderView from '../../../../common/HeaderView';
import Table from '../../../../common/Table';
import ItemView from '../../../../common/ItemView';
import PullToRefresh from '../../../../common/PullToRefresh';
import Boton from '../../../../common/Boton';
import Notification from '../../../../common/Notification';
import NoData from '../../../../common/NoData';
import LoadingSpinner from '../../../../common/LoadingSpinner';
import Filtros from '../../../../common/Filtros';
import RefreshIndicator from '../../../../common/RefreshIndicator';
import FiltroEstadoPago from '../../../../mixed/FiltroEstadoPago';
import FiltroResponsable from '../../../../mixed/FiltroResponsable';
import FetchDataProgressive from '../../../../mixed/FetchDataProgressive';
import { useLayout } from '../../../../../context/LayoutContext';
import pagosDamabravaService from '../../../../../services/pagosDamabravaService';
import reglasProduccionDamabravaService from '../../../../../services/reglasProduccionDamabravaService';
import VerPago from './VerPago';
import RegistroPago from './RegistroPago';
import { parseDateWithoutOffset } from '../../../../../utils/dateUtils';
import useProgressiveSessionCache from '../../../../../hooks/useProgressiveSessionCache';

const normalizarTexto = (value = '') =>
    value
        ? value
            .toString()
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[-_/]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
        : '';

const formatFechaCorta = (value) => {
    const date = parseDateWithoutOffset(value);
    return date ? date.toLocaleDateString('es-BO') : '--';
};

const PanelPagos = ({ isOpen, setIsOpen }) => {
    const { isLargeScreen } = useLayout();
    const [pagos, setPagos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchNormalized, setSearchNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const [isVerPagoOpen, setIsVerPagoOpen] = useState(false);
    const [selectedPago, setSelectedPago] = useState(null);
    const [isRegistroPagoOpen, setIsRegistroPagoOpen] = useState(false);
    const [reglasProduccion, setReglasProduccion] = useState([]);
    const [reglasLoaded, setReglasLoaded] = useState(false);
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroResponsable, setFiltroResponsable] = useState(null);
    const [isOpenFiltroEstado, setIsOpenFiltroEstado] = useState(false);
    const [isOpenFiltroResponsable, setIsOpenFiltroResponsable] = useState(false);
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);
    const [pagosLoaded, setPagosLoaded] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const pagosRef = useRef([]);
    const PAGE_LIMIT = 30;
    const [debouncedSearchNormalized] = useDebounce(searchNormalized, 500);

    const filterSignature = useMemo(() => JSON.stringify({
        filtroEstado,
        filtroResponsableId: filtroResponsable?.id || null,
        search: debouncedSearchNormalized || '',
    }), [filtroEstado, filtroResponsable?.id, debouncedSearchNormalized]);

    const lastFilterSignatureRef = useRef(filterSignature);

    const {
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    } = useProgressiveSessionCache({
        baseKey: 'panelPagos',
        filtersSignature: filterSignature,
        pageSize: PAGE_LIMIT,
    });

    const mostrarNotificacion = (type, text) => {
        setNotification({
            isVisible: true,
            type,
            text
        });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const sortPagos = useCallback((lista = []) => {
        return [...lista].sort((a, b) => {
            const fechaA = new Date(a?.fecha || a?.fecha_fin || a?.fecha_inicio || 0).getTime();
            const fechaB = new Date(b?.fecha || b?.fecha_fin || b?.fecha_inicio || 0).getTime();
            return fechaB - fechaA;
        });
    }, []);

    // Callbacks para FetchDataProgressive
    const handleDataLoaded = useCallback((data) => {
        const ordenados = sortPagos(data);
        setPagos(ordenados);
        pagosRef.current = ordenados;
        setPagosLoaded(true);
        persistFirstPage(ordenados);
    }, [sortPagos, persistFirstPage]);

    const handleDataAccumulated = useCallback((data) => {
        setPagos(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const combined = [...prev];
            data.forEach(item => {
                if (!existingIds.has(item.id)) {
                    combined.push(item);
                }
            });
            const ordenados = sortPagos(combined);
            pagosRef.current = ordenados;
            return ordenados;
        });
    }, [sortPagos]);

    const handleLoadingStart = useCallback(() => {
        if (currentPage === 1) {
            if (pagosRef.current.length === 0 && !hasCachedItems) {
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
    }, [currentPage, hasCachedItems]);

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
        mostrarNotificacion('error', err.message || 'Error al obtener los pagos.');
        setHasMorePages(false);
        if (currentPage === 1) {
            setPagosLoaded(true);
        }
    }, [currentPage, mostrarNotificacion]);

    const handleHasMorePagesChange = useCallback((hasMore) => {
        setHasMorePages(hasMore);
    }, []);

    // Wrapper para el servicio que convierte parámetros a objeto
    const pagosServiceWrapper = useMemo(() => ({
        getAll: async (page, limit) => {
            const searchParam = debouncedSearchNormalized ? debouncedSearchNormalized.split('|')[0] : '';
            return await pagosDamabravaService.getAll({
                page,
                limit,
                estado: filtroEstado || 'todos',
                responsableId: filtroResponsable?.id || null,
                search: searchParam || ''
            });
        }
    }), [debouncedSearchNormalized, filtroEstado, filtroResponsable]);

    const fetchReglas = useCallback(async () => {
        if (reglasLoaded) return;
        try {
            const response = await reglasProduccionDamabravaService.getAll();
            if (response.success) {
                setReglasProduccion(response.data || []);
                setReglasLoaded(true);
            }
        } catch (err) {
            console.error('Error cargando reglas de producción:', err);
        }
    }, [reglasLoaded]);

    useEffect(() => {
        if (isOpen) {
            fetchReglas();
        }
    }, [isOpen, fetchReglas]);

    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (lastFilterSignatureRef.current === filterSignature) {
            return;
        }
        lastFilterSignatureRef.current = filterSignature;
        setPagos([]);
        pagosRef.current = [];
        setCurrentPage(1);
        setHasMorePages(false);
        setPagosLoaded(false);
    }, [filterSignature, isOpen]);

    useEffect(() => {
        pagosRef.current = pagos;
    }, [pagos]);

    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
            return;
        }
        if (currentPage === 1 && pagosRef.current.length === 0) {
            hydrateFromCache((cached) => {
                const ordenados = sortPagos(cached);
                setPagos(ordenados);
                pagosRef.current = ordenados;
            });
        }
    }, [isOpen, currentPage, hydrateFromCache, sortPagos]);

    const pagosFiltrados = useMemo(() => {
        if (!debouncedSearchNormalized) {
            return pagos;
        }

        const variants = debouncedSearchNormalized
            .split('|')
            .map((variant) => normalizarTexto(variant))
            .filter(Boolean);

        if (variants.length === 0) {
            return pagos;
        }

        return pagos.filter((pago) => {
            const responsable = normalizarTexto(pago?.responsable?.name || '');
            const periodo = normalizarTexto(
                `${formatFechaCorta(pago.fecha_inicio)} ${formatFechaCorta(pago.fecha_fin)}`
            );
            const estado = normalizarTexto(pago?.estado || '');
            const total = normalizarTexto(pago?.total || '');
            const registradoPor = normalizarTexto(pago?.registrado_por?.name || pago?.personal?.name || pago?.user?.name || '');
            const productos = Array.isArray(pago?.registros)
                ? pago.registros.map((registro) => normalizarTexto(registro?.producto_almacen?.name || '')).join(' ')
                : '';

            const texto = `${responsable} ${periodo} ${estado} ${total} ${registradoPor} ${productos}`.trim();
            return variants.some((variant) => texto.includes(variant));
        });
    }, [pagos, debouncedSearchNormalized]);

    const tableHeaders = [
        { key: 'responsable', label: 'Beneficiario', icon: 'user' },
        { key: 'registradoPor', label: 'Registrado por', icon: 'id-card' },
        { key: 'periodo', label: 'Periodo', icon: 'calendar' },
        { key: 'total', label: 'Total', icon: 'money' },
        { key: 'estado', label: 'Estado', icon: 'check-circle' }
    ];

    const tableData = useMemo(() => {
        return pagosFiltrados.map((pago) => {
            const responsable = pago?.responsable?.name || 'Sin responsable';
            const periodo = `${formatFechaCorta(pago.fecha_inicio)} - ${formatFechaCorta(pago.fecha_fin)}`;
            const total = Number(pago.total || 0).toLocaleString('es-BO', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
            });
            const estado = pago.estado === 'pagado' ? 'Pagado' : 'Pendiente';
            const registradoPor = pago?.registrado_por?.name || pago?.personal?.name || pago?.user?.name || 'Sin registrar';
            return {
                id: pago.id,
                responsable,
                registradoPor,
                periodo,
                total: `Bs. ${total}`,
                estado
            };
        });
    }, [pagosFiltrados]);

    const handleFiltroEstado = useCallback((estado) => {
        setFiltroEstado(estado);
    }, []);

    const handleFiltroResponsable = useCallback((responsable) => {
        setFiltroResponsable(responsable);
    }, []);

    const getEstadoLabel = useCallback(() => {
        if (!filtroEstado) return 'Todos los estados';
        return filtroEstado === 'pagado' ? 'Pagados' : 'Pendientes';
    }, [filtroEstado]);

    const getResponsableLabel = useCallback(() => {
        return filtroResponsable?.name || 'Todos los responsables';
    }, [filtroResponsable]);

    const opcionesFiltros = useMemo(() => ([
        {
            label: getEstadoLabel(),
            active: Boolean(filtroEstado),
            onClick: () => setIsOpenFiltroEstado(true)
        },
        {
            label: getResponsableLabel(),
            active: Boolean(filtroResponsable),
            onClick: () => setIsOpenFiltroResponsable(true)
        }
    ]), [getEstadoLabel, getResponsableLabel, filtroEstado, filtroResponsable]);

    const handleScroll = useCallback((e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
            setCurrentPage(prev => prev + 1);
        }
    }, [hasMorePages, isLoading, isLoadingMore]);

    const handlePagoSeleccionado = useCallback((pagoSeleccionado) => {
        setSelectedPago(pagoSeleccionado || null);
        setIsVerPagoOpen(true);
    }, []);

    const handlePagoActualizado = useCallback((pagoActualizado) => {
        if (!pagoActualizado || !pagoActualizado.id) {
            return;
        }
        setPagos(prev => {
            const existe = prev.some(p => p.id === pagoActualizado.id);
            if (!existe) {
                return prev;
            }
            const actualizados = prev.map(pago =>
                pago.id === pagoActualizado.id ? { ...pago, ...pagoActualizado } : pago
            );
            const ordenados = sortPagos(actualizados);
            pagosRef.current = ordenados;
            return ordenados;
        });
        mutateCachedItems(prev => {
            if (!prev || prev.length === 0) return prev;
            const actualizados = prev.map(pago =>
                pago.id === pagoActualizado.id ? { ...pago, ...pagoActualizado } : pago
            );
            return sortPagos(actualizados);
        });
        setSelectedPago(prev => (prev && prev.id === pagoActualizado.id ? { ...prev, ...pagoActualizado } : prev));
        setCurrentPage(1);
        setHasMorePages(false);
        setPagosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    }, [sortPagos, mutateCachedItems]);

    const handlePagoEliminado = useCallback((pagoId, mensaje) => {
        setIsVerPagoOpen(false);
        setSelectedPago(null);
        const texto = mensaje || 'Pago eliminado correctamente.';
        mostrarNotificacion('success', texto);
        if (!pagoId) {
            return;
        }
        setPagos(prev => {
            const filtrados = prev.filter(pago => pago.id !== pagoId);
            pagosRef.current = filtrados;
            return filtrados;
        });
        mutateCachedItems(prev => (prev || []).filter(pago => pago.id !== pagoId));
        setCurrentPage(1);
        setHasMorePages(false);
        setPagosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    }, [mutateCachedItems]);

    const handlePagoRegistrado = useCallback((nuevoPago) => {
        if (!nuevoPago) {
            return;
        }
        console.log('[PanelPagos] Pago recibido tras creación:', nuevoPago);
        let pagoDetallado = { ...nuevoPago };

        // Fallback para responsable y registrado_por si el backend no los envía
        if (!pagoDetallado?.responsable && nuevoPago?.responsable_id) {
            pagoDetallado = {
                ...pagoDetallado,
                responsable: nuevoPago.responsable || {
                    id: nuevoPago.responsable_id,
                    name: nuevoPago.responsable_nombre || 'Responsable desconocido'
                }
            };
        }
        if (!pagoDetallado?.user && nuevoPago?.user) {
            pagoDetallado.user = nuevoPago.user;
        }

        if (!pagoDetallado?.personal && nuevoPago?.personal) {
            pagoDetallado.personal = nuevoPago.personal;
        }

        const candidatoRegistrador =
            pagoDetallado?.registrado_por ||
            pagoDetallado?.personal ||
            pagoDetallado?.user ||
            nuevoPago?.personal ||
            nuevoPago?.user ||
            null;

        console.log('[PanelPagos] Registrador candidato:', candidatoRegistrador);

        if (candidatoRegistrador) {
            const tipoRegistrador =
                candidatoRegistrador === (pagoDetallado?.personal || nuevoPago?.personal) ? 'personal' : 'user';

            const nombreRegistrador =
                candidatoRegistrador.name ||
                `${candidatoRegistrador.first_name || ''} ${candidatoRegistrador.last_name || ''}`.trim();

            pagoDetallado = {
                ...pagoDetallado,
                registrado_por: {
                    ...candidatoRegistrador,
                    tipo: tipoRegistrador,
                    name: nombreRegistrador && nombreRegistrador.length > 0 ? nombreRegistrador : 'Sin nombre'
                }
            };
        }

        setPagos(prev => {
            const sinDuplicados = prev.filter(pagoExistente => pagoExistente.id !== pagoDetallado.id);
            const ordenados = sortPagos([pagoDetallado, ...sinDuplicados]);
            pagosRef.current = ordenados;
            return ordenados;
        });
        mutateCachedItems(prev => {
            const sinDuplicados = (prev || []).filter(pagoExistente => pagoExistente.id !== pagoDetallado.id);
            return sortPagos([pagoDetallado, ...sinDuplicados]);
        });
        setSelectedPago(pagoDetallado);
        mostrarNotificacion('success', 'Pago registrado correctamente.');
        setCurrentPage(1);
        setHasMorePages(false);
        setPagosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    }, [sortPagos, mutateCachedItems]);

    const handleRefresh = async () => {
        pagosRef.current = [];
        setPagos([]);
        setCurrentPage(1);
        setHasMorePages(false);
        setPagosLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView>
            <HeaderView
                onBack={() => setIsOpen(false)}
                title="Pagos Producción"
                showSearch
                searchPlaceholder="Buscar por responsable..."
                searchValue={searchQuery}
                onSearchChange={(value) => setSearchQuery(value)}
                onSearchNormalizedChange={(value) => setSearchNormalized(value || '')}
                onSearchClear={() => {
                    setSearchQuery('');
                    setSearchNormalized('');
                }}
                searchExpanded={isSearchExpanded}
                onSearchToggle={setIsSearchExpanded}
            />

            <div className={styles.container}>
                {isLoading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <NoData
                        icon="error"
                        title="Error al cargar"
                        detail={error.message || 'Intenta nuevamente en unos minutos.'}
                        transparent
                        minHeight="220px"
                    />
                ) : (
                    <>
                        <div className={styles.titleContainer}>
                            <RefreshIndicator
                                isVisible={showRefreshIndicator}
                                isLoading={isRefreshing}
                            />
                        </div>
                        <Filtros options={opcionesFiltros} />
                        {isLargeScreen ? (
                            <>
                                <div
                                    className={styles.content}
                                    onScroll={handleScroll}
                                    style={{
                                        maxHeight: 'calc(100% - 120px)',
                                        minHeight: 'calc(100% - 120px)'
                                    }}
                                >
                                    {pagosFiltrados.length > 0 ? (
                                        <Table
                                            headers={tableHeaders}
                                            data={tableData}
                                            onRowClick={(row) => {
                                                const pagoOriginal = pagosFiltrados.find((pago) => pago.id === row.id);
                                                handlePagoSeleccionado(pagoOriginal);
                                            }}
                                            getCellBadge={(row, key) => {
                                                if (key === 'estado') {
                                                    return {
                                                        text: row.estado,
                                                        className: row.estado === 'Pagado' ? 'info' : 'error'
                                                    };
                                                }
                                                return null;
                                            }}
                                        />
                                    ) : (
                                        <NoData
                                            icon="wallet"
                                            title={searchQuery ? 'Sin resultados' : 'No hay pagos registrados'}
                                            detail={
                                                searchQuery
                                                    ? 'Ajusta tu búsqueda para encontrar los pagos que necesitas.'
                                                    : 'Registra pagos para gestionar la producción de Damabrava.'
                                            }
                                            transparent
                                            minHeight="220px"
                                        />
                                    )}
                                    {isLoadingMore && <LoadingSpinner />}
                                </div>
                            </>
                        ) : (
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Pagos Damabrava"
                                containerStyle={{
                                    maxHeight: 'calc(100% - 120px)',
                                    minHeight: 'calc(100% - 120px)'
                                }}
                                onScroll={handleScroll}
                            >
                                {pagosFiltrados.length > 0 ? (
                                    pagosFiltrados.map((pago) => {
                                        const responsable = pago?.responsable?.name || 'Sin responsable';
                                        const periodo = `${formatFechaCorta(pago.fecha_inicio)} - ${formatFechaCorta(pago.fecha_fin)}`;
                                        const total = Number(pago.total || 0).toLocaleString('es-BO', {
                                            minimumFractionDigits: 2,
                                            maximumFractionDigits: 2
                                        });
                                        const estado = pago.estado === 'pagado' ? 'pagado' : 'pendiente';
                                        const registradoPor = pago?.registrado_por?.name || pago?.personal?.name || pago?.user?.name || 'Sin registrar';

                                        return (
                                            <ItemView
                                                key={pago.id}
                                                title={responsable}
                                                description={periodo}
                                                arrow
                                                flot2={pago.total}
                                                flot3={estado === 'pendiente' ? 'Pendiente' : ''}
                                                flot1={estado === 'pagado' ? 'Pagado' : ''}
                                                onClick={() => handlePagoSeleccionado(pago)}
                                            />
                                        );
                                    })
                                ) : (
                                    <NoData
                                        icon="wallet"
                                        title={searchQuery ? 'Sin resultados' : 'No hay pagos registrados'}
                                        detail={
                                            searchQuery
                                                ? 'Ajusta tu búsqueda para encontrar los pagos que necesitas.'
                                                : 'Registra pagos para gestionar la producción de Damabrava.'
                                        }
                                        transparent
                                        minHeight="220px"
                                    />
                                )}
                                {isLoadingMore && <LoadingSpinner />}
                            </PullToRefresh>
                        )}
                    </>
                )}

                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Registrar pago'
                        onClick={() => setIsRegistroPagoOpen(true)}
                        disabled={isLoading}
                    />
                </div>
            </div>

            <VerPago
                isOpen={isVerPagoOpen}
                setIsOpen={setIsVerPagoOpen}
                pago={selectedPago}
                onPagoActualizado={handlePagoActualizado}
                onPagoEliminado={handlePagoEliminado}
                mostrarNotificacion={mostrarNotificacion}
                reglas={reglasProduccion}
            />

            <RegistroPago
                isOpen={isRegistroPagoOpen}
                setIsOpen={setIsRegistroPagoOpen}
                registros={[]}
                reglas={reglasProduccion}
                onPagoRegistrado={handlePagoRegistrado}
            />

            <FiltroEstadoPago
                isOpen={isOpenFiltroEstado}
                setIsOpen={setIsOpenFiltroEstado}
                onEstadoSeleccionado={handleFiltroEstado}
            />

            <FiltroResponsable
                isOpen={isOpenFiltroResponsable}
                setIsOpen={setIsOpenFiltroResponsable}
                onResponsableSeleccionado={handleFiltroResponsable}
                responsableSeleccionado={filtroResponsable}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Carga de datos progresiva - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={pagosServiceWrapper}
                    method="getAll"
                    methodParams={[]}
                    serviceName="pagosDamabravaService"
                    isOpen={isOpen && ((!pagosLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
                    page={currentPage}
                    limit={PAGE_LIMIT}
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
};

export default PanelPagos;
