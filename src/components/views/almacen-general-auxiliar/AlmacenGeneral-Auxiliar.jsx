import React, { useState, useEffect, useCallback, useMemo } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemProduct from '../../common/ItemProduct';
import ItemViewInput from '../../common/ItemViewInput';
import Filtros from '../../common/Filtros';
import FiltroCategorias from '../../mixed/FiltroCategorias';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FetchData from '../../mixed/FetchData';
import productsAlmacenService from '../../../services/productsAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import sucursalesService from '../../../services/sucursalesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import { useLayout } from '../../../context/LayoutContext';
import { useUser } from '../../../context/UserContext';
import Table from '../../common/Table';
import FiltroDiferenciaConteo from '../../mixed/FiltroDiferenciaConteo';
import Boton from '../../common/Boton';
import Notification from '../../common/Notification';
import conteosService from '../../../services/conteosService';
import CanastaCotizacion from './CanastaCotizacion';
import DescargaCotizacionBuilder from '../cotizaciones/DescargaCotizacionBuilder';
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

function AlmacenGeneralAuxiliar({ isOpen, setIsOpen, tipo = 'almacen', isRepitiendoCotizacion = false }) {
    const { isLargeScreen } = useLayout();
    const { sucursalSeleccionada: sucursalActual } = useUser();

    // Determinar si es modo carrito (para panel lateral)
    const isCartMode = tipo === 'cotizar' && isLargeScreen;

    // UI envío y notificación
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [notif, setNotif] = useState({ visible: false, text: '', type: 'success' });

    // Estados para filtros locales
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isOpenDiferencia, setOpenDiferencia] = useState(false);
    const [filtroDiferencia, setFiltroDiferencia] = useState('todos');
    const [ocultarStockCero, setOcultarStockCero] = useState(() => {
        // Cargar desde localStorage al inicializar
        const saved = localStorage.getItem('almacenOcultarStockCero');
        return saved === 'true';
    });

    // Estados para datos (compartidos con AlmacenGeneral principal)
    const {
        value: productos,
        setValue: setProductos,
        hasCache: hasProductosCache,
    } = useSessionCache({
        key: 'almacenGeneralProductos',
        defaultValue: [],
    });
    const [preciosData, setPreciosData] = useState([]);
    const [sucursalesData, setSucursalesData] = useState([]);
    
    // Estados para rastrear qué datos se han cargado
    const [productosLoaded, setProductosLoaded] = useState(false);
    const [preciosLoaded, setPreciosLoaded] = useState(false);
    const [sucursalesLoaded, setSucursalesLoaded] = useState(false);

    // Estados para canasta de cotizaciones
    const [productosCanastaCotizaciones, setProductosCanastaCotizaciones] = useState([]);
    const [isCanastaCotizacionesOpen, setIsCanastaCotizacionesOpen] = useState(false);
    const [isDescargaCotizacionOpen, setIsDescargaCotizacionOpen] = useState(false);
    const [cotizacionIdParaDescarga, setCotizacionIdParaDescarga] = useState(null);

    const {
        handleAgregarACanasta: agregarProductoCotizacion,
        getCantidadEnCanasta: getCantidadEnCanastaCotizaciones,
    } = useCanastaActions({
        setProductosCanasta: setProductosCanastaCotizaciones,
        productosCanasta: productosCanastaCotizaciones,
        pedidosConfig: {
            precioGetterName: 'getPrecioSeleccionadoCanastaCotizaciones',
            modoGetterName: 'getModoAgrupacionCanastaCotizaciones',
            extraItemFields: () => ({}),
        },
    });

    // Estados locales para inputs de conteo (solo UI)
    const [stockInputs, setStockInputs] = useState({}); // { [productoId]: number }
    const [groupInputs, setGroupInputs] = useState({}); // { [productoId]: number }
    const [stockInputsText, setStockInputsText] = useState({}); // { [productoId]: string }
    const [groupInputsText, setGroupInputsText] = useState({}); // { [productoId]: string }

    // Clave para localStorage
    const STORAGE_KEY = 'conteo_almacen_inputs';
    
    // Estado para verificar si se está repitiendo un conteo
    const [isRepeatingConteo, setIsRepeatingConteo] = useState(false);

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

    // Funciones para manejar localStorage
    const saveToLocalStorage = useCallback((stockInputs, groupInputs, stockInputsText, groupInputsText) => {
        try {
            const data = {
                stockInputs,
                groupInputs,
                stockInputsText,
                groupInputsText,
                timestamp: Date.now()
            };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('Error guardando en localStorage:', error);
        }
    }, []);

    const loadFromLocalStorage = useCallback(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const data = JSON.parse(saved);
                // Verificar que no sea muy antiguo (24 horas)
                const isRecent = Date.now() - data.timestamp < 24 * 60 * 60 * 1000;
                if (isRecent) {
                    setStockInputs(data.stockInputs || {});
                    setGroupInputs(data.groupInputs || {});
                    setStockInputsText(data.stockInputsText || {});
                    setGroupInputsText(data.groupInputsText || {});
                } else {
                    // Limpiar datos antiguos
                    localStorage.removeItem(STORAGE_KEY);
                }
            }
        } catch (error) {
            console.error('Error cargando desde localStorage:', error);
            localStorage.removeItem(STORAGE_KEY);
        }
    }, []);

    const clearLocalStorage = useCallback(() => {
        try {
            localStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('Error limpiando localStorage:', error);
        }
    }, []);


    useEffect(() => {
        if (!isOpen) {
            // Limpiar la variable de repetición cuando se cierre
            localStorage.removeItem('isRepeatingConteo');
        }
    }, [isOpen]);

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
            const response = await productsAlmacenService.getAll();
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
    }, []);
    const handleSucursalesLoaded = useCallback((data) => {
        setSucursalesData(data);
        setSucursalesLoaded(true);
    }, []);

    const {
        productosMapeados,
        productosFiltrados: productosFiltradosBase,
        visibleItems: visibleItemsBase,
        handleScroll: handleProductosScroll,
        searchQuery,
        isSearchExpanded,
        categoriaFiltro,
        categoriaFiltroNombre,
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

    // Aplicar filtro de stock 0 después de los otros filtros
    const productosFiltrados = useMemo(() => {
        if (!ocultarStockCero) {
            return productosFiltradosBase;
        }
        return productosFiltradosBase.filter(producto => (Number(producto.stock) || 0) > 0);
    }, [productosFiltradosBase, ocultarStockCero]);

    // Recalcular visibleItems con el filtro de stock aplicado (solo para tipos que no sean conteo)
    const { visibleItems: visibleItemsStock, handleScroll: handleStockScroll } = useVirtualPagination(productosFiltrados, 30);

    // Función para toggle del filtro de stock 0
    const handleToggleStockCero = useCallback(() => {
        const nuevoValor = !ocultarStockCero;
        setOcultarStockCero(nuevoValor);
        localStorage.setItem('almacenOcultarStockCero', nuevoValor.toString());
    }, [ocultarStockCero]);

    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            resetFilters();

            // Resetear estados de carga
            setProductosLoaded(hasProductosCache && productos.length > 0);
            setPreciosLoaded(false);
            setSucursalesLoaded(false);
            
            // Verificar si se está repitiendo un conteo
            const isRepeating = localStorage.getItem('isRepeatingConteo') === 'true';
            setIsRepeatingConteo(isRepeating);
            
            // Borrar la variable después de 1 segundo
            if (isRepeating) {
                setTimeout(() => {
                    localStorage.removeItem('isRepeatingConteo');
                }, 1000);
            }
            
            // Cargar datos guardados del localStorage solo en modo conteo
            if (tipo === 'conteo') {
                loadFromLocalStorage();
            } else {
                // Reiniciar estados de inputs al abrir en modo normal
                setStockInputs({});
                setGroupInputs({});
                setStockInputsText({});
                setGroupInputsText({});
            }

        }
    }, [isOpen, tipo, loadFromLocalStorage, isLargeScreen, resetFilters, hasProductosCache, productos.length]);

    // Efecto para guardar cambios en localStorage (solo en modo conteo)
    useEffect(() => {
        if (tipo === 'conteo' && isOpen) {
            saveToLocalStorage(stockInputs, groupInputs, stockInputsText, groupInputsText);
        }
    }, [stockInputs, groupInputs, stockInputsText, groupInputsText, tipo, isOpen, saveToLocalStorage]);

    // Efecto para cargar productos de cotización cuando se repite
    useEffect(() => {
        if (!isOpen || tipo !== 'cotizar') return;
        if (productos.length === 0) return;

        const productosCotizacionRepitiendo = localStorage.getItem('productosCotizacionRepitiendo');
        if (!productosCotizacionRepitiendo) return;

        try {
            const productosParaRepetir = JSON.parse(productosCotizacionRepitiendo);
            productosParaRepetir.forEach(productoCotizacion => {
                const productoCompleto = productos.find(p => p.id === productoCotizacion.id);
                if (productoCompleto) {
                    agregarProductoCotizacion(productoCompleto, productoCotizacion.cantidad);
                }
            });
            setTimeout(() => {
                localStorage.removeItem('productosCotizacionRepitiendo');
            }, 1000);
        } catch (error) {
            console.error('Error al cargar productos de la cotización para repetir:', error);
        }
    }, [isOpen, productos, tipo, agregarProductoCotizacion]);

    const getDiferenciaNombre = () => {
        const map = {
            'todos': 'Diferencia',
            'faltantes': 'Faltantes',
            'sobrantes': 'Sobrantes',
            'iguales': 'Iguales'
        };
        return map[filtroDiferencia] || 'Diferencia';
    };

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
        {
            label: ocultarStockCero ? 'Ocultar 0' : 'Mostrar 0',
            active: ocultarStockCero,
            onClick: handleToggleStockCero
        },
        ...(tipo === 'conteo' ? [{
            label: getDiferenciaNombre(),
            active: filtroDiferencia !== 'todos',
            onClick: () => setOpenDiferencia(true)
        }] : [])
    ];

    // Headers y datos para la tabla
    const tableHeaders = tipo === 'cotizar' ? [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ] : [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'codigo_barras', label: 'C. Barras', icon: 'barcode' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ];
    // Determinar color del borde por diferencia
    const getDiffState = (productoId, rawStock, rawGroups, grupVal) => {
        const u = stockInputs[productoId];
        const g = groupInputs[productoId];
        if (grupVal > 0 && g !== undefined) {
            if (g < rawGroups) return 'faltante';
            if (g > rawGroups) return 'sobrante';
            return 'igual';
        }
        if (u !== undefined) {
            if (u < rawStock) return 'faltante';
            if (u > rawStock) return 'sobrante';
            return 'igual';
        }
        return 'igual';
    };

    // Función para obtener el badge
    const getBadge = (producto) => {
        if (tipo === 'cotizar') {
            const cantidadEnCanasta = getCantidadEnCanastaCotizaciones(producto.id);
            return cantidadEnCanasta > 0 ? cantidadEnCanasta : null;
        }
        return null;
    };

    // Función para obtener el badge de celda (COPIADO EXACTO de PanelMovimientos.jsx)
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'stock' && tipo === 'cotizar') {
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

    const productosFiltradosPorDiferencia = productosFiltrados.filter(producto => {
        if (tipo !== 'conteo' || filtroDiferencia === 'todos') return true;
        const rawStock = Number(producto.stock || 0);
        const grupVal = Number(producto.grup || 0);
        const rawGroups = grupVal > 0 ? Math.floor(rawStock / grupVal) : 0;
        const state = getDiffState(producto.id, rawStock, rawGroups, grupVal);
        if (filtroDiferencia === 'faltantes') return state === 'faltante';
        if (filtroDiferencia === 'sobrantes') return state === 'sobrante';
        if (filtroDiferencia === 'iguales') return state === 'igual';
        return true;
    });

    // Paginación virtual - mostrar solo 30 elementos inicialmente (solo para modo conteo)
    const { visibleItems: visibleItemsConteo, hasMore, handleScroll } = useVirtualPagination(productosFiltradosPorDiferencia, 30);
    
    // Usar visibleItems según el tipo
    const visibleItems = tipo === 'conteo' ? visibleItemsConteo : visibleItemsStock;

    const tableData = visibleItems
        .map(producto => {
            const baseData = {
                id: producto.id,
                name: producto.name,
                stock: `${producto.stock} Ud.`,
                stock_grup: producto.grup ? Math.floor(producto.stock / producto.grup) + ' Ud.' : '--',
                category_name: producto.category_name,
                stock_minimo: producto.stock_minimo, // AGREGAR stock_minimo
            };
            
            // Solo incluir código de barras si no es modo cotizar
            if (tipo !== 'cotizar') {
                baseData.codigo_barras = producto.codigo_barras;
            }
            
            return baseData;
        });

    const handleRegistrarConteo = async () => {
        const resultados = productos.map((p) => {
            const rawStock = Number(p.stock || 0);
            const grupVal = Number(p.grup || 0);

            const hasGroupText = groupInputsText[p.id] !== undefined && groupInputsText[p.id] !== '';
            const hasUnitText = stockInputsText[p.id] !== undefined && stockInputsText[p.id] !== '';

            let fisicoUnits = rawStock;
            
            // Prioridad: Si se editó por unidades, usar el valor de unidades (es lo que realmente ingresó el usuario)
            if (hasUnitText || stockInputs[p.id] !== undefined) {
                const u = hasUnitText ? Number(stockInputsText[p.id]) : Number(stockInputs[p.id]);
                fisicoUnits = Number.isFinite(u) ? u : rawStock;
            } 
            // Si solo se editó por grupos (sin tocar unidades), usar el valor de grupos
            else if (grupVal > 0 && (hasGroupText || groupInputs[p.id] !== undefined)) {
                const g = hasGroupText ? Number(groupInputsText[p.id]) : Number(groupInputs[p.id]);
                fisicoUnits = Number.isFinite(g) ? g * grupVal : rawStock;
            }

            return {
                id: p.id,
                stock_sistema: rawStock,
                stock_fisico: fisicoUnits
            };
        });
        // Preparar detalles para API
        const detalles = resultados.map(r => ({
            producto_id: r.id,
            sistema: r.stock_sistema,
            fisico: r.stock_fisico,
            justificacion: null
        }));

        try {
            setIsSubmitting(true);
            const resp = await conteosService.create({ tipo: 'almacen', observaciones: null, detalles });
            if (!resp.success) throw new Error(resp.message || 'Error');
            
            // Limpiar localStorage y resetear valores después de registrar exitosamente
            clearLocalStorage();
            setStockInputs({});
            setGroupInputs({});
            setStockInputsText({});
            setGroupInputsText({});
            
            setNotif({ visible: true, text: 'Conteo registrado correctamente', type: 'success' });
        } catch (e) {
            setNotif({ visible: true, text: e.message || 'Error al registrar conteo', type: 'error' });
        } finally {
            setTimeout(() => setNotif(prev => ({ ...prev, visible: false })), 2500);
            setIsSubmitting(false);
        }
    };

    const handleRestablecerValores = () => {
        // Limpiar localStorage y resetear todos los valores a originales
        clearLocalStorage();
        setStockInputs({});
        setGroupInputs({});
        setStockInputsText({});
        setGroupInputsText({});
        setNotif({ visible: true, text: 'Valores restablecidos correctamente', type: 'success' });
        setTimeout(() => setNotif(prev => ({ ...prev, visible: false })), 2500);
    };

    // Función para manejar el click en un producto (solo para modo cotizar)
    const handleProductoClick = (producto) => {
        if (tipo === 'cotizar') {
            agregarProductoCotizacion(producto);
        }
    };

    // Funciones para actualizar cantidad desde ItemProduct (para cotizaciones)
    const handleCantidadChange = useCallback((productoId, nuevaCantidad) => {
        const producto = productosFiltrados.find(p => p.id === productoId);
        if (!producto) return;

        const cantidadNueva = Math.max(0, nuevaCantidad);

        if (cantidadNueva === 0) {
            setProductosCanastaCotizaciones(prev => prev.filter(p => p.id !== productoId));
        } else {
            const productoEnCanasta = productosCanastaCotizaciones.find(p => p.id === productoId);
            if (productoEnCanasta) {
                setProductosCanastaCotizaciones(prev => prev.map(p =>
                    p.id === productoId
                        ? { ...p, cantidad: cantidadNueva }
                        : p
                ));
            } else {
                agregarProductoCotizacion(producto, cantidadNueva);
            }
        }
    }, [productosFiltrados, productosCanastaCotizaciones, agregarProductoCotizacion]);

    const handleCantidadIncrement = useCallback((productoId) => {
        const producto = productosFiltrados.find(p => p.id === productoId);
        if (!producto) return;

        const productoEnCanasta = productosCanastaCotizaciones.find(p => p.id === productoId);
        if (productoEnCanasta) {
            setProductosCanastaCotizaciones(prev => prev.map(p =>
                p.id === productoId
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            agregarProductoCotizacion(producto);
        }
    }, [productosFiltrados, productosCanastaCotizaciones, agregarProductoCotizacion]);

    const handleCantidadDecrement = useCallback((productoId) => {
        setProductosCanastaCotizaciones(prev => {
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
                    !isRepeatingConteo &&
                    !isRepitiendoCotizacion &&
                    !localStorage.getItem('productosCotizacionRepitiendo')
                }
            >
                <HeaderView
                    onBack={() => {
                        if (isRepitiendoCotizacion || localStorage.getItem('productosCotizacionRepitiendo')) {
                            limpiarAlmacenLocalStorage();
                        }
                        setTimeout(() => {
                            setIsOpen(false);
                        }, 100);
                    }}
                    showSearch={true}
                    searchPlaceholder="Buscar producto"
                    title={tipo === 'conteo' ? 'Conteo de Inventario' : tipo === 'cotizar' ? 'Cotizar' : 'Almacén'}
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
                                    onScroll={tipo === 'conteo' ? handleScroll : handleStockScroll}
                                    style={{
                                        maxHeight: (tipo === 'conteo' || tipo === 'cotizar') && isLargeScreen
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
                                        onScroll={tipo === 'conteo' ? handleScroll : handleStockScroll}
                                        columnWidths={tipo === 'cotizar' ? {
                                            name: '40%',
                                            stock: '20%',
                                            stock_grup: '20%',
                                            category_name: '20%'
                                        } : {
                                            name: '25%',
                                            codigo_barras: '15%',
                                            stock: '15%',
                                            stock_grup: '15%',
                                            category_name: '15%'
                                        }}
                                        renderCell={(row, key) => {
                                            if (tipo !== 'conteo') return null;
                                            if (key !== 'stock' && key !== 'stock_grup') return null;
                                            const original = productosFiltrados.find(p => p.id === row.id);
                                            if (!original) return null;
                                            const rawStock = Number(original.stock || 0);
                                            const grupVal = Number(original.grup || 0);
                                            const rawGroups = grupVal > 0 ? Math.floor(rawStock / grupVal) : 0;

                                            if (key === 'stock') {
                                                const valueText = stockInputsText[row.id] !== undefined ? stockInputsText[row.id] : String(stockInputs[row.id] !== undefined ? stockInputs[row.id] : rawStock);
                                                const state = getDiffState(row.id, rawStock, rawGroups, grupVal);
                                                return (
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={valueText}
                                                        onChange={(e) => {
                                                            const text = e.target.value;
                                                            setStockInputsText(prev => ({ ...prev, [row.id]: text }));
                                                            if (text === '') return; // permitir vacío mientras edita
                                                            const nextUnits = Number(text);
                                                            if (Number.isFinite(nextUnits)) {
                                                                setStockInputs(prev => ({ ...prev, [row.id]: nextUnits }));
                                                                if (grupVal > 0) {
                                                                    const nextGroups = Math.floor(nextUnits / grupVal);
                                                                    setGroupInputs(prev => ({ ...prev, [row.id]: nextGroups }));
                                                                    setGroupInputsText(prev => ({ ...prev, [row.id]: String(nextGroups) }));
                                                                }
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            const text = stockInputsText[row.id];
                                                            if (text === '' || text === undefined) {
                                                                setStockInputs(prev => ({ ...prev, [row.id]: rawStock }));
                                                                setStockInputsText(prev => ({ ...prev, [row.id]: String(rawStock) }));
                                                                if (grupVal > 0) {
                                                                    setGroupInputs(prev => ({ ...prev, [row.id]: rawGroups }));
                                                                    setGroupInputsText(prev => ({ ...prev, [row.id]: String(rawGroups) }));
                                                                }
                                                            }
                                                        }}
                                                        onWheel={(e) => {
                                                            // Prevenir que el scroll cambie el valor
                                                            e.target.blur();
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onFocus={(e) => e.target.select()}
                                                        style={{
                                                            borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined, maxWidth: '100px'
                                                        }}
                                                    />
                                                );
                                            }
                                            if (key === 'stock_grup') {
                                                if (grupVal <= 0) {
                                                    return null; // dejar contenido por defecto si no se agrupa
                                                }
                                                const valueText = groupInputsText[row.id] !== undefined ? groupInputsText[row.id] : String(groupInputs[row.id] !== undefined ? groupInputs[row.id] : rawGroups);
                                                const state = getDiffState(row.id, rawStock, rawGroups, grupVal);
                                                return (
                                                    <input
                                                        type="number"
                                                        inputMode="numeric"
                                                        value={valueText}
                                                        onChange={(e) => {
                                                            const text = e.target.value;
                                                            setGroupInputsText(prev => ({ ...prev, [row.id]: text }));
                                                            if (text === '') return; // permitir vacío
                                                            const nextGroups = Number(text);
                                                            if (Number.isFinite(nextGroups)) {
                                                                setGroupInputs(prev => ({ ...prev, [row.id]: nextGroups }));
                                                                const nextUnits = Math.max(0, nextGroups * grupVal);
                                                                setStockInputs(prev => ({ ...prev, [row.id]: nextUnits }));
                                                                setStockInputsText(prev => ({ ...prev, [row.id]: String(nextUnits) }));
                                                            }
                                                        }}
                                                        onBlur={() => {
                                                            const text = groupInputsText[row.id];
                                                            if (text === '' || text === undefined) {
                                                                setGroupInputs(prev => ({ ...prev, [row.id]: rawGroups }));
                                                                setGroupInputsText(prev => ({ ...prev, [row.id]: String(rawGroups) }));
                                                                setStockInputs(prev => ({ ...prev, [row.id]: rawStock }));
                                                                setStockInputsText(prev => ({ ...prev, [row.id]: String(rawStock) }));
                                                            }
                                                        }}
                                                        onWheel={(e) => {
                                                            // Prevenir que el scroll cambie el valor
                                                            e.target.blur();
                                                        }}
                                                        onClick={(e) => e.stopPropagation()}
                                                        onFocus={(e) => e.target.select()}
                                                        style={{
                                                            borderColor: state === 'faltante' ? 'var(--error-color)' : state === 'sobrante' ? 'var(--success-color)' : undefined, maxWidth: '100px'
                                                        }}
                                                    />
                                                );
                                            }
                                            return null;
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
                                    onScroll={tipo === 'conteo' ? handleScroll : handleStockScroll}
                                >
                                        {visibleItems.length > 0 ? (
                                            visibleItems.map((producto, index) => {
                                                if (tipo === 'conteo') {
                                                    const rawStock = Number(producto.stock || 0);
                                                    const grupVal = Number(producto.grup || 0);
                                                    const rawGroups = grupVal > 0 ? Math.floor(rawStock / grupVal) : 0;
                                                    const state = getDiffState(producto.id, rawStock, rawGroups, grupVal);
                                                    const inputs = [];
                                                    // Unidades input
                                                    inputs.push({
                                                        name: `units-${producto.id}`,
                                                        label: 'Unidades',
                                                        type: 'number',
                                                        diffState: state,
                                                        value: stockInputsText[producto.id] !== undefined ? stockInputsText[producto.id] : String(stockInputs[producto.id] !== undefined ? stockInputs[producto.id] : rawStock),
                                                        onChange: (e) => {
                                                            const text = e.target.value;
                                                            setStockInputsText(prev => ({ ...prev, [producto.id]: text }));
                                                            if (text === '') return;
                                                            const nextUnits = Number(text);
                                                            if (Number.isFinite(nextUnits)) {
                                                                setStockInputs(prev => ({ ...prev, [producto.id]: nextUnits }));
                                                                if (grupVal > 0) {
                                                                    const nextGroups = Math.floor(nextUnits / grupVal);
                                                                    setGroupInputs(prev => ({ ...prev, [producto.id]: nextGroups }));
                                                                    setGroupInputsText(prev => ({ ...prev, [producto.id]: String(nextGroups) }));
                                                                }
                                                            }
                                                        },
                                                        inputProps: {
                                                            inputMode: 'numeric',
                                                            onFocus: (e) => e.target.select(),
                                                            onWheel: (e) => {
                                                                // Prevenir que el scroll cambie el valor
                                                                e.target.blur();
                                                            },
                                                            onBlur: () => {
                                                                const text = stockInputsText[producto.id];
                                                                if (text === '' || text === undefined) {
                                                                    setStockInputs(prev => ({ ...prev, [producto.id]: rawStock }));
                                                                    setStockInputsText(prev => ({ ...prev, [producto.id]: String(rawStock) }));
                                                                    if (grupVal > 0) {
                                                                        setGroupInputs(prev => ({ ...prev, [producto.id]: rawGroups }));
                                                                        setGroupInputsText(prev => ({ ...prev, [producto.id]: String(rawGroups) }));
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    });
                                                    // Grupos input (solo si aplica)
                                                    if (grupVal > 0) {
                                                        inputs.push({
                                                            name: `groups-${producto.id}`,
                                                            label: 'Grup',
                                                            type: 'number',
                                                            diffState: state,
                                                            value: groupInputsText[producto.id] !== undefined ? groupInputsText[producto.id] : String(groupInputs[producto.id] !== undefined ? groupInputs[producto.id] : rawGroups),
                                                            onChange: (e) => {
                                                                const text = e.target.value;
                                                                setGroupInputsText(prev => ({ ...prev, [producto.id]: text }));
                                                                if (text === '') return;
                                                                const nextGroups = Number(text);
                                                                if (Number.isFinite(nextGroups)) {
                                                                    setGroupInputs(prev => ({ ...prev, [producto.id]: nextGroups }));
                                                                    const nextUnits = Math.max(0, nextGroups * grupVal);
                                                                    setStockInputs(prev => ({ ...prev, [producto.id]: nextUnits }));
                                                                    setStockInputsText(prev => ({ ...prev, [producto.id]: String(nextUnits) }));
                                                                }
                                                            },
                                                            inputProps: {
                                                                inputMode: 'numeric',
                                                                onFocus: (e) => e.target.select(),
                                                                onWheel: (e) => {
                                                                    // Prevenir que el scroll cambie el valor
                                                                    e.target.blur();
                                                                },
                                                                onBlur: () => {
                                                                    const text = groupInputsText[producto.id];
                                                                    if (text === '' || text === undefined) {
                                                                        setGroupInputs(prev => ({ ...prev, [producto.id]: rawGroups }));
                                                                        setGroupInputsText(prev => ({ ...prev, [producto.id]: String(rawGroups) }));
                                                                        setStockInputs(prev => ({ ...prev, [producto.id]: rawStock }));
                                                                        setStockInputsText(prev => ({ ...prev, [producto.id]: String(rawStock) }));
                                                                    }
                                                                }
                                                            }
                                                        });
                                                    }
                                                    return (
                                                        <ItemViewInput
                                                            key={producto.id || index}
                                                            title={producto.name || 'Sin nombre'}
                                                            icon="box"
                                                            inputs={inputs}
                                                            diffState={state}
                                                        />
                                                    );
                                                }
                                                // Para cotizar: usar ItemProduct
                                                if (tipo === 'cotizar') {
                                                    const cantidadEnCanasta = getCantidadEnCanastaCotizaciones(producto.id);
                                                    
                                                    // Calcular stock disponible usando función helper
                                                    const {
                                                        stockDisplay,
                                                        maxCantidad,
                                                        badgeColor
                                                    } = calcularStockDisponible({
                                                        producto,
                                                        tipo: 'cotizar',
                                                        cantidadEnCanasta,
                                                        cantidadEnCanastaMovimientos: 0
                                                    });
                                                    
                                                    // Obtener el precio del producto
                                                    let precioProducto = undefined;
                                                    const productoEnCanasta = productosCanastaCotizaciones.find(p => p.id === producto.id);
                                                    precioProducto = productoEnCanasta?.precio;
                                                    
                                                    // Si no está en la canasta, calcular el precio según el precio seleccionado
                                                    if (precioProducto === undefined && producto.price_product && producto.price_product.length > 0) {
                                                        const precioSeleccionadoId = window.getPrecioSeleccionadoCanastaCotizaciones?.() || localStorage.getItem('precioIdRepitiendo') || localStorage.getItem('precioIdEditando');
                                                        
                                                        let precioUnitario = 0;
                                                        if (precioSeleccionadoId) {
                                                            const precioTipo = producto.price_product.find(pp => pp.prices_types?.id === precioSeleccionadoId);
                                                            precioUnitario = precioTipo ? precioTipo.valor : (producto.price_product[0]?.valor || 0);
                                                        } else {
                                                            precioUnitario = producto.price_product[0]?.valor || 0;
                                                        }
                                                        
                                                        // Obtener modo de agrupación para calcular precio
                                                        const modoAgrupacionActual = window.getModoAgrupacionCanastaCotizaciones?.() || localStorage.getItem('cotizacionAgrupadoRepitiendo') || localStorage.getItem('cotizacionAgrupadoEditando');
                                                        
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
                                                }
                                                
                                                // Fallback para otros tipos (si los hay)
                                                const stockFlot = {
                                                    flot1: producto.stock + ' Ud.',
                                                    flot2: null,
                                                    flot3: null
                                                };
                                                
                                                return (
                                                    <ItemProduct
                                                        key={producto.id || index}
                                                        title={producto.name || 'Sin nombre'}
                                                        descriptionBadge={stockFlot.flot1}
                                                        descriptionBadgeColor="default"
                                                        icon="box"
                                                        onClick={() => handleProductoClick(producto)}
                                                        showArrow={true}
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
                {tipo === 'conteo' ? (
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label='Registrar conteo'
                            onClick={handleRegistrarConteo}
                            loading={isSubmitting}
                        />
                        <Boton
                            className='btn-gray'
                            label='Restablecer'
                            onClick={handleRestablecerValores}
                            disabled={isSubmitting}
                        />
                    </div>
                ) : ''}
                {tipo === 'cotizar' && !isCartMode ? (
                    <div className={styles.buttonFooter}>
                        <Boton
                            className='btn-original'
                            label={`Canasta (${productosCanastaCotizaciones.length})`}
                            onClick={() => setIsCanastaCotizacionesOpen(true)}
                            disabled={productosCanastaCotizaciones.length === 0}
                        />
                    </div>
                ) : ''}

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
                {/* Canasta de Cotizaciones */}
                {tipo === 'cotizar' && (
                    <CanastaCotizacion
                        isOpen={isCartMode && isLargeScreen ? true : isCanastaCotizacionesOpen}
                        setIsOpen={setIsCanastaCotizacionesOpen}
                        productosCanasta={productosCanastaCotizaciones}
                        setProductosCanasta={setProductosCanastaCotizaciones}
                        onCerrarCanasta={(cotizacionData) => {
                            setIsCanastaCotizacionesOpen(false);
                            const numeroCotizacion = cotizacionData?.numero_cotizacion || '';
                            const cotizacionId = cotizacionData?.id;
                            
                            setNotif({ 
                                visible: true, 
                                text: `Cotización #${numeroCotizacion} creada correctamente`, 
                                type: 'success' 
                            });
                            setTimeout(() => setNotif(prev => ({ ...prev, visible: false })), 2500);
                            
                            // Abrir modal de descarga si hay ID de cotización
                            if (cotizacionId) {
                                setCotizacionIdParaDescarga(cotizacionId);
                                setIsDescargaCotizacionOpen(true);
                            }
                        }}
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
            {/* Filtro de diferencia */}
            <FiltroDiferenciaConteo
                isOpen={isOpenDiferencia}
                setIsOpen={setOpenDiferencia}
                onDiferenciaSeleccionada={(op) => setFiltroDiferencia(op)}
            />
            {/* Modal de descarga de la cotización generada */}
            <DescargaCotizacionBuilder
                isOpen={isDescargaCotizacionOpen}
                setIsOpen={setIsDescargaCotizacionOpen}
                cotizacionId={cotizacionIdParaDescarga}
            />

            <Notification type={notif.type} text={notif.text} isVisible={notif.visible} onClose={() => setNotif(prev => ({ ...prev, visible: false }))} />
        </>
    );
}

export default AlmacenGeneralAuxiliar;