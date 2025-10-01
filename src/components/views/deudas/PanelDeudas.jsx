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
import RefreshIndicator from '../../common/RefreshIndicator';
import Boton from '../../common/Boton';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FetchData from '../../mixed/FetchData';
import FiltroEstadoDeuda from '../../mixed/FiltroEstadoDeuda';
import FiltroOrdenamientoDeudas from '../../mixed/FiltroOrdenamientoDeudas';

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
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
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
    }, []);

    // Callback para manejar el estado de carga
    const handleLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
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

    // Mostrar indicador cuando se ejecuta fetcher (cualquier cambio en isLoading)
    useEffect(() => {
        if (isLoading && isOpen && !showRefreshIndicator) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        } else if (!isLoading && showRefreshIndicator && isOpen) {
            // Cuando termina de cargar, mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    }, [isLoading, isOpen, showRefreshIndicator]);


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
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isOpenEstado, setOpenEstado] = useState(false);
    const [isOpenCliente, setOpenCliente] = useState(false);

    // Función para manejar el click en una deuda
    const handleDeuda = (deuda) => {
        setInfoDeuda(deuda);
        setIsOpenVerDeuda(true);
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        try {
            const response = await deudasService.getAll(currentPage, 10, debouncedSearchQuery, filtroEstado, filtroCliente, ordenamiento);
            if (response.success) {
                setDeudas(response.data);
                setHasMorePages(response.pagination?.hasNextPage || false);
            }
            
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        } catch (error) {
            console.error('Error al refrescar deudas:', error);
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

    // Efecto para manejar errores
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo deudas:', error);
        }
    }, [error]);

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

    // Función para obtener el color del estado
    const getEstadoColor = (estado) => {
        switch (estado) {
            case 'pendiente':
                return '#f39c12'; // Naranja
            case 'pagada':
                return '#27ae60'; // Verde
            case 'vencida':
                return '#e74c3c'; // Rojo
            default:
                return '#95a5a6'; // Gris
        }
    };

    // Datos para la tabla
    const tableData = allDeudas.map(deuda => ({
        id: deuda.id,
        concepto: deuda.concepto || 'Sin concepto',
        fecha_deuda: new Date(deuda.fecha_deuda).toLocaleDateString(),
        fecha_vencimiento: new Date(deuda.fecha_vencimiento).toLocaleDateString(),
        cliente: deuda.cliente?.name || '--',
        estado: (
            <span style={{ 
                color: getEstadoColor(deuda.estado),
                fontWeight: 'bold',
                textTransform: 'capitalize'
            }}>
                {deuda.estado}
            </span>
        ),
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
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <Filtros options={opciones} />
                <div
                    className={styles.content}
                    onScroll={handleScroll}
                    style={{
                        maxHeight: 'calc(100% - 230px)',
                    }}
                >
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(deuda) => {
                                // Buscar la deuda original sin formatear
                                const deudaOriginal = allDeudas.find(d => d.id === deuda.id);
                                handleDeuda(deudaOriginal);
                            }}
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        allDeudas.length > 0 ? (
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
                            <div className={styles.noData}>
                                <p>{searchQuery ? 'No se encontraron deudas' : 'No hay deudas registradas'}</p>
                            </div>
                        )
                    )}
                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más deudas...</p>
                        </div>
                    )}
                </div>
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
                    onLoadingStart={() => handleLoading(true)}
                    onLoadingEnd={() => handleLoading(false)}
                />
            )}

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
