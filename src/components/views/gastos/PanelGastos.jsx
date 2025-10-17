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
import RefreshIndicator from '../../common/RefreshIndicator';
import Boton from '../../common/Boton';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FetchData from '../../mixed/FetchData';
import FiltroMetodoPago from '../../mixed/FiltroMetodoPago';
import FiltroOrdenamientoGastos from '../../mixed/FiltroOrdenamientoGastos';

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
    
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    
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

    // Callback para manejar los gastos cargados
    const handleGastosLoaded = useCallback((data) => {
        setGastos(data);
    }, []);

    // Callback para manejar el estado de carga
    const handleLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
    }, []);

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
    const [isOpenMetodoPago, setOpenMetodoPago] = useState(false);
    const [isOpenProveedor, setOpenProveedor] = useState(false);

    // Función para manejar el click en un gasto
    const handleGasto = (gasto) => {
        setInfoGasto(gasto);
        setIsOpenVerGasto(true);
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        
        try {
            const response = await gastosService.getAll(currentPage, 10, debouncedSearchQuery, filtroMetodoPago, filtroProveedor, ordenamiento);
            if (response.success) {
                setGastos(response.data);
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
            console.error('Error al refrescar gastos:', error);
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

    // Efecto para manejar errores
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo gastos:', error);
        }
    }, [error]);

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

    // Datos para la tabla
    const tableData = allGastos.map(gasto => ({
        id: gasto.id,
        concepto: gasto.concepto || 'Sin concepto',
        fecha: new Date(gasto.fecha_gasto).toLocaleDateString(),
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
                        maxHeight: 'calc(100% - 130px)',
                    }}
                >
                    {isLargeScreen ? (
                        // Vista de tabla para pantallas grandes
                        <Table
                            headers={tableHeaders}
                            data={tableData}
                            onRowClick={(gasto) => {
                                // Buscar el gasto original sin formatear
                                const gastoOriginal = allGastos.find(g => g.id === gasto.id);
                                handleGasto(gastoOriginal);
                            }}
                        />
                    ) : (
                        // Vista de cards para pantallas pequeñas
                        allGastos.length > 0 ? (
                            allGastos.map((gasto, index) => {
                                return (
                                    <ItemView
                                        key={gasto.id || index}
                                        title={gasto.concepto || 'Sin concepto'}
                                        description={`${new Date(gasto.fecha_gasto).toLocaleDateString()} • ${gasto.metodo_pago || 'Sin método de pago'}${gasto.proveedor?.name ? ` • ${gasto.proveedor.name}` : ''}`}
                                        icon='money'
                                        onClick={() => handleGasto(gasto)}
                                        arrow={false}
                                        flot3={`Bs. ${(gasto.valor || 0).toFixed(2)}`}
                                    />
                                );
                            })
                        ) : (
                            <div className={styles.noData}>
                                <p>{searchQuery ? 'No se encontraron gastos' : 'No hay gastos registrados'}</p>
                            </div>
                        )
                    )}
                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más gastos...</p>
                        </div>
                    )}
                </div>
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
                    onLoadingStart={() => handleLoading(true)}
                    onLoadingEnd={() => handleLoading(false)}
                />
            )}

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
