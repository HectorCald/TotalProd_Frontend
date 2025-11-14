import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerProducto from './VerProducto';
import Filtros from '../../common/Filtros';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import CanastaPedidos from './CanastaPedidos';
import CanastaMovimientos from './CanastaMovimientos';
import CanastaMovimientosEntrada from './CanastaMovimientosEntrada';
import CategoriasAlmacen from './CategoriasAlmacen';
import Notification from '../../common/Notification';
import Select from '../../common/Select';
import HistorialMovimientosOffline from '../movimientos/HistorialMovimientosOffline';
import { obtenerLocal, OFFLINE_DB_NAME, MOVIMIENTOS_SALIDA_STORE } from '../../../utils/indexedDB';
import productsAlmacenService from '../../../services/productsAlmacenService';
import FiltroCategorias from '../../mixed/FiltroCategorias';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FetchData from '../../mixed/FetchData';
import pricesTypesService from '../../../services/pricesTypesService';
import sucursalesService from '../../../services/sucursalesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useUser } from '../../../context/UserContext';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import DescargaMovimientoBuilder from '../movimientos/DescargaMovimientoBuilder';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import useLoadingManager from './hooks/useLoadingManager';
import useProductosFiltrados from './hooks/useProductosFiltrados';
import useAutoCargaCanastas from './hooks/useAutoCargaCanastas';
import limpiarAlmacenLocalStorage from './helpers/limpiarAlmacenLocalStorage';
import useCanastaActions from './hooks/useCanastaActions';


function AlmacenGeneral({ isOpen, setIsOpen, tipo = '', onPedidoActualizado = null, onEntregaConfirmada = null, pedidoIdEditando = null, isRepitiendoMovimiento = false, isVentaCotizacionProp = false, onMovimientoEditado = null }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();

    // Determinar si es modo carrito (para panel lateral)
    const isCartMode = tipo === 'pedido' || tipo === 'entrada' || tipo === 'salida';
    
    // Verificar si es venta de cotización (no es vista principal)
    const isVentaCotizacion = localStorage.getItem('isVentaCotizacion') === 'true';

    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para filtros y modales
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isCategoriasAlmacenOpen, setIsCategoriasAlmacenOpen] = useState(false);
    const [isOfflineMovimientosOpen, setIsOfflineMovimientosOpen] = useState(false);
    const [offlineMovimientos, setOfflineMovimientos] = useState([]);
    const [offlineMovimientosTitulo, setOfflineMovimientosTitulo] = useState('');
    const [offlineMovimientosDescripcion, setOfflineMovimientosDescripcion] = useState('');
    const [isOfflineModeActive, setIsOfflineModeActive] = useState(false);

    // Estados para canasta de pedidos
    const [productosCanasta, setProductosCanasta] = useState([]);
    const [isCanastaOpen, setIsCanastaOpen] = useState(false);

    // Estados para canasta de movimientos (entradas y salidas separadas)
    const [productosCanastaEntradas, setProductosCanastaEntradas] = useState([]);
    const [productosCanastaSalidas, setProductosCanastaSalidas] = useState([]);
    const [isCanastaMovimientosOpen, setIsCanastaMovimientosOpen] = useState(false);
    const [isDescargaMovimientoOpen, setIsDescargaMovimientoOpen] = useState(false);
    const [movimientoIdParaDescarga, setMovimientoIdParaDescarga] = useState(null);

    // Estados para datos
    const [productos, setProductos] = useState([]);
    const [preciosData, setPreciosData] = useState([])
    const [sucursalesData, setSucursalesData] = useState([]);
    
    const shouldShowSpinner = useCallback(() => productos.length === 0, [productos.length]);
    const enableRefreshIndicator = useCallback(() => isLargeScreen, [isLargeScreen]);
    const {
        isLoading,
        showRefreshIndicator,
        isRefreshing,
        handleLoadingStart,
        handleLoadingEnd,
    } = useLoadingManager({
        shouldShowSpinner,
        enableRefreshIndicator,
    });

    // Estados para rastrear qué datos se han cargado
    const [productosLoaded, setProductosLoaded] = useState(false);
    const [preciosLoaded, setPreciosLoaded] = useState(false);
    const [sucursalesLoaded, setSucursalesLoaded] = useState(false);

    // Estados para la notificación
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });
    const mostrarNotificacion = useCallback((tipo, texto) => {
        setNotification({ isVisible: true, type: tipo, text: texto });
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 4000);
    }, []);

    useEffect(() => {
        const updateOfflineFlag = () => {
            try {
                setIsOfflineModeActive(localStorage.getItem('offline_network_block') === 'true');
            } catch {
                setIsOfflineModeActive(false);
            }
        };
        updateOfflineFlag();
        const handler = () => updateOfflineFlag();
        window.addEventListener('offline-mode-changed', handler);
        window.addEventListener('storage', handler);
        return () => {
            window.removeEventListener('offline-mode-changed', handler);
            window.removeEventListener('storage', handler);
        };
    }, []);

    const handleOfflineMovimientosSelect = useCallback(async (option) => {
        if (!isOfflineModeActive) {
            return;
        }
        try {
            const movimientos = await obtenerLocal(MOVIMIENTOS_SALIDA_STORE, OFFLINE_DB_NAME);
            if (!Array.isArray(movimientos) || movimientos.length === 0) {
                return;
            }

            const data = option === 'ultimo'
                ? [movimientos[movimientos.length - 1]]
                : [...movimientos].reverse();

            setOfflineMovimientos(data);
            setOfflineMovimientosTitulo(option === 'ultimo' ? 'Último movimiento offline' : 'Movimientos offline');
            setOfflineMovimientosDescripcion(option === 'ultimo'
                ? 'Detalle del último movimiento guardado sin conexión.'
                : 'Historial de movimientos pendientes por sincronizar.');
            setIsOfflineMovimientosOpen(true);
        } catch (error) {
            console.error('Error cargando movimientos offline:', error);
            mostrarNotificacion('error', 'No se pudo cargar el historial offline.');
        }
    }, [isOfflineModeActive, mostrarNotificacion]);

    const {
        handleAgregarACanasta,
        handleAgregarACanastaMovimientos,
        getCantidadEnCanasta,
        getCantidadEnCanastaMovimientos,
    } = useCanastaActions({
        setProductosCanasta,
        setProductosCanastaEntradas,
        setProductosCanastaSalidas,
        productosCanasta,
        productosCanastaEntradas,
        productosCanastaSalidas,
        mostrarNotificacion,
    });

    // Función para manejar cuando se cargan los precios
    const handlePreciosLoaded = useCallback((data) => {
        setPreciosData(data);
        setPreciosLoaded(true);
    }, []);
    
    // Función para manejar cuando se cargan las sucursales
    const handleSucursalesLoaded = useCallback((data) => {
        setSucursalesData(data);
        setSucursalesLoaded(true);
    }, []);

    const {
        productosMapeados,
        productosFiltrados,
        visibleItems,
        handleScroll: handleProductosScroll,
        searchQuery,
        isSearchExpanded,
        categoriaFiltro,
        categoriaFiltroNombre,
        ordenamiento,
        handleSearchChange,
        handleSearchClear,
        handleSearchNormalizedChange,
        handleSearchToggle,
        handleCategoriaFilter,
        handleOrdenamiento,
        getCategoriaNombre,
        getOrdenamientoNombre,
        resetFilters,
    } = useProductosFiltrados({
        productos,
        paginaTamano: 30,
    });
    const preciosTipos = preciosData.map(precio => ({
        value: precio.id,
        label: precio.name,
        id: precio.id,
        name: precio.name,
        default_value: precio.default_value
    }));
    const sucursales = sucursalesData
        .filter(sucursal => sucursal.id !== sucursalActual?.id)
        .map(sucursal => ({
            value: sucursal.id,
            label: sucursal.name,
            id: sucursal.id,
            name: sucursal.name
        }));



    // Función para manejar cuando se cargan los productos
    const handleProductosLoaded = useCallback((data) => {
        let productosProcesados = data;

        const productosEdicionStorage = localStorage.getItem('productosEdicion');
        if (productosEdicionStorage) {
            try {
                const productosEdicion = JSON.parse(productosEdicionStorage);
                if (Array.isArray(productosEdicion) && productosEdicion.length > 0) {
                    const cantidadesMap = productosEdicion.reduce((acc, productoEdicion) => {
                        const idProducto = productoEdicion?.id;
                        const cantidad = Number(productoEdicion?.cantidad) || 0;
                        if (!idProducto || cantidad <= 0) return acc;
                        acc[idProducto] = (acc[idProducto] || 0) + cantidad;
                        return acc;
                    }, {});

                    if (Object.keys(cantidadesMap).length > 0) {
                        productosProcesados = data.map((producto) => {
                            const extra = cantidadesMap[producto.id];
                            if (!extra) return producto;
                            const stockActual = Number(producto.stock) || 0;
                            return {
                                ...producto,
                                stock: stockActual + extra
                            };
                        });
                    }
                }
            } catch (error) {
                console.error('Error aplicando stock temporal de edición:', error);
            }
        }

        setProductos(productosProcesados);
        setProductosLoaded(true);
    }, []);

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await productsAlmacenService.getAll();
            if (response.success) {
                handleProductosLoaded(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar productos:', error);
        }
    };



    // Función para manejar el click en un producto
    const handleRegistro = useCallback((producto, tipo) => {
        setInfoPersona(producto);
        if (tipo === 'almacen') {
            setIsOpenVerProducto(true);
        } else if (tipo === 'pedido') {
            // Agregar producto a la canasta de pedidos
            handleAgregarACanasta(producto);
        } else if (tipo === 'entrada' || tipo === 'salida') {
            // Agregar producto a la canasta de movimientos (entrada o salida)
            handleAgregarACanastaMovimientos(producto, tipo);
        }
    }, [handleAgregarACanasta, handleAgregarACanastaMovimientos]);


    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            resetFilters();
            
            // Resetear estados de carga
            setProductosLoaded(false);
            setPreciosLoaded(false);
            setSucursalesLoaded(false);

            // Si no se pasan los props específicos, no se está repitiendo un movimiento y no es venta de cotización, limpiar localStorage
            if (!onPedidoActualizado && !onEntregaConfirmada && !pedidoIdEditando && !isRepitiendoMovimiento && !isVentaCotizacionProp) {
                limpiarAlmacenLocalStorage();
            }

            // Cargar canastas desde localStorage
            cargarCanastasDesdeLocalStorage();
        }
    }, [isOpen, onPedidoActualizado, onEntregaConfirmada, pedidoIdEditando, isRepitiendoMovimiento, isVentaCotizacionProp, resetFilters]);


   

    // Función para manejar cuando se crea un nuevo producto
    const handleProductCreated = (newProduct) => {
        // Actualizar el estado local con el producto que devuelve el servidor
        setProductos(prevProductos => [newProduct, ...prevProductos]);

        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Producto agregado correctamente');
    };
    // Función para manejar cuando se elimina un producto
    const handleProductDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el producto eliminado
        setProductos(prevProductos => prevProductos.filter(producto => producto.id !== deletedId));

        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto eliminado correctamente');
    };
    // Función para manejar cuando se actualiza un producto
    const handleProductUpdated = (updatedProduct) => {
        // Actualizar el estado local con el producto actualizado que devuelve el servidor
        setProductos(prevProductos => prevProductos.map(producto =>
            producto.id === updatedProduct.id ? updatedProduct : producto
        ));

        // Actualizar también el producto que se está viendo
        setInfoPersona(updatedProduct);
        // NO cerrar el modal de ver producto - se mantiene abierto para mostrar los cambios
        // setIsOpenVerProducto(false);
        // Mostrar notificación
        mostrarNotificacion('success', 'Producto actualizado correctamente');
    };
    // Función para manejar cuando se actualizan múltiples productos (después de movimientos)
    const handleProductosUpdated = (productosActualizados) => {
        // Actualizar solo el stock de los productos que cambiaron
        setProductos(prevProductos =>
            prevProductos.map(producto => {
                const productoActualizado = productosActualizados.find(p => p.id === producto.id);
                if (productoActualizado) {
                    // Solo actualizar el stock, mantener todos los demás datos del producto
                    return {
                        ...producto,
                        stock: productoActualizado.stock
                    };
                }
                return producto;
            })
        );
    };

    // Función para cargar canastas desde localStorage
    const cargarCanastasDesdeLocalStorage = () => {
        try {
            // Cargar canasta de pedidos
            const canastaPedidos = localStorage.getItem('canastaPedidos');
            if (canastaPedidos) {
                const productosPedidos = JSON.parse(canastaPedidos);

                // Si es edición de pedido, actualizar el stock de los productos con los datos actuales
                if (localStorage.getItem('pedidoIdEditando')) {
                    const productosConStockActualizado = productosPedidos.map(productoCanasta => {
                        const productoActual = productosMapeados.find(p => p.id === productoCanasta.id);
                        return {
                            ...productoCanasta,
                            stock: productoActual?.stock || 0
                        };
                    });
                    setProductosCanasta(productosConStockActualizado);
                } else {
                    setProductosCanasta(productosPedidos);
                }
            }

            // Cargar canasta de entradas
            const canastaEntradas = localStorage.getItem('canastaEntradas');
            if (canastaEntradas) {
                const productosEntradas = JSON.parse(canastaEntradas);
                setProductosCanastaEntradas(productosEntradas);
            }

            // Cargar canasta de salidas
            const canastaSalidas = localStorage.getItem('canastaSalidas');
            if (canastaSalidas) {
                const productosSalidas = JSON.parse(canastaSalidas);
                setProductosCanastaSalidas(productosSalidas);
            }
        } catch (error) {
            console.error('Error al cargar canastas desde localStorage:', error);
        }
    };


    // Función para obtener el nombre de la categoría seleccionada
    const opciones = [
        {
            label: getCategoriaNombre(),
            active: categoriaFiltro !== null,
            onClick: () => setOpenCategoria(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'nombre_asc',
            onClick: () => setOpenOrden(true)
        },
    ];


    // Headers para la tabla
    const tableHeaders = tipo === 'almacen' ? [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'codigo_barras', label: 'C. Barras', icon: 'barcode' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ] : [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ];
    // Datos para la tabla
    const tableData = visibleItems.map(producto => {
        const baseData = {
            id: producto.id,
            name: producto.name,
            stock: `${producto.stock} Ud.`,
            stock_grup: producto.grup ? Math.floor(producto.stock / producto.grup) + ' Ud.' : '--',
            category_name: producto.category_name,
            stock_minimo: producto.stock_minimo, // AGREGAR stock_minimo
        };
        
        // Solo incluir código de barras en modo almacén
        if (tipo === 'almacen') {
            baseData.codigo_barras = producto.codigo_barras;
        }
        
        return baseData;
    });

    // Función para obtener el badge
    const getBadge = (producto) => {
        if (tipo === 'entrada' || tipo === 'salida') {
            const cantidadEnCanastaMovimientos = getCantidadEnCanastaMovimientos(producto.id, tipo);
            return cantidadEnCanastaMovimientos > 0 ? cantidadEnCanastaMovimientos : null;
        } else if (tipo === 'pedido') {
            const cantidadEnCanasta = getCantidadEnCanasta(producto.id);
            return cantidadEnCanasta > 0 ? cantidadEnCanasta : null;
        }
        return null;
    };

    // Función para obtener el badge de celda (COPIADO EXACTO de PanelMovimientos.jsx)
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'stock') {
            const stock = parseFloat(item.stock || 0);
            const stockMinimo = parseFloat(item.stock_minimo || 0);
            
            // Solo mostrar azul si stock_minimo es null/undefined (no definido)
            if (item.stock_minimo === null || item.stock_minimo === undefined) {
                return {
                    text: `${stock} Ud.`,
                    className: 'info' // azul
                };
            }
            
            const diferencia = stock - stockMinimo;
            let className = 'info'; // azul por defecto
            
            if (diferencia >= 20) {
                className = 'info'; // azul - Stock OK
            } else if (diferencia >= 5) {
                className = 'warning'; // naranja - Stock Bajo
            } else {
                className = 'error'; // rojo - Stock Crítico (incluye cuando stock = stock_minimo)
            }
            
            return {
                text: `${stock} Ud.`,
                className: className
            };
        }
        return null;
    };

    // Función para obtener el flot del stock en ItemView (móvil)
    const getStockFlot = (producto) => {
        const stock = parseFloat(producto.stock || 0);
        const stockMinimo = parseFloat(producto.stock_minimo || 0);
        const grup = parseFloat(producto.grup || 0);
        
        // Determinar qué mostrar: grupos si está agrupado, unidades si no
        const stockDisplay = grup > 0 
            ? `${Math.floor(stock / grup)} g.`
            : `${stock} Ud.`;
        
        // Solo usar flot1 (azul) si stock_minimo es null/undefined (no definido)
        if (producto.stock_minimo === null || producto.stock_minimo === undefined) {
            return {
                flot1: stockDisplay,
                flot2: null,
                flot3: null
            };
        }
        
        const diferencia = stock - stockMinimo;
        
        if (diferencia >= 20) {
            // Stock OK - flot1 (azul)
            return {
                flot1: stockDisplay,
                flot2: null,
                flot3: null
            };
        } else if (diferencia >= 5) {
            // Stock Bajo - flot2 (naranja)
            return {
                flot1: null,
                flot2: stockDisplay,
                flot3: null
            };
        } else {
            // Stock Crítico - flot3 (rojo) - incluye cuando stock = stock_minimo
            return {
                flot1: null,
                flot2: null,
                flot3: stockDisplay
            };
        }
    };

    useAutoCargaCanastas({
        isOpen,
        tipo,
        productos,
        onAgregarProductoPedido: handleAgregarACanasta,
        onAgregarProductoMovimiento: handleAgregarACanastaMovimientos,
    });

    return (
        <>
            <View
                isOpen={isOpen}
                setIsOpen={setIsOpen}
                isMainView={
                    !pedidoIdEditando &&
                    !localStorage.getItem('pedidoIdEntregando') &&
                    !(localStorage.getItem('productosMovimientoRepitiendo') || localStorage.getItem('productosMovimientoEditando')) &&
                    !isVentaCotizacion &&
                    !isRepitiendoMovimiento
                }
            >
                <HeaderView
                    onBack={() => {
                        limpiarAlmacenLocalStorage();
                        setTimeout(() => {
                            setIsOpen(false);
                        }, 100);
                    }}
                    showSearch={true}
                    searchPlaceholder="Buscar producto"
                    title={tipo === 'almacen' ? 'Almacén' : tipo === 'entrada' ? 'Entradas' : tipo === 'pedido' ? 'Realizar Pedidos' : 'Salidas o Ventas'}
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchClear={handleSearchClear}
                    onSearchNormalizedChange={handleSearchNormalizedChange}
                    searchExpanded={isSearchExpanded}
                    onSearchToggle={handleSearchToggle}
                    withCart={isCartMode && isLargeScreen}
                />
                <div className={`${styles.container} ${isCartMode && isLargeScreen ? styles.containerWithCart : ''}`}>
                    {isLoading ? (
                        // Mostrar LoadingSpinner cuando está cargando
                        <LoadingSpinner />
                    ) : (
                        <>
                            {isLargeScreen && (
                                <div className={styles.titleContainer}>
                                    <RefreshIndicator
                                        isVisible={showRefreshIndicator}
                                        isLoading={isRefreshing}
                                    />
                                </div>
                            )}
                            <Filtros options={opciones} />
                            {isLargeScreen ? (
                                // Vista de tabla para pantallas grandes
                                <div 
                                    className={styles.content}
                                    onScroll={handleProductosScroll}
                                    style={{
                                        maxHeight: (tipo === 'entrada' || tipo === 'salida' || tipo === 'pedido') && isLargeScreen
                                            ? '100vh'
                                            : '',
                                        overflowY: 'auto'
                                    }}
                                >
                                    <Table
                                        headers={tableHeaders}
                                        data={tableData}
                                        onRowClick={(producto) => {
                                            // Buscar el producto original sin formatear
                                            const productoOriginal = productosFiltrados.find(p => p.id === producto.id);
                                            handleRegistro(productoOriginal, tipo);
                                        }}
                                        getBadge={getBadge}
                                        getCellBadge={getCellBadge}
                                        onScroll={handleProductosScroll}
                                        columnWidths={{
                                            name: '25%',
                                            codigo_barras: '15%',
                                            stock: '15%',
                                            stock_grup: '15%',
                                            category_name: '15%'
                                        }}
                                    />
                                </div>
                            ) : (
                                // Vista de cards para pantallas pequeñas con PullToRefresh
                                <PullToRefresh
                                    onRefresh={handleRefresh}
                                    screenName="Almacén"
                                    containerStyle={{
                                        maxHeight: 'calc(100% - 80px)',
                                        minHeight: 'calc(100% - 80px)'
                                    }}
                                    onScroll={handleProductosScroll}
                                >
                                        {visibleItems.length > 0 ? (
                                            visibleItems.map((producto, index) => {
                                                const cantidadEnCanasta = getCantidadEnCanasta(producto.id);
                                                const cantidadEnCanastaMovimientos = (tipo === 'entrada' || tipo === 'salida')
                                                    ? getCantidadEnCanastaMovimientos(producto.id, tipo)
                                                    : 0;
                                                
                                                // Obtener el flot del stock con colores dinámicos
                                                const stockFlot = getStockFlot(producto);
                                                
                                                return (
                                                    <ItemView
                                                        key={producto.id || index}
                                                        title={producto.name || 'Sin nombre'}
                                                        description={producto.description || 'Sin descripción'}
                                                        icon="box"
                                                        onClick={() => handleRegistro(producto, tipo)}
                                                        entrada={tipo === 'pesaje' ? true : false}
                                                        entradaData={[
                                                            { name: "Prima", value: 0 },
                                                            { name: "Bruta", value: 0 },
                                                        ]}
                                                        badge={
                                                            (tipo === 'pedido' && cantidadEnCanasta > 0) ||
                                                                ((tipo === 'entrada' || tipo === 'salida') && cantidadEnCanastaMovimientos > 0)
                                                                ? (tipo === 'pedido' ? cantidadEnCanasta : cantidadEnCanastaMovimientos)
                                                                : null
                                                        }
                                                        flot1={stockFlot.flot1}
                                                        flot2={stockFlot.flot2}
                                                        flot3={stockFlot.flot3}
                                                    />
                                                );
                                            })
                                        ) : (
                                            <NoData 
                                                icon="box"
                                                title={searchQuery || categoriaFiltro !== null ? 'Sin resultados' : 'No hay productos'}
                                                detail={searchQuery || categoriaFiltro !== null ? 'Intenta ajustar los filtros de búsqueda para encontrar los productos que necesitas' : 'Agrega productos al almacén para comenzar a gestionar tu inventario general'}
                                                transparent={true}
                                                minHeight="200px"
                                            />
                                        )}
                                 
                                </PullToRefresh>
                            )}
                        </>
                    )}
                </div>
                {tipo === 'almacen' ?
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-default'
                            label='Categorias'
                            onClick={() => { setIsCategoriasAlmacenOpen(true); }}
                        />
                        <Boton
                            className='btn-original'
                            label='Nuevo producto'
                            onClick={() => { setIsAgregarOpen(true); }}
                        />
                    </div> : ''}
                {tipo === 'pedido' && !(isCartMode && isLargeScreen) ?
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label={`Canasta (${productosCanasta.length})`}
                            onClick={() => setIsCanastaOpen(true)}
                            disabled={productosCanasta.length === 0}
                        />
                    </div> : ''}
                {tipo === 'entrada' && !(isCartMode && isLargeScreen) ?
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label={`Canasta (${productosCanastaEntradas.length})`}
                            onClick={() => setIsCanastaMovimientosOpen(true)}
                            disabled={productosCanastaEntradas.length === 0}
                        />
                    </div> : ''}
                {tipo === 'salida' && !(isCartMode && isLargeScreen) ?
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label={`Canasta (${productosCanastaSalidas.length})`}
                            onClick={() => setIsCanastaMovimientosOpen(true)}
                            disabled={productosCanastaSalidas.length === 0}
                        />
                    </div> : ''}
                {/* Modal de ver registro*/}
                <VerProducto
                    isOpen={isOpenVerProducto}
                    setIsOpen={setIsOpenVerProducto}
                    registro={infoPersona}
                    onProductDeleted={handleProductDeleted}
                    onProductUpdated={handleProductUpdated}
                    preciosTipos={preciosTipos}
                    loadingPrecios={false}
                />

                {/* Modal de editar*/}
                <EditarAgregar
                    isOpen={isAgregarOpen}
                    setIsOpen={setIsAgregarOpen}
                    tipo='agregar'
                    onProductCreated={handleProductCreated}
                    preciosTipos={preciosTipos}
                    loadingPrecios={false}
                />

                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />
                {tipo === 'salida' && isOfflineModeActive && (
                    <div
                        style={{
                            position: 'fixed',
                            bottom: '90px',
                            right: '15px',
                            zIndex: 200
                        }}
                    >
                        <Select
                            icon="history"
                            iconOnly={true}
                            options={[
                                { value: 'historial', label: 'Historial offline', icon: 'history' },
                                { value: 'ultimo', label: 'Último movimiento', icon: 'time-five' }
                            ]}
                            onChange={handleOfflineMovimientosSelect}
                            dropdownDirection="right"
                            containerStyle={{ background: 'none' }}
                        />
                    </div>
                )}
                <HistorialMovimientosOffline
                    isOpen={isOfflineMovimientosOpen}
                    setIsOpen={setIsOfflineMovimientosOpen}
                    movimientos={offlineMovimientos}
                    titulo={offlineMovimientosTitulo}
                    descripcion={offlineMovimientosDescripcion}
                    onClose={handleRefresh}
                />

                {/* Carga de datos - solo cuando está abierto */}
                {isOpen && (
                    <>
                        <FetchData
                            service={productsAlmacenService}
                            serviceName="productsAlmacenService"
                            isOpen={isOpen}
                            onDataLoaded={handleProductosLoaded}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                        <FetchData
                            service={pricesTypesService}
                            serviceName="pricesTypesService"
                            isOpen={isOpen}
                            onDataLoaded={handlePreciosLoaded}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                        <FetchData
                            service={sucursalesService}
                            serviceName="sucursalesService"
                            method="getByEmpresaId"
                            isOpen={isOpen}
                            onDataLoaded={handleSucursalesLoaded}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                    </>
                )}
                {/* View de canasta de pedidos */}
                <CanastaPedidos
                    isOpen={isCartMode && isLargeScreen ? true : isCanastaOpen}
                    setIsOpen={setIsCanastaOpen}
                    productosCanasta={productosCanasta}
                    setProductosCanasta={setProductosCanasta}
                    pedidoId={pedidoIdEditando}
                    onPedidoActualizado={onPedidoActualizado}
                    preciosTipos={preciosTipos}
                    sucursales={sucursales}
                    loadingPrecios={false}
                    loadingSucursales={false}
                    productosActualizados={productos}
                    isCartMode={isCartMode && isLargeScreen}
                    onCerrarCanasta={() => {
                        setIsCanastaOpen(false);
                        // Limpiar pedidoIdEditando y precioIdEditando del localStorage cuando se confirma la edición
                        localStorage.removeItem('pedidoIdEditando');
                        localStorage.removeItem('precioIdEditando');

                        // Si estamos editando un pedido, limpiar la canasta
                        if (pedidoIdEditando) {
                            setProductosCanasta([]);
                            localStorage.removeItem('canastaPedidos');
                        }

                        mostrarNotificacion('success', pedidoIdEditando ? 'Pedido actualizado correctamente' : 'Pedido confirmado correctamente');
                    }}
                />

                {/* View de canasta de movimientos */}
                {tipo === 'entrada' && (
                    <CanastaMovimientosEntrada
                        isOpen={isCartMode && isLargeScreen ? true : isCanastaMovimientosOpen}
                        setIsOpen={setIsCanastaMovimientosOpen}
                        productosCanasta={productosCanastaEntradas}
                        setProductosCanasta={setProductosCanastaEntradas}
                        tipoMovimiento={'entrada'}
                        onProductosUpdated={handleProductosUpdated}
                        preciosTipos={preciosTipos}
                        loadingPrecios={false}
                        productosActualizados={productos}
                        isCartMode={isCartMode && isLargeScreen}
                        onCerrarCanasta={(productosActualizados, precioId, movimientoId) => {
                            setIsCanastaMovimientosOpen(false);
                            mostrarNotificacion('success', 'Entradas confirmadas correctamente');
                            if (movimientoId) {
                                setMovimientoIdParaDescarga(movimientoId);
                                setIsDescargaMovimientoOpen(true);
                            }
                        }}
                    />
                )}
                {tipo === 'salida' && (
                    <CanastaMovimientos
                        isOpen={isCartMode && isLargeScreen ? true : isCanastaMovimientosOpen}
                        setIsOpen={setIsCanastaMovimientosOpen}
                        productosCanasta={productosCanastaSalidas}
                        setProductosCanasta={setProductosCanastaSalidas}
                        tipoMovimiento={tipo}
                        esEntrega={!!localStorage.getItem('pedidoIdEntregando')}
                        onProductosUpdated={handleProductosUpdated}
                        preciosTipos={preciosTipos}
                        loadingPrecios={false}
                        productosActualizados={productos}
                        isCartMode={isCartMode && isLargeScreen}
                        onPedidoActualizado={onPedidoActualizado}
                    isEditandoMovimiento={!!localStorage.getItem('fechaMovimientoEditando')}
                    movimientoIdEditando={localStorage.getItem('movimientoIdEditando')}
                    numeroOrdenEditando={localStorage.getItem('numeroOrdenEditando')}
                    onMovimientoEditado={onMovimientoEditado}
                        onCerrarCanasta={(productosActualizados, precioId, movimientoId, pedidoActualizadoData) => {
                            // Si es una entrega, llamar a la función de entrega
                            if (onEntregaConfirmada && localStorage.getItem('pedidoIdEntregando')) {
                                onEntregaConfirmada(productosActualizados, precioId, movimientoId, pedidoActualizadoData);
                                // Para entregas, NO cerrar la canasta automáticamente en PC (modo carrito)
                                // Solo cerrar en móvil (cuando no es modo carrito)
                                if (!(isCartMode && isLargeScreen)) {
                                    setIsCanastaMovimientosOpen(false);
                                }
                            } else {
                                // Para movimientos normales, cerrar la canasta y mostrar notificación
                                setIsCanastaMovimientosOpen(false);
                                mostrarNotificacion('success', 'Salidas confirmadas correctamente');
                            }
                            if (movimientoId) {
                                setMovimientoIdParaDescarga(movimientoId);
                                setIsDescargaMovimientoOpen(true);
                            }
                        }}
                    />
                )}

                {/* Modal de descarga del movimiento generado */}
                <DescargaMovimientoBuilder
                    isOpen={isDescargaMovimientoOpen}
                    setIsOpen={setIsDescargaMovimientoOpen}
                    movimientoId={movimientoIdParaDescarga}
                />

                {/* Modal de Categorías de Almacén */}
                <CategoriasAlmacen
                    isOpen={isCategoriasAlmacenOpen}
                    setIsOpen={setIsCategoriasAlmacenOpen}
                />
            </View>
            {/* Filtro de categorías */}
            <FiltroCategorias
                isOpen={isOpenCategoria}
                setIsOpen={setOpenCategoria}
                onCategoriaSeleccionada={handleCategoriaFilter}
            />
            {/* Filtro de ordenamiento */}
            <FiltroOrdenamiento
                isOpen={isOpenOrden}
                setIsOpen={setOpenOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
                opciones={[
                    { value: 'nombre_asc', label: 'Nombre A-Z', icon: 'sort-a-z' },
                    { value: 'nombre_desc', label: 'Nombre Z-A', icon: 'sort-z-a' },
                    { value: 'stock_asc', label: 'Stock ↑', icon: 'up-arrow-alt' },
                    { value: 'stock_desc', label: 'Stock ↓', icon: 'down-arrow-alt' }
                ]}
            />
        </>
    );
}
export default AlmacenGeneral;