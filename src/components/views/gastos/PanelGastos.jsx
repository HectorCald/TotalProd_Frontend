import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerGasto from './VerGasto';
import EditarAgregarGasto from './EditarAgregarGasto';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import gastosService from '../../../services/gastosService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import Boton from '../../common/Boton';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import FiltroMetodoPago from '../../mixed/FiltroMetodoPago';
import FiltroOrdenamientoGastos from '../../mixed/FiltroOrdenamientoGastos';
import InfoModal from '../../common/InfoModal';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';

function PanelGastos({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();

    // Estados para los modales
    const [isOpenVerGasto, setIsOpenVerGasto] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoGasto, setInfoGasto] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estado para acumular todos los gastos de todas las páginas
    const [allGastos, setAllGastos] = useState([]);

    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroMetodoPago, setFiltroMetodoPago] = useState(null);
    const [filtroProveedor, setFiltroProveedor] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para gastos
    const [gastos, setGastos] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Callback para manejar los gastos cargados
    const handleGastosLoaded = useCallback((data) => {
        setGastos(data);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (allGastos.length === 0) {
            setIsLoading(true);
        }
        // Incrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = prev + 1;
            // Mostrar RefreshIndicator solo cuando hay peticiones activas
            if (isLargeScreen && newCount > 0) {
                setShowRefreshIndicator(true);
                setIsRefreshing(true);
            }
            return newCount;
        });
    }, [allGastos.length, isLargeScreen]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Ocultar RefreshIndicator cuando no hay peticiones activas
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
    }, [isLargeScreen]);

    // Acumular datos de todas las páginas cuando llegan nuevos gastos
    useEffect(() => {
        if (gastos && gastos.length > 0 && isOpen) {
            if (currentPage === 1) {
                // Si es la primera página, tomar todos los gastos que vienen del servicio
                setAllGastos(gastos);
            } else {
                // Si es una página posterior, acumular los datos
                setAllGastos(prevGastos => {
                    // Evitar duplicados por si acaso
                    const existingIds = new Set(prevGastos.map(g => g.id));
                    const newGastos = gastos.filter(g => !existingIds.has(g.id));
                    return [...prevGastos, ...newGastos];
                });
            }
        }
    }, [gastos, currentPage, isOpen]);


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
    const [isOpenMetodoPago, setOpenMetodoPago] = useState(false);
    const [isOpenProveedor, setOpenProveedor] = useState(false);

    // Función para manejar el click en un gasto
    const handleGasto = (gasto) => {
        setInfoGasto(gasto);
        setIsOpenVerGasto(true);
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await gastosService.getAll(currentPage, 10, debouncedSearchQuery, filtroMetodoPago, filtroProveedor, ordenamiento);
            if (response.success) {
                setGastos(response.data);
                setHasMorePages(response.pagination?.hasNextPage || false);
            }
        } catch (error) {
            console.error('Error al refrescar gastos:', error);
        }
    };


    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = useCallback((orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
    }, []);

    // Función para manejar filtro de método de pago
    const handleFiltroMetodoPago = useCallback((metodo) => {
        setFiltroMetodoPago(metodo);
        setCurrentPage(1);
    }, []);

    // Función para manejar filtro de proveedor
    const handleFiltroProveedor = (proveedor) => {
        setFiltroProveedor(proveedor);
        setCurrentPage(1);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Funciones para el buscador expandible
    const handleSearchChange = (value) => {
        setSearchQuery(value);
    };

    const handleSearchClear = () => {
        setSearchQuery('');
    };

    const handleSearchToggle = (isExpanded) => {
        setIsSearchExpanded(isExpanded);
    };

    // Efecto para limpiar datos acumulados SOLO cuando cambia la búsqueda, filtro o ordenamiento
    useEffect(() => {
        if (isOpen) {
            setAllGastos([]);
            setCurrentPage(1);
        }
    }, [debouncedSearchQuery, filtroMetodoPago, filtroProveedor, ordenamiento]);

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
            const requiredModule = error.requiredModule || 'Gastos';

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

    // Función para manejar cuando se elimina un gasto
    const handleGastoEliminado = (gastoId) => {
        // Actualizar el estado local acumulado
        setAllGastos(prevGastos =>
            prevGastos.filter(gasto => gasto.id !== gastoId)
        );

        mostrarNotificacion('success', 'Gasto eliminado correctamente');
    };

    // Función para manejar cuando se actualiza un gasto
    const handleGastoActualizado = (gastoActualizado) => {
        // Actualizar el estado local acumulado
        setAllGastos(prevGastos =>
            prevGastos.map(gasto =>
                gasto.id === gastoActualizado.id ? gastoActualizado : gasto
            )
        );

        mostrarNotificacion('success', 'Gasto actualizado correctamente');
    };

    // Función para manejar cuando se crea un nuevo gasto
    const handleGastoCreated = (newGasto) => {
        // Actualizar el estado local con el gasto que devuelve el servidor
        setAllGastos(prevGastos => [newGasto, ...prevGastos]);

        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Gasto agregado correctamente');
    };

    // Función para obtener el nombre del método de pago
    const getMetodoPagoNombre = () => {
        if (filtroMetodoPago === null) return 'Todos los métodos';

        const metodosPago = [
            { value: 'qr', label: 'QR' },
            { value: 'transferencia', label: 'Transferencia' },
            { value: 'tarjeta', label: 'Tarjeta' },
            { value: 'efectivo', label: 'Efectivo' }
        ];

        const metodo = metodosPago.find(m => m.value === filtroMetodoPago);
        return metodo ? metodo.label : 'Todos los métodos';
    };

    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'fecha_desc': 'Más recientes',
            'fecha_asc': 'Más antiguos',
            'valor_desc': 'Mayor valor',
            'valor_asc': 'Menor valor',
            'concepto_asc': 'Concepto A-Z',
            'concepto_desc': 'Concepto Z-A'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const opciones = [
        {
            label: getMetodoPagoNombre(),
            active: filtroMetodoPago !== null,
            onClick: () => setOpenMetodoPago(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setOpenOrden(true)
        },
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'concepto', label: 'Concepto', icon: 'money' },
        { key: 'fecha', label: 'Fecha', icon: 'calendar' },
        { key: 'metodo_pago', label: 'Método de Pago', icon: 'credit-card' },
        { key: 'proveedor', label: 'Proveedor', icon: 'user' },
        { key: 'valor', label: 'Valor', icon: 'dollar' }
    ];

    // Función helper para formatear fecha sin problemas de zona horaria
    const formatearFecha = (fechaString) => {
        if (!fechaString) return 'Sin fecha';
        // Parsear directamente desde YYYY-MM-DD sin usar new Date para evitar problemas de zona horaria
        const partes = fechaString.split('-');
        if (partes.length === 3) {
            const año = partes[0];
            const mes = partes[1];
            const dia = partes[2];
            // Crear fecha en zona horaria local directamente
            const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
            return fecha.toLocaleDateString('es-ES', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        }
        return fechaString;
    };

    // Datos para la tabla
    const tableData = allGastos.map(gasto => ({
        id: gasto.id,
        concepto: gasto.concepto || 'Sin concepto',
        fecha: formatearFecha(gasto.fecha_gasto),
        metodo_pago: gasto.metodo_pago || 'Sin método de pago',
        proveedor: gasto.proveedor?.name || '--',
        valor: `Bs. ${(gasto.valor || 0).toFixed(2)}`
    }));

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar gasto por concepto..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title='Gastos'
            />
            <div className={styles.container}>
                {isLoading ? (
                    // Mostrar LoadingSpinner cuando está cargando
                    <LoadingSpinner />
                ) : (
                    <>
                        <Filtros options={opciones} />
                        {isLargeScreen ? (
                            // Vista de tabla para pantallas grandes
                            <>
                                <div className={styles.titleContainer}>
                                    <RefreshIndicator
                                        isVisible={showRefreshIndicator}
                                        isLoading={isRefreshing}
                                    />
                                </div>
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
                                        onRowClick={(gasto) => {
                                            // Buscar el gasto original sin formatear
                                            const gastoOriginal = allGastos.find(g => g.id === gasto.id);
                                            handleGasto(gastoOriginal);
                                        }}
                                    />
                                    {/* Indicador de carga para más elementos */}
                                    {isLoading && (
                                        <div className={styles.loadingMore}>
                                            <p>Cargando más gastos...</p>
                                        </div>
                                    )}
                                </div>
                            </>
                        ) : (
                            // Vista de cards para pantallas pequeñas con PullToRefresh
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Gastos"
                                containerStyle={{
                                    maxHeight: 'calc(100% - 80px)',
                                    minHeight: 'calc(100% - 80px)'
                                }}
                            >
                                {allGastos.length > 0 ? (
                                    allGastos.map((gasto, index) => {
                                        return (
                                            <ItemView
                                                key={gasto.id || index}
                                                title={gasto.concepto || 'Sin concepto'}
                                                description={`${formatearFecha(gasto.fecha_gasto)} • ${gasto.metodo_pago || 'Sin método de pago'}${gasto.proveedor?.name ? ` • ${gasto.proveedor.name}` : ''}`}
                                                icon='money'
                                                onClick={() => handleGasto(gasto)}
                                                arrow={false}
                                                flot3={`Bs. ${(gasto.valor || 0).toFixed(2)}`}
                                            />
                                        );
                                    })
                                ) : (
                                    <NoData
                                        icon="receipt"
                                        title={searchQuery ? 'Sin resultados' : 'No hay gastos'}
                                        detail={searchQuery ? 'Intenta ajustar los filtros de búsqueda para encontrar los gastos que necesitas' : 'Registra gastos para comenzar a gestionar tus finanzas'}
                                        transparent={true}
                                        minHeight="200px"
                                    />
                                )}
                                {/* Indicador de carga para más elementos */}
                                {isLoading && (
                                    <div className={styles.loadingMore}>
                                        <p>Cargando más gastos...</p>
                                    </div>
                                )}

                            </PullToRefresh>
                        )}
                    </>
                )}
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label='Agregar gasto'
                        onClick={() => setIsOpenEditarAgregar(true)}
                    />
                </div>
            </div>

            {/* Modal de ver gasto*/}
            <VerGasto
                isOpen={isOpenVerGasto}
                setIsOpen={setIsOpenVerGasto}
                gasto={infoGasto}
                onGastoEliminado={handleGastoEliminado}
                onGastoActualizado={handleGastoActualizado}
            />

            {/* Modal de editar/agregar gasto */}
            <EditarAgregarGasto
                isOpen={isOpenEditarAgregar}
                setIsOpen={setIsOpenEditarAgregar}
                onGastoCreated={handleGastoCreated}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* FetchData para gastos */}
            {isOpen && (
                <FetchData
                    service={gastosService}
                    serviceName="gastosService"
                    method="getAll"
                    methodParams={[currentPage, 10, debouncedSearchQuery, filtroMetodoPago, filtroProveedor, ordenamiento]}
                    isOpen={isOpen}
                    onDataLoaded={handleGastosLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
                    onRefresh={isLargeScreen ? handleRefresh : undefined}
                />
            )}

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
            <FiltroMetodoPago
                isOpen={isOpenMetodoPago}
                setIsOpen={setOpenMetodoPago}
                onMetodoSeleccionado={handleFiltroMetodoPago}
            />

            <FiltroOrdenamientoGastos
                isOpen={isOpenOrden}
                setIsOpen={setOpenOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
            />
        </View>
    );
}

export default PanelGastos;
