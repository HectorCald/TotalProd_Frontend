import React, { useState, useEffect, useCallback } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerDeuda from './VerDeuda';
import EditarAgregarDeuda from './EditarAgregarDeuda';
import Filtros from '../../common/Filtros';
import Notification from '../../common/Notification';
import deudasService from '../../../services/deudasService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import Boton from '../../common/Boton';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import FiltroEstadoDeuda from '../../mixed/FiltroEstadoDeuda';
import FiltroOrdenamientoDeudas from '../../mixed/FiltroOrdenamientoDeudas';
import InfoModal from '../../common/InfoModal';
import PullToRefresh from '../../common/PullToRefresh';

function PanelDeudas({ isOpen, setIsOpen }) {
    const { isLargeScreen } = useLayout();
    
    // Estados para los modales
    const [isOpenVerDeuda, setIsOpenVerDeuda] = useState(false);
    const [isOpenEditarAgregar, setIsOpenEditarAgregar] = useState(false);
    const [infoDeuda, setInfoDeuda] = useState(null);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);
    
    // Estado para acumular todas las deudas de todas las páginas
    const [allDeudas, setAllDeudas] = useState([]);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para filtros
    const [filtroEstado, setFiltroEstado] = useState(null);
    const [filtroCliente, setFiltroCliente] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('fecha_desc');

    // Estados para deudas
    const [deudas, setDeudas] = useState([]);
    const [hasMorePages, setHasMorePages] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Callback para manejar las deudas cargadas
    const handleDeudasLoaded = useCallback((data) => {
        setDeudas(data);
        setError(null); // Limpiar error cuando se cargan datos exitosamente
    }, []);

    // Función para manejar errores de FetchData
    const handleError = useCallback((error) => {
        setError(error);
    }, []);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (allDeudas.length === 0) {
            setIsLoading(true);
        }
    }, [allDeudas.length]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        setIsLoading(false);
    }, []);

    // Acumular datos de todas las páginas cuando llegan nuevas deudas
    useEffect(() => {
        if (deudas && deudas.length > 0 && isOpen) {
            if (currentPage === 1) {
                // Si es la primera página, tomar todas las deudas que vienen del servicio
                setAllDeudas(deudas);
            } else {
                // Si es una página posterior, acumular los datos
                setAllDeudas(prevDeudas => {
                    // Evitar duplicados por si acaso
                    const existingIds = new Set(prevDeudas.map(d => d.id));
                    const newDeudas = deudas.filter(d => !existingIds.has(d.id));
                    return [...prevDeudas, ...newDeudas];
                });
            }
        }
    }, [deudas, currentPage, isOpen]);


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
    const [isOpenEstado, setOpenEstado] = useState(false);
    const [isOpenCliente, setOpenCliente] = useState(false);

    // Función para manejar el click en una deuda
    const handleDeuda = (deuda) => {
        setInfoDeuda(deuda);
        setIsOpenVerDeuda(true);
    };

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await deudasService.getAll(currentPage, 10, debouncedSearchQuery, filtroEstado, filtroCliente, ordenamiento);
            if (response.success) {
                setDeudas(response.data);
                setHasMorePages(response.pagination?.hasNextPage || false);
            }
        } catch (error) {
            console.error('Error al refrescar deudas:', error);
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

    // Función para manejar filtro de estado
    const handleFiltroEstado = useCallback((estado) => {
        setFiltroEstado(estado);
        setCurrentPage(1);
    }, []);

    // Función para manejar filtro de cliente
    const handleFiltroCliente = (cliente) => {
        setFiltroCliente(cliente);
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
            setAllDeudas([]);
            setCurrentPage(1);
        }
    }, [debouncedSearchQuery, filtroEstado, filtroCliente, ordenamiento]);

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
        // Actualizar el estado local acumulado
        setAllDeudas(prevDeudas => 
            prevDeudas.filter(deuda => deuda.id !== deudaId)
        );
        
        mostrarNotificacion('success', 'Deuda eliminada correctamente');
    };

    // Función para manejar cuando se actualiza una deuda
    const handleDeudaActualizada = (deudaActualizada) => {
        // Actualizar el estado local acumulado
        setAllDeudas(prevDeudas => 
            prevDeudas.map(deuda => 
                deuda.id === deudaActualizada.id ? deudaActualizada : deuda
            )
        );
        
        mostrarNotificacion('success', 'Deuda actualizada correctamente');
    };

    // Función para manejar cuando se crea una nueva deuda
    const handleDeudaCreated = (newDeuda) => {
        // Actualizar el estado local con la deuda que devuelve el servidor
        setAllDeudas(prevDeudas => [newDeuda, ...prevDeudas]);
        
        // Cerrar el modal
        setIsOpenEditarAgregar(false);
        mostrarNotificacion('success', 'Deuda agregada correctamente');
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

    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'fecha_desc': 'Más recientes',
            'fecha_asc': 'Más antiguos',
            'vencimiento_desc': 'Vencimiento reciente',
            'vencimiento_asc': 'Vencimiento lejano',
            'monto_desc': 'Mayor monto',
            'monto_asc': 'Menor monto',
            'concepto_asc': 'Concepto A-Z',
            'concepto_desc': 'Concepto Z-A'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const opciones = [
        {
            label: getEstadoNombre(),
            active: filtroEstado !== null,
            onClick: () => setOpenEstado(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'fecha_desc',
            onClick: () => setOpenOrden(true)
        },
    ];

    // Headers para la tabla
    const tableHeaders = [
        { key: 'concepto', label: 'Concepto', icon: 'receipt' },
        { key: 'fecha_deuda', label: 'Fecha Deuda', icon: 'calendar' },
        { key: 'fecha_vencimiento', label: 'Vencimiento', icon: 'time' },
        { key: 'cliente', label: 'Cliente', icon: 'user' },
        { key: 'estado', label: 'Estado', icon: 'info-circle' },
        { key: 'monto_total', label: 'Monto Total', icon: 'dollar' },
        { key: 'saldo_pendiente', label: 'Saldo Pendiente', icon: 'money' }
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
        fecha_deuda: new Date(deuda.fecha_deuda).toLocaleDateString(),
        fecha_vencimiento: new Date(deuda.fecha_vencimiento).toLocaleDateString(),
        cliente: deuda.cliente?.name || '--',
        estado: deuda.estado,
        monto_total: `Bs. ${(deuda.monto_total || 0).toFixed(2)}`,
        saldo_pendiente: `Bs. ${(deuda.saldo_pendiente || 0).toFixed(2)}`
    }));

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
            <HeaderView 
                onBack={() => setIsOpen(false)}
                showSearch={true}
                searchPlaceholder="Buscar deuda por concepto..."
                searchValue={searchQuery}
                onSearchChange={handleSearchChange}
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
                        <Filtros options={opciones} />
                        {isLargeScreen ? (
                            // Vista de tabla para pantallas grandes
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
                                {isLoading && (
                                    <div className={styles.loadingMore}>
                                        <p>Cargando más deudas...</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            // Vista de cards para pantallas pequeñas con PullToRefresh
                            <PullToRefresh
                                onRefresh={handleRefresh}
                                screenName="Deudas"
                                containerStyle={{
                                    maxHeight: 'calc(100% - 80px)',
                                    minHeight: 'calc(100% - 80px)'
                                }}
                            >
                                    {allDeudas.length > 0 ? (
                                        allDeudas.map((deuda, index) => {
                                            const isVencida = new Date(deuda.fecha_vencimiento) < new Date() && deuda.estado === 'pendiente';
                                            return (
                                                <ItemView
                                                    key={deuda.id || index}
                                                    title={deuda.concepto || 'Sin concepto'}
                                                    description={`${new Date(deuda.fecha_deuda).toLocaleDateString()}`}
                                                    icon='receipt'
                                                    onClick={() => handleDeuda(deuda)}
                                                    arrow={false}
                                                    flot6={`Bs. ${(deuda.monto_total || 0).toFixed(2)}`}
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
                                    {isLoading && (
                                        <div className={styles.loadingMore}>
                                            <p>Cargando más deudas...</p>
                                        </div>
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

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* FetchData para deudas */}
            {isOpen && (
                <FetchData
                    service={deudasService}
                    serviceName="deudasService"
                    method="getAll"
                    methodParams={[currentPage, 10, debouncedSearchQuery, filtroEstado, filtroCliente, ordenamiento]}
                    isOpen={isOpen}
                    onDataLoaded={handleDeudasLoaded}
                    onLoadingStart={handleLoadingStart}
                    onLoadingEnd={handleLoadingEnd}
                    onError={handleError}
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
            <FiltroEstadoDeuda
                isOpen={isOpenEstado}
                setIsOpen={setOpenEstado}
                onEstadoSeleccionado={handleFiltroEstado}
            />

            <FiltroOrdenamientoDeudas
                isOpen={isOpenOrden}
                setIsOpen={setOpenOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
            />
        </View>
    );
}

export default PanelDeudas;
