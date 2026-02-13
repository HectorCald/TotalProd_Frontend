import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { getPrimaryNormalizedValue } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerDeuda from './VerDeuda';
import EditarAgregarDeuda from './EditarAgregarDeuda';
import Filtros from '../../common/Filtros';
import deudasService from '../../../services/deudasService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import Boton from '../../common/Boton';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
// import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import FiltroEstadoDeuda from '../../mixed/FiltroEstadoDeuda';
import FiltroCliente from '../../mixed/FiltroCliente';
import InfoModal from '../../common/InfoModal';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import FetchDataProgressive from '../../mixed/FetchDataProgressive';
import useProgressiveSessionCache from '../../../hooks/useProgressiveSessionCache';
import { formatCurrency } from '../../../utils/numberUtils';
import FiltroFecha, { formatDateRangeForDisplay } from '../../mixed/FiltroFecha';
import { formatFechaLiteral } from '../../../utils/dateUtils';

function PanelDeudas({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerDeuda, setIsOpenVerDeuda] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoDeuda, setInfoDeuda] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estado para acumular todas las deudas de todas las páginas
    const [allDeudas, setAllDeudas] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQueryNormalized, 500);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroCliente, setFiltroCliente] = useState(null);
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

    const filterSignature = useMemo(() => JSON.stringify({
        filtroEstado,
        filtroClienteId: filtroCliente?.id || null,
        ordenamiento,
        search: debouncedSearchQuery || '',
        fechaInicio: fechaInicioKey,
        fechaFin: fechaFinKey,
    }), [filtroEstado, filtroCliente?.id, ordenamiento, debouncedSearchQuery, fechaInicioKey, fechaFinKey]);

    const {
        hasCachedItems,
        hydrateFromCache,
        persistFirstPage,
        mutateCachedItems,
    } = useProgressiveSessionCache({
        baseKey: 'panelDeudas',
        filtersSignature: filterSignature,
        pageSize: 30,
    });

    // Estados para deudas
    const [deudas, setDeudas] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Callbacks para FetchDataProgressive
    const handleDataLoaded = useCallback((data) => {
        setAllDeudas(data.length > 0 ? data : []);
        setDeudasLoaded(true);
        persistFirstPage(data);
    }, [persistFirstPage]);

    const handleDataAccumulated = useCallback((data) => {
        setAllDeudas(prev => {
            const existingIds = new Set(prev.map(d => d.id));
            const merged = [...prev];
            data.forEach(item => {
                if (!existingIds.has(item.id)) merged.push(item);
            });
            return merged;
        });
    }, []);

    const handleLoadingStart = useCallback(() => {
        if (currentPage === 1) {
            if (allDeudas.length === 0 && !hasCachedItems) {
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
    }, [currentPage, allDeudas.length, hasCachedItems]);

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

    // Resetear flags cuando se abre el modal
    const [deudasLoaded, setDeudasLoaded] = useState(false);
    const lastFilterSignatureRef = useRef(filterSignature);
    useEffect(() => {
        if (isOpen) {
            setDeudasLoaded(false);
            setCurrentPage(1);
        } else {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);


    // Estados para filtros y modales
    const [isOpenEstado, setOpenEstado] = useState(false);
    const [isOpenCliente, setOpenCliente] = useState(false);
    const [isOpenFiltroFecha, setIsOpenFiltroFecha] = useState(false);

    // Función para manejar el click en una deuda
    const handleDeuda = (deuda) => {
        setInfoDeuda(deuda);
        setIsOpenVerDeuda(true);
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        setAllDeudas([]);
        setCurrentPage(1);
        setDeudasLoaded(false);
        // FetchDataProgressive se encargará de recargar automáticamente
    };


    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading && !isLoadingMore) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // (Ordenamiento por UI removido; se mantiene estado por compatibilidad)

    // Función para manejar filtro de estado
    const handleFiltroEstado = (estado) => {
        setFiltroEstado(estado);
        setCurrentPage(1);
    };

    // Función para manejar filtro de cliente
    const handleFiltroCliente = (cliente) => {
        setFiltroCliente(cliente);
        setCurrentPage(1);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
        }
    }, [isOpen]);

    useEffect(() => {
        if (!isOpen || currentPage !== 1 || allDeudas.length > 0) {
            return;
        }
        hydrateFromCache(setAllDeudas);
    }, [isOpen, currentPage, allDeudas.length, hydrateFromCache]);

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

    // Efecto para limpiar y recargar al cambiar búsqueda/filtros/orden
    useEffect(() => {
        if (!isOpen) {
            return;
        }
        if (lastFilterSignatureRef.current === filterSignature) {
            return;
        }
        lastFilterSignatureRef.current = filterSignature;
        setAllDeudas([]);
        setCurrentPage(1);
        setDeudasLoaded(false);
    }, [filterSignature, isOpen]);

    // Estados y configuraciones para el modal de información
    const [modalConfig, setModalConfig] = useState({
        isOpen: false,
        type: 'info',
        title: '',
        description: '',
        showButton: false
    });

    // Manejar error 403 con useEffect para evitar bucle infinito
    useEffect(() => {
        if (error && error.status === 403 && isOpen) {
            const errorMessage = error.message || 'No tienes acceso a este módulo';
            const currentPlan = error.currentPlan || 'Plan actual';
            const requiredModule = error.requiredModule || 'Deudas';
            
            setModalConfig({
                isOpen: true,
                type: 'info',
                title: 'Modulo no incluido',
                description: `${errorMessage}`,
                showButton: true
            });
        } else if (!error || error.status !== 403) {
            // Si no hay error o el error no es 403, cerrar el modal
            setModalConfig(prev => ({ ...prev, isOpen: false }));
        }
    }, [error, isOpen]);

    // Función para manejar cuando se elimina una deuda
    const handleDeudaEliminada = (deudaId) => {
        const aplicarEliminacion = (lista) =>
            lista.filter(deuda => String(deuda.id) !== String(deudaId));

        setAllDeudas(aplicarEliminacion);
        mutateCachedItems(aplicarEliminacion);
    };

    // Función para manejar cuando se actualiza una deuda
    const handleDeudaActualizada = (deudaActualizada) => {
        const aplicarActualizacion = (lista) =>
            lista.map(deuda =>
                String(deuda.id) === String(deudaActualizada.id) ? deudaActualizada : deuda
            );

        setAllDeudas(aplicarActualizacion);
        mutateCachedItems(aplicarActualizacion);
    };

    // Función para manejar cuando se crea una nueva deuda
    const handleDeudaCreated = (newDeuda) => {
        const aplicarCreacion = (lista) => [newDeuda, ...(lista || [])];

        setAllDeudas(aplicarCreacion);
        mutateCachedItems(aplicarCreacion);
        
        setIsOpenEditarAgregar(false);
    };

    // Función para obtener el nombre del estado
    const getEstadoNombre = () => {
        if (filtroEstado === null) return 'Todos los estados';
        
        const estados = [
            { value: 'pendiente', label: 'Pendiente' },
            { value: 'pagada', label: 'Pagada' },
            { value: 'vencida', label: 'Vencida' }
        ];
        
        const estado = estados.find(e => e.value === filtroEstado);
        return estado ? estado.label : 'Todos los estados';
    };

    // (Nombre de ordenamiento removido junto con filtro de UI)

    const getClienteNombre = () => {
        if (!filtroCliente) return 'Todos los clientes';
        return filtroCliente.name || 'Cliente seleccionado';
    };

    const getFechaNombre = () => formatDateRangeForDisplay(filtroFecha?.inicio, filtroFecha?.fin, 'Fecha');

    const opciones = [
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setOpenEstado(true)
        },
        {
            label: getClienteNombre(),
            active: filtroCliente !== null,
            onClick: () => setOpenCliente(true)
        },
        {
            label: getFechaNombre(),
            active: Boolean(filtroFecha?.inicio || filtroFecha?.fin),
            onClick: () => setIsOpenFiltroFecha(true)
        }
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'concepto', label: 'Concepto', icon: 'receipt' },
        { key: 'fecha_deuda', label: 'Fecha', icon: 'calendar' },
        { key: 'fecha_vencimiento', label: 'Vencimiento', icon: 'time' },
        { key: 'cliente', label: 'Cliente', icon: 'user' },
        { key: 'estado', label: 'Estado', icon: 'info-circle' },
        { key: 'monto_total', label: 'Monto', icon: 'dollar' },
        { key: 'saldo_pendiente', label: 'Saldo', icon: 'money' }
    ];

    // Función para obtener el badge de estado
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'estado') {
            const estado = item.estado;
            const badgeConfig = {
                'pendiente': {
                    text: 'Pendiente',
                    className: 'warning' // naranja
                },
                'pagada': {
                    text: 'Pagada',
                    className: 'success' // verde
                },
                'vencida': {
                    text: 'Vencida',
                    className: 'error' // rojo
                },
            };
            
            return badgeConfig[estado] || {
                text: estado,
                className: 'default'
            };
        }
        
        return null;
    };

    // Datos para la tabla
    const tableData = allDeudas.map(deuda => ({
        id: deuda.id,
        concepto: deuda.concepto || 'Sin concepto',
        fecha_deuda: (typeof deuda.fecha_deuda === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deuda.fecha_deuda))
            ? (() => { const [y,m,d]=deuda.fecha_deuda.split('-'); return `${parseInt(d,10)}/${parseInt(m,10)}/${y}`; })()
            : new Date(deuda.fecha_deuda).toLocaleDateString(),
        fecha_vencimiento: (typeof deuda.fecha_vencimiento === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deuda.fecha_vencimiento))
            ? (() => { const [y,m,d]=deuda.fecha_vencimiento.split('-'); return `${parseInt(d,10)}/${parseInt(m,10)}/${y}`; })()
            : new Date(deuda.fecha_vencimiento).toLocaleDateString(),
        cliente: deuda.cliente?.name || '--',
        estado: deuda.estado,
        monto_total: formatCurrency(deuda.monto_total),
        saldo_pendiente: formatCurrency(deuda.saldo_pendiente)
    }));

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar deuda por concepto..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchNormalizedChange={handleSearchNormalizedChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title='Deudas'
            />
            <div className={styles.container}>
                {isLoading ? (
                    // Mostrar LoadingSpinner cuando está cargando
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
                            // Vista de tabla para pantallas grandes
                            <>
                                <div
                                    className={styles.content}
                                    onScroll={handleScroll}
                                    style={{
                                        maxHeight: 'calc(100% - 130px)',
                                    }}
                                >
                                    <Table
                                        headers={tableHeaders}
                                        data={tableData}
                                        onScroll={handleScroll}
                                        onRowClick={(deuda) => {
                                            // Buscar la deuda original sin formatear
                                            const deudaOriginal = allDeudas.find(d => d.id === deuda.id);
                                            handleDeuda(deudaOriginal);
                                        }}
                                        getCellBadge={getCellBadge}
                                        columnWidths={{
                                            concepto: '25%',
                                            fecha_deuda: '15%',
                                            fecha_vencimiento: '15%',
                                            cliente: '20%',
                                            estado: '15%',
                                            monto_total: '15%',
                                            saldo_pendiente: '15%'
                                        }}
                                    />
                                    {/* Indicador de carga para más elementos */}
                                    {isLoadingMore && (
                                        <LoadingSpinner />
                                    )}
                                </div>
                            </>
                        ) : (
                            // Vista de cards para pantallas pequeñas con PullToRefresh
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Deudas"
                                containerStyle={{
                                    maxHeight: 'calc(100% - 80px)',
                                    minHeight: 'calc(100% - 80px)'
                                }}
                                onScroll={handleScroll}
                            >
                                    {allDeudas.length > 0 ? (
                                        allDeudas.map((deuda, index) => {
                                            const isVencida = new Date(deuda.fecha_vencimiento) < new Date() && deuda.estado === 'pendiente';
                                            const fechaFormateada = (typeof deuda.fecha_deuda === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(deuda.fecha_deuda))
                                                ? (() => { const [y,m,d]=deuda.fecha_deuda.split('-'); return `${parseInt(d,10)}/${parseInt(m,10)}/${y}`; })()
                                                : `${new Date(deuda.fecha_deuda).toLocaleDateString()}`;
                                            return (
                                                <ItemView
                                                    key={deuda.id || index}
                                                    title={deuda.concepto || 'Sin concepto'}
                                                    description={formatFechaLiteral(deuda.fecha_deuda, !isLargeScreen) + ' - ' + formatCurrency(deuda?.monto_total)}
                                                    icon='receipt'
                                                    onClick={() => handleDeuda(deuda)}
                                                    arrow={false}
                                                    flot3={deuda.estado === 'pendiente' ? 'Pendiente' : ''}
                                                    flot1={deuda.estado === 'pagada' ? 'Pagada' : ''}
                                                />
                                            );
                                        })
                                    ) : (
                                        <NoData 
                                            icon="credit-card"
                                            title={searchQuery ? 'Sin resultados' : 'No hay deudas'}
                                            detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar las deudas que necesitas' : 'Registra deudas para comenzar a gestionar tus cuentas por cobrar'}
                                            transparent={true}
                                            minHeight="200px"
                                        />
                                    )}
                                    {/* Indicador de carga para más elementos */}
                                    {isLoadingMore && (
                                        <LoadingSpinner />
                                    )}
                             
                            </PullToRefresh>
                        )}
                    </>
                )}
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar deuda'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>
            
            {/* Modal de ver deuda*/}
            <VerDeuda
                isOpen={isOpenVerDeuda}
                setIsOpen={setIsOpenVerDeuda}
                deuda={infoDeuda}
                onDeudaEliminada={handleDeudaEliminada}
                onDeudaActualizada={handleDeudaActualizada}
            />

            {/* Modal de editar/agregar deuda */}
            <EditarAgregarDeuda
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                onDeudaCreated={handleDeudaCreated}
            />


            {/* FetchData eliminado: la carga ahora es interna como en PanelMovimientos */}

            {/* Modal de Información */}
            <InfoModal
                isOpen={modalConfig.isOpen}
                setIsOpen={(isOpen) => setModalConfig(prev => ({ ...prev, isOpen }))}
                type={modalConfig.type}
                title={modalConfig.title}
                description={modalConfig.description}
                showButton={modalConfig.showButton}
                buttonText="Aceptar"
                onButtonClick={() => setIsOpen(false)}
            />

            {/* Componentes de filtros */}
            <FiltroEstadoDeuda
                isOpen={isOpenEstado}
                setIsOpen={setOpenEstado}
                onEstadoSeleccionado={handleFiltroEstado}
            />

            <FiltroCliente
                isOpen={isOpenCliente}
                setIsOpen={setOpenCliente}
                onClienteSeleccionado={handleFiltroCliente}
                clienteSeleccionado={filtroCliente}
            />

            {/* Filtro de fecha */}
            <FiltroFecha
                isOpen={isOpenFiltroFecha}
                setIsOpen={setIsOpenFiltroFecha}
                startDate={filtroFecha?.inicio}
                endDate={filtroFecha?.fin}
                onApply={(inicio, fin) => setFiltroFecha({ inicio, fin })}
                onClear={() => setFiltroFecha({ inicio: null, fin: null })}
                title="Filtrar por fecha"
            />

            {/* Carga de datos progresiva - solo cuando está abierto */}
            {isOpen && (
                <FetchDataProgressive
                    service={deudasService}
                    method="getAll"
                    methodParams={[
                        getPrimaryNormalizedValue(debouncedSearchQuery),
                        filtroEstado,
                        filtroCliente?.id || null,
                        ordenamiento,
                        null, // sucuIdParam (se obtiene internamente)
                        filtroFecha.inicio || filtroFecha.fin
                            ? {
                                inicio: filtroFecha.inicio ? new Date(filtroFecha.inicio).toISOString() : null,
                                fin: filtroFecha.fin ? new Date(filtroFecha.fin).toISOString() : null,
                            }
                            : null
                    ]}
                    serviceName="deudasService"
                    isOpen={isOpen && ((!deudasLoaded && currentPage === 1) || (currentPage > 1 && hasMorePages))}
                    page={currentPage}
                    limit={30}
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

export default PanelDeudas;
