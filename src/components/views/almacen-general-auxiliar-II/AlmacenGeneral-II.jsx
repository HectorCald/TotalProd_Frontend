import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemProduct from '../../common/ItemProduct';
import Filtros from '../../common/Filtros';
import FiltroCategorias from '../../mixed/FiltroCategorias';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FetchData from '../../mixed/FetchData';
import productsAlmacenService from '../../../services/productsAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import { useUser } from '../../../context/UserContext';
import Table from '../../common/Table';
import Boton from '../../common/Boton';
import CanastaTransferencias from './CanastaTransferencias';
import { useToast } from '../../../context/ToastContext';
import useVirtualPagination from '../../../hooks/useVirtualPagination';
import useLoadingManager from '../almacen-general/hooks/useLoadingManager';
import useProductosFiltrados from '../almacen-general/hooks/useProductosFiltrados';
import useCanastaActions from '../almacen-general/hooks/useCanastaActions';
import calcularStockDisponible from '../almacen-general/hooks/useStockDisponible';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import limpiarAlmacenLocalStorage from '../almacen-general/helpers/limpiarAlmacenLocalStorage';
import useSessionCache from '../../../hooks/useSessionCache';

function AlmacenGeneralII({ isOpen, setIsOpen, tipo = 'almacen', isRepitiendoTransferencia = false }) {
    const { isLargeScreen } = useLayout();
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { showSuccess, showDanger } = useToast();
    
    // Obtener empresaId de la sucursal seleccionada
    const empresaId = sucursalActual?.empresas?.id || null;

    // Determinar si es modo carrito (para panel lateral)
    const isCartMode = tipo === 'transferir' && isLargeScreen;

    // UI envío
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Estados para filtros locales
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    
    // Prop interno para determinar si mostrar solo productos con stock > 0
    // true para transferir y salida, false para entrada, almacen y pedido
    const ocultarStockCero = tipo === 'transferir' || tipo === 'salida';

    // Estados para datos (compartidos con AlmacenGeneral principal)
    const {
        value: productos,
        setValue: setProductos,
        hasCache: hasProductosCache,
    } = useSessionCache({
        key: 'almacenGeneralProductos',
        defaultValue: [],
    });
    const {
        value: preciosData,
        setValue: setPreciosData,
        hasCache: hasPreciosCache,
    } = useSessionCache({
        key: 'almacenGeneralPrecios',
        defaultValue: [],
    });
    
    // Estados para rastrear qué datos se han cargado
    const [productosLoaded, setProductosLoaded] = useState(false);
    const [preciosLoaded, setPreciosLoaded] = useState(false);

    // Estados para canasta de transferencias
    const [productosCanastaTransferencias, setProductosCanastaTransferencias] = useState([]);
    const [isCanastaTransferenciasOpen, setIsCanastaTransferenciasOpen] = useState(false);

    const {
        handleAgregarACanasta: agregarProductoTransferencia,
        getCantidadEnCanasta: getCantidadEnCanastaTransferencias,
    } = useCanastaActions({
        setProductosCanasta: setProductosCanastaTransferencias,
        productosCanasta: productosCanastaTransferencias,
        pedidosConfig: {
            precioGetterName: 'getPrecioSeleccionadoCanastaTransferencias',
            modoGetterName: 'getModoAgrupacionCanastaTransferencias',
            extraItemFields: () => ({}),
        },
    });

    const shouldShowSpinner = useCallback(() => productos.length === 0, [productos.length]);
    const enableRefreshIndicator = useCallback(() => true, []);
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


    const preciosTipos = preciosData.map(precio => ({
        value: precio.id,
        label: precio.name,
        id: precio.id,
        name: precio.name,
        default_value: precio.default_value
    }));



    // Handlers de carga de datos
    const handleProductosLoaded = useCallback((data) => {
        const empresaIdActual = sucursalActual?.empresas?.id;
        let productosProcesados = data.map(producto => ({
            ...producto,
            es_asociado: producto.empresa_id && empresaIdActual && producto.empresa_id !== empresaIdActual
        }));

        setProductos(productosProcesados);
        setProductosLoaded(true);
    }, [tipo, sucursalActual]);


    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await productsAlmacenService.getAll(ocultarStockCero);
            if (response.success) {
                handleProductosLoaded(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar productos:', error);
        }
    };
    const handlePreciosLoaded = useCallback((data) => {
        setPreciosData(data);
        setPreciosLoaded(true);
    }, [setPreciosData]);

    // Función para manejar cuando se actualizan múltiples productos (después de transferencias)
    const handleProductosUpdated = useCallback((productosActualizados) => {
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
    }, []);

    const {
        productosMapeados,
        productosFiltrados: productosFiltradosBase,
        visibleItems: visibleItemsBase,
        handleScroll: handleProductosScroll,
        searchQuery,
        isSearchExpanded,
        categoriaFiltro,
        categoriaFiltroNombres,
        ordenamiento,
        handleSearchChange,
        handleSearchClear,
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

    // Ya no necesitamos filtrar stock 0 aquí, se hace en el backend
    const productosFiltrados = productosFiltradosBase;

    // Recalcular visibleItems
    const { visibleItems, handleScroll: handleStockScroll } = useVirtualPagination(productosFiltrados, 30);

    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            resetFilters();

            // Resetear estados de carga
            setProductosLoaded(hasProductosCache && productos.length > 0);
            setPreciosLoaded(hasPreciosCache && preciosData.length > 0);
        }
    }, [isOpen, isLargeScreen, resetFilters, hasProductosCache, productos.length]);

    // Efecto para cargar productos de transferencia cuando se repite
    useEffect(() => {
        if (!isOpen || tipo !== 'transferir') return;
        if (productos.length === 0) return;

        const productosTransferenciaRepitiendo = localStorage.getItem('productosTransferenciaRepitiendo');
        if (!productosTransferenciaRepitiendo) return;

        try {
            const productosParaRepetir = JSON.parse(productosTransferenciaRepitiendo);
            productosParaRepetir.forEach(productoTransferencia => {
                const productoCompleto = productos.find(p => p.id === productoTransferencia.id);
                if (productoCompleto) {
                    agregarProductoTransferencia(productoCompleto, productoTransferencia.cantidad);
                }
            });
            setTimeout(() => {
                localStorage.removeItem('productosTransferenciaRepitiendo');
            }, 1000);
        } catch (error) {
            console.error('Error al cargar productos de la transferencia para repetir:', error);
        }
    }, [isOpen, productos, tipo, agregarProductoTransferencia]);

    const opciones = [
        {
            label: getCategoriaNombre(),
            active: categoriaFiltro && categoriaFiltro.length > 0,
            onClick: () => setOpenCategoria(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'nombre_asc',
            onClick: () => setOpenOrden(true)
        },
    ];

    // Headers y datos para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ];

    // Función para obtener el badge
    const getBadge = (producto) => {
        if (tipo === 'transferir') {
            const cantidadEnCanasta = getCantidadEnCanastaTransferencias(producto.id);
            return cantidadEnCanasta > 0 ? cantidadEnCanasta : null;
        }
        return null;
    };

    // Función para obtener el badge de celda
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'stock' && tipo === 'transferir') {
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


    const tableData = visibleItems
        .map(producto => {
            return {
                id: producto.id,
                name: producto.name,
                stock: `${producto.stock} Ud.`,
                stock_grup: producto.grup ? Math.floor(producto.stock / producto.grup) + ' Ud.' : '--',
                category_name: producto.category_name,
                stock_minimo: producto.stock_minimo,
            };
        });

    // Función para manejar el click en un producto (solo para modo transferir)
    const handleProductoClick = (producto) => {
        if (tipo === 'transferir') {
            agregarProductoTransferencia(producto);
        }
    };

    // Funciones para actualizar cantidad desde ItemProduct (para transferencias)
    const handleCantidadChange = useCallback((productoId, nuevaCantidad) => {
        const producto = productosFiltrados.find(p => p.id === productoId);
        if (!producto) return;

        const cantidadNueva = Math.max(0, nuevaCantidad);

        if (cantidadNueva === 0) {
            setProductosCanastaTransferencias(prev => prev.filter(p => p.id !== productoId));
        } else {
            const productoEnCanasta = productosCanastaTransferencias.find(p => p.id === productoId);
            if (productoEnCanasta) {
                setProductosCanastaTransferencias(prev => prev.map(p =>
                    p.id === productoId
                        ? { ...p, cantidad: cantidadNueva }
                        : p
                ));
            } else {
                agregarProductoTransferencia(producto, cantidadNueva);
            }
        }
    }, [productosFiltrados, productosCanastaTransferencias, agregarProductoTransferencia]);

    const handleCantidadIncrement = useCallback((productoId) => {
        const producto = productosFiltrados.find(p => p.id === productoId);
        if (!producto) return;

        const productoEnCanasta = productosCanastaTransferencias.find(p => p.id === productoId);
        if (productoEnCanasta) {
            setProductosCanastaTransferencias(prev => prev.map(p =>
                p.id === productoId
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            agregarProductoTransferencia(producto);
        }
    }, [productosFiltrados, productosCanastaTransferencias, agregarProductoTransferencia]);

    const handleCantidadDecrement = useCallback((productoId) => {
        setProductosCanastaTransferencias(prev => {
            const producto = prev.find(p => p.id === productoId);
            if (producto && producto.cantidad > 1) {
                return prev.map(p =>
                    p.id === productoId
                        ? { ...p, cantidad: p.cantidad - 1 }
                        : p
                );
            } else if (producto && producto.cantidad === 1) {
                return prev.filter(p => p.id !== productoId);
            }
            return prev;
        });
    }, []);

    return (
        <>
            <View 
                isOpen={isOpen} 
                setIsOpen={setIsOpen} 
                isMainView={
                    !isRepitiendoTransferencia &&
                    !localStorage.getItem('productosTransferenciaRepitiendo')
                }
            >
                <HeaderView
                    onBack={() => {
                        if (isRepitiendoTransferencia || localStorage.getItem('productosTransferenciaRepitiendo')) {
                            limpiarAlmacenLocalStorage();
                        }
                        setTimeout(() => {
                            setIsOpen(false);
                        }, 100);
                    }}
                    showSearch={true}
                    searchPlaceholder="Buscar producto"
                    title={tipo === 'transferir' ? 'Transferir' : 'Almacén'}
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchClear={handleSearchClear}
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
                            <div className={styles.titleContainer}>
                                <RefreshIndicator
                                    isVisible={showRefreshIndicator}
                                    isLoading={isRefreshing}
                                />
                            </div>
                            <Filtros options={opciones} />
                            {isLargeScreen ? (
                                // Vista de tabla para pantallas grandes
                                <div 
                                    className={styles.content}
                                    onScroll={handleStockScroll}
                                    style={{
                                        maxHeight: tipo === 'transferir' && isLargeScreen
                                            ? '100%'
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
                                            handleProductoClick(productoOriginal);
                                        }}
                                        getBadge={getBadge}
                                        getCellBadge={getCellBadge}
                                        onScroll={handleStockScroll}
                                        columnWidths={{
                                            name: '40%',
                                            stock: '20%',
                                            stock_grup: '20%',
                                            category_name: '20%'
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
                                    onScroll={handleStockScroll}
                                >
                                        {visibleItems.length > 0 ? (
                                            visibleItems.map((producto, index) => {
                                                if (tipo === 'transferir') {
                                                    const cantidadEnCanasta = getCantidadEnCanastaTransferencias(producto.id);
                                                    
                                                    // Calcular stock disponible usando función helper
                                                    const {
                                                        stockDisplay,
                                                        maxCantidad,
                                                        badgeColor
                                                    } = calcularStockDisponible({
                                                        producto,
                                                        tipo: 'transferir',
                                                        cantidadEnCanasta,
                                                        cantidadEnCanastaMovimientos: 0
                                                    });
                                                    
                                                    // Obtener el precio del producto
                                                    let precioProducto = undefined;
                                                    const productoEnCanasta = productosCanastaTransferencias.find(p => p.id === producto.id);
                                                    precioProducto = productoEnCanasta?.precio;
                                                    
                                                    // Si no está en la canasta, calcular el precio según el precio seleccionado
                                                    if (precioProducto === undefined && producto.price_product && producto.price_product.length > 0) {
                                                        const precioSeleccionadoId = window.getPrecioSeleccionadoCanastaTransferencias?.() || localStorage.getItem('precioIdRepitiendo') || localStorage.getItem('precioIdEditando');
                                                        
                                                        let precioUnitario = 0;
                                                        if (precioSeleccionadoId) {
                                                            const precioTipo = producto.price_product.find(pp => pp.prices_types?.id === precioSeleccionadoId);
                                                            precioUnitario = precioTipo ? precioTipo.valor : (producto.price_product[0]?.valor || 0);
                                                        } else {
                                                            precioUnitario = producto.price_product[0]?.valor || 0;
                                                        }
                                                        
                                                        // Obtener modo de agrupación para calcular precio
                                                        const modoAgrupacionActual = window.getModoAgrupacionCanastaTransferencias?.() || localStorage.getItem('transferenciaAgrupadoRepitiendo') || localStorage.getItem('transferenciaAgrupadoEditando');
                                                        
                                                        // Si está en modo agrupado y el producto tiene grupo, multiplicar el precio
                                                        if (modoAgrupacionActual === 'agrupado' && producto.grup && producto.grup > 0) {
                                                            const precioAgrupado = precioUnitario * (producto.grup || 1);
                                                            const decimal = precioAgrupado % 1;
                                                            precioProducto = decimal >= 0.5 ? Math.ceil(precioAgrupado) : Math.floor(precioAgrupado);
                                                        } else {
                                                            precioProducto = precioUnitario;
                                                        }
                                                    }
                                                    
                                                    return (
                                                        <ItemProduct
                                                            key={producto.id || index}
                                                            title={producto.name || 'Sin nombre'}
                                                            descriptionBadge={stockDisplay}
                                                            descriptionBadgeColor={badgeColor}
                                                            icon="box"
                                                            onClick={() => handleProductoClick(producto)}
                                                            precio={precioProducto}
                                                            showStockControls={true}
                                                            cantidad={cantidadEnCanasta}
                                                            onCantidadChange={(nuevaCantidad) => handleCantidadChange(producto.id, nuevaCantidad)}
                                                            onCantidadIncrement={() => handleCantidadIncrement(producto.id)}
                                                            onCantidadDecrement={() => handleCantidadDecrement(producto.id)}
                                                            maxCantidad={maxCantidad}
                                                            minCantidad={1}
                                                        />
                                                    );
                                                } else {
                                                    // Para otros tipos, usar el flot del stock
                                                    const stockFlot = getStockFlot(producto);
                                                
                                                return (
                                                        <ItemProduct
                                                        key={producto.id || index}
                                                        title={producto.name || 'Sin nombre'}
                                                            descriptionBadge={stockFlot.flot1 || `${producto.stock} unidades`}
                                                            descriptionBadgeColor="default"
                                                        icon="box"
                                                        onClick={() => handleProductoClick(producto)}
                                                            showArrow={true}
                                                    />
                                                );
                                                }
                                            })
                                        ) : (
                                            <NoData 
                                                icon="box"
                                                title={searchQuery || (categoriaFiltro && categoriaFiltro.length > 0) ? 'Sin resultados' : 'No hay productos'}
                                                detail={searchQuery || (categoriaFiltro && categoriaFiltro.length > 0) ? 'Intenta ajustar los filtros de búsqueda para encontrar los productos que necesitas' : 'Agrega productos al almacén para comenzar a gestionar tu inventario general'}
                                                transparent={true}
                                                minHeight="200px"
                                            />
                                        )}
                                 
                                </PullToRefresh>
                            )}
                        </>
                    )}
                </div>
                {tipo === 'transferir' && !isCartMode ? (
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label={`Canasta (${productosCanastaTransferencias.length})`}
                            onClick={() => setIsCanastaTransferenciasOpen(true)}
                            disabled={productosCanastaTransferencias.length === 0}
                        />
                    </div>
                ) : ''}

                {isOpen && (
                    <>
                        <FetchData
                            service={productsAlmacenService}
                            serviceName="productsAlmacenService"
                            method="getAll"
                            methodParams={[ocultarStockCero]}
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
                    </>
                )}
                {/* Canasta de Transferencias */}
                {tipo === 'transferir' && (
                    <CanastaTransferencias
                        isOpen={isCartMode && isLargeScreen ? true : isCanastaTransferenciasOpen}
                        setIsOpen={setIsCanastaTransferenciasOpen}
                        productosCanasta={productosCanastaTransferencias}
                        setProductosCanasta={setProductosCanastaTransferencias}
                        onCerrarCanasta={(transferenciaData) => {
                            setIsCanastaTransferenciasOpen(false);
                            showSuccess('Transferencia creada', 'La transferencia ha sido creada correctamente', 5000);
                        }}
                        onProductosUpdated={handleProductosUpdated}
                        preciosTipos={preciosTipos}
                        loadingPrecios={false}
                        productosActualizados={productos}
                        isCartMode={isCartMode && isLargeScreen}
                    />
                )}
            </View>

            {/* Filtro de categorías */}
            <FiltroCategorias
                isOpen={isOpenCategoria}
                setIsOpen={setOpenCategoria}
                onCategoriaSeleccionada={handleCategoriaFilter}
                categoriasSeleccionadas={categoriaFiltro || []}
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

export default AlmacenGeneralII;