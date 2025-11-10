import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView, { normalizeSearchValue, normalizedIncludes } from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerProducto from './VerProducto';
import Filtros from '../../common/Filtros';
import Boton from '../../common/Boton';
import EditarAgregar from '../almacen-acopio/EditarAgregar';
import CategoriasAcopio from './CategoriasAcopio';
import MovimientoAcopio from './MovimientoAcopio';
import CanastaPedidos from './CanastaPedidos';
import DescargaPedidoBuilder from '../pedidos/DescargaPedidoBuilder';
import HistorialWhatsapp from './HistorialWhatsapp';
import Select from '../../common/Select';
import productsAcopioService from '../../../services/productsAcopioService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import typeMeasureService from '../../../services/typeMeasureService';
import { BoxIcon } from 'boxicons-react';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroCategoriasAcopio from '../../mixed/FiltroCategoriasAcopio';
import FiltroTipoMedida from '../../mixed/FiltroTipoMedida';
import FiltroOrdenamientoAcopio from '../../mixed/FiltroOrdenamientoAcopio';
import FetchData from '../../mixed/FetchData';
import NoData from '../../common/NoData';
import PullToRefresh from '../../common/PullToRefresh';
import RefreshIndicator from '../../common/RefreshIndicator';
import useVirtualPagination from '../../../hooks/useVirtualPagination';

function AlmacenAcopio({ isOpen, setIsOpen, tipo = '' }) {
    const { isLargeScreen } = useLayout();

    // Determinar si es modo carrito (para panel lateral)
    const isCartMode = tipo === 'pedido';

    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);
    const [isCategoriasOpen, setIsCategoriasOpen] = useState(false);

    // Estados para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [searchQueryNormalized, setSearchQueryNormalized] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para los datos
    const [categorias, setCategorias] = useState([]);
    const [tiposMedida, setTiposMedida] = useState([]);

    // Estados para rastrear qué datos se han cargado
    const [productosLoaded, setProductosLoaded] = useState(false);
    const [categoriasLoaded, setCategoriasLoaded] = useState(false);
    const [tiposMedidaLoaded, setTiposMedidaLoaded] = useState(false);
    // Estados para productos
    const [isLoading, setIsLoading] = useState(false);

    // Estados para RefreshIndicator (solo PC)
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [activeRequests, setActiveRequests] = useState(0);

    // Estados para filtros locales
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [tipoMedidaFiltro, setTipoMedidaFiltro] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    // Estados para productos
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState(null);

    // Función para manejar cuando inicia la carga
    const handleLoadingStart = useCallback(() => {
        // Solo mostrar loading si no hay datos cargados
        if (productos.length === 0) {
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
    }, [productos.length, isLargeScreen]);

    // Función para manejar cuando termina la carga
    const handleLoadingEnd = useCallback(() => {
        // Decrementar contador de peticiones activas
        setActiveRequests(prev => {
            const newCount = Math.max(0, prev - 1);
            // Solo ocultar loading y RefreshIndicator cuando no hay peticiones activas
            if (newCount === 0) {
                setIsLoading(false);
                if (isLargeScreen) {
                    setTimeout(() => {
                        setIsRefreshing(false);
                        setTimeout(() => {
                            setShowRefreshIndicator(false);
                        }, 500);
                    }, 300);
                }
            }
            return newCount;
        });
    }, [isLargeScreen]);


    // Función para manejar cuando se cargan los productos
    const handleProductosLoaded = useCallback((data) => {
        setProductos(data);
        setProductosLoaded(true);
    }, []);

    // Función para manejar refresh
    const handleRefresh = async () => {
        try {
            const response = await productsAcopioService.getAll();
            if (response.success) {
                setProductos(response.data);
            }
        } catch (error) {
            console.error('Error al refrescar productos:', error);
        }
    };


    // Mapear Información de productos
    const productosMapeados = productos.map(producto => ({
        // Información básica
        id: producto.id,
        name: producto.name || '',
        description: producto.description || '',
        quantity: producto.quantity || 0,
        stock_minimo: producto.stock_minimo || 0,
        created_at: producto.created_at,
        empresa_id: producto.empresa_id,

        // Información de categoría
        category_id: producto.category_id || '',
        category_name: producto.category?.name || 'Sin categoría',
        category: producto.category || null,

        // Información de tipo de medida
        type_measure_id: producto.type_measure_id || '',
        type_measure: producto.type_measure || null,

        // Información de recetas
        recetas_acopio: producto.recetas_acopio || []
    }));


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
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenTipoMedida, setOpenTipoMedida] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);

    // Estados para canasta de pedidos
    const [productosCanasta, setProductosCanasta] = useState([]);
    const [isCanastaOpen, setIsCanastaOpen] = useState(false);
    const [isDescargaPedidoOpen, setIsDescargaPedidoOpen] = useState(false);
    const [pedidoIdParaDescarga, setPedidoIdParaDescarga] = useState(null);

    // Estados para el modal de historial WhatsApp
    const [isHistorialModalOpen, setIsHistorialModalOpen] = useState(false);
    const [historialData, setHistorialData] = useState({
        titulo: '',
        descripcion: '',
        tipo: '',
        datos: null
    });

    // Función para manejar el click en un producto
    const handleRegistro = (producto, tipo) => {
        setInfoPersona(producto);
        if (tipo === 'almacen') {
            setIsOpenVerProducto(true);
        } else if (tipo === 'pedido') {
            // Agregar producto a la canasta
            handleAgregarACanasta(producto);
        } else if (tipo === 'entrada' || tipo === 'salida') {
            setIsMovimientoOpen(true);
        }
    };

    // Funciones de filtrado locales
    const handleCategoriaFilter = (categoriaId) => {
        setCategoriaFiltro(categoriaId);
    };

    const handleTipoMedidaFilter = (tipoMedidaId) => {
        setTipoMedidaFiltro(tipoMedidaId);
    };

    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
    };

    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setSearchQueryNormalized('');
            setCategoriaFiltro(null);
            setTipoMedidaFiltro(null);
            setOrdenamiento('nombre_asc');

            // Resetear estados de carga
            setProductosLoaded(false);
            setCategoriasLoaded(false);
            setTiposMedidaLoaded(false);

            // Cargar canastas desde localStorage
            cargarCanastasDesdeLocalStorage();
        }
    }, [isOpen]);

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

    // Filtrar y ordenar productos localmente
    const productosFiltrados = productosMapeados.filter(producto => {
        // Filtro de búsqueda
        const query = searchQueryNormalized || normalizeSearchValue(searchQuery);
        const matchesSearch = !query ||
            normalizedIncludes(normalizeSearchValue(producto.name), query) ||
            (producto.description && normalizedIncludes(normalizeSearchValue(producto.description), query));

        // Filtro de categoría
        const matchesCategoria = categoriaFiltro === null ||
            (categoriaFiltro === '' ? !producto.category_id : producto.category_id === categoriaFiltro);

        // Filtro de tipo de medida
        const matchesTipoMedida = tipoMedidaFiltro === null ||
            (tipoMedidaFiltro === '' ? !producto.type_measure_id : producto.type_measure_id === tipoMedidaFiltro);

        return matchesSearch && matchesCategoria && matchesTipoMedida;
    }).sort((a, b) => {
        // Ordenamiento
        switch (ordenamiento) {
            case 'nombre_asc':
                return a.name.localeCompare(b.name);
            case 'nombre_desc':
                return b.name.localeCompare(a.name);
            case 'cantidad_asc':
                return parseFloat(a.quantity || 0) - parseFloat(b.quantity || 0);
            case 'cantidad_desc':
                return parseFloat(b.quantity || 0) - parseFloat(a.quantity || 0);
            default:
                return a.name.localeCompare(b.name);
        }
    });

    // Paginación virtual - mostrar solo 30 elementos inicialmente
    const { visibleItems, hasMore, handleScroll } = useVirtualPagination(productosFiltrados, 30);

    // Función para cargar canastas desde localStorage
    const cargarCanastasDesdeLocalStorage = () => {
        try {
            // Cargar canasta de pedidos de acopio
            const canastaPedidosAcopio = localStorage.getItem('canastaPedidosAcopio');
            if (canastaPedidosAcopio) {
                const productosPedidos = JSON.parse(canastaPedidosAcopio);
                setProductosCanasta(productosPedidos);
            }
        } catch (error) {
            console.error('Error al cargar canastas desde localStorage:', error);
        }
    };


    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo productos:', error);
        }
    }, [error]);

    // Función para manejar cuando se crea un nuevo producto
    const handleProductCreated = (newProduct) => {
        // Actualizar el estado local con el producto que devuelve el servidor
        setProductos(prevProductos => [newProduct, ...prevProductos]);

        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Producto agregado correctamente')
    };

    // Función para manejar cuando se elimina un producto
    const handleProductDeleted = (deletedId) => {
        // Actualizar el estado local removiendo el producto eliminado
        setProductos(prevProductos => prevProductos.filter(producto => producto.id !== deletedId));

        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto eliminado correctamente')
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

    // Función para manejar cuando se crea un movimiento
    const handleMovimientoCreated = (movimiento, tieneReceta = false) => {

        // Actualizar solo el stock del producto específico, sin hacer recarga completa
        if (movimiento && movimiento.product) {
            setProductos(prevProductos => prevProductos.map(producto =>
                producto.id === movimiento.product.id
                    ? { ...producto, quantity: parseFloat(movimiento.product.quantity || 0).toFixed(2) }
                    : producto
            ));

            // Actualizar también el producto que se está viendo
            setInfoPersona(prev => prev ? { ...prev, quantity: parseFloat(movimiento.product.quantity || 0).toFixed(2) } : prev);
        }

        // Mostrar notificación de éxito
        mostrarNotificacion('success', `${tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada correctamente`);
    };

    // Función para manejar la canasta de pedidos
    const handleAgregarACanasta = (producto) => {
        const productoExistente = productosCanasta.find(p => p.id === producto.id);

        if (productoExistente) {
            // Si ya existe, aumentar la cantidad
            setProductosCanasta(prev => prev.map(p =>
                p.id === producto.id
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            // Si no existe, agregarlo nuevo
            setProductosCanasta(prev => [...prev, {
                ...producto,
                cantidad: 1,
                medidaPedido: 'kg',
                observacionesPedido: ''
            }]);
        }
    };

    // Función para manejar cuando se crea un pedido
    const handlePedidoCreado = (pedidoData) => {
        // Mostrar notificación de éxito
        mostrarNotificacion('success', 'Pedido registrado correctamente');
    };

    // Función para manejar cuando se crea un pedido y se quiere descargar
    const handlePedidoCreadoConDescarga = (pedidoId) => {
        setPedidoIdParaDescarga(pedidoId);
        setIsDescargaPedidoOpen(true);
    };

    const getCantidadEnCanasta = (productoId) => {
        const producto = productosCanasta.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    };

    // Función para manejar el Select de WhatsApp
    const handleWhatsAppSelect = (value) => {
        if (value === 'historial') {
            const historial = JSON.parse(localStorage.getItem('historialPedidosAcopio') || '[]');
            setHistorialData({
                titulo: 'Historial de pedidos realizados',
                descripcion: 'HISTORIAL DE PEDIDOS',
                tipo: 'historial',
                datos: historial
            });
            setIsHistorialModalOpen(true);
        } else if (value === 'ultimo-pedido') {
            const ultimoPedido = JSON.parse(localStorage.getItem('ultimoPedidoAcopio') || 'null');
            setHistorialData({
                titulo: 'Detalles del último pedido realizado',
                descripcion: 'DETALLES DEL ÚLTIMO PEDIDO',
                tipo: 'ultimo-pedido',
                datos: ultimoPedido
            });
            setIsHistorialModalOpen(true);
        }
    };


    // Funciones para obtener nombres de filtros (funcionan pero no afectan el resultado)
    const getCategoriaNombre = () => {
        if (categoriaFiltro === null) return 'Categorías';
        if (categoriaFiltro === '') return 'Sin categoría';
        if (!categoriaFiltro) return 'Categorías';
        const categoria = categorias.find(c => c.id === categoriaFiltro);
        return categoria ? categoria.name : 'Categorías';
    };

    const getTipoMedidaNombre = () => {
        if (tipoMedidaFiltro === null) return 'Medidas';
        if (tipoMedidaFiltro === '') return 'Sin medida';
        if (!tipoMedidaFiltro) return 'Medidas';
        const tipoMedida = tiposMedida.find(t => t.id === tipoMedidaFiltro);
        return tipoMedida ? tipoMedida.name : 'Medidas';
    };

    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'nombre_asc': 'Nombre A-Z',
            'nombre_desc': 'Nombre Z-A',
            'cantidad_asc': 'Cantidad ↑',
            'cantidad_desc': 'Cantidad ↓'
        };
        return ordenamientos[ordenamiento] || 'Ordenamiento';
    };

    const opciones = [
        {
            label: getCategoriaNombre(),
            active: categoriaFiltro !== null,
            onClick: () => setOpenCategoria(true)
        },
        {
            label: getTipoMedidaNombre(),
            active: tipoMedidaFiltro !== null,
            onClick: () => setOpenTipoMedida(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'nombre_asc',
            onClick: () => setOpenOrden(true)
        },
    ];

    // Headers para la tabla
    const tableHeaders = tipo === 'pedido' ? [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'quantity', label: 'Cantidad', icon: 'bar-chart-alt-2' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' },
        { key: 'type_measure_name', label: 'Medida', icon: 'ruler' }
    ] : [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'description', label: 'Descripción', icon: 'comment' },
        { key: 'quantity', label: 'Cantidad', icon: 'bar-chart-alt-2' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' },
        { key: 'type_measure_name', label: 'Medida', icon: 'ruler' }
    ];

    // Datos para la tabla
    const tableData = visibleItems.map(producto => {
        const baseData = {
            id: producto.id,
            name: producto.name,
            quantity: `${parseFloat(producto.quantity || 0).toFixed(2)} ${producto.type_measure?.code || ''}`,
            category_name: producto.category_name || '--',
            type_measure_name: producto.type_measure?.name || '--',
            stock_minimo: producto.stock_minimo, // AGREGAR stock_minimo
        };

        // Solo incluir descripción en modo no pedido
        if (tipo !== 'pedido') {
            baseData.description = producto.description || '--';
        }

        return baseData;
    });

    // Función para obtener el badge
    const getBadge = (producto) => {
        if (tipo === 'pedido') {
            const cantidadEnCanasta = getCantidadEnCanasta(producto.id);
            return cantidadEnCanasta > 0 ? cantidadEnCanasta : null;
        }
        return null;
    };

    // Función para obtener el badge de celda (COPIADO EXACTO de PanelMovimientos.jsx)
    const getCellBadge = (item, headerKey) => {
        if (headerKey === 'quantity') {
            const stock = parseFloat(item.quantity || 0);
            const stockMinimo = parseFloat(item.stock_minimo || 0);
            
            // Solo mostrar azul si stock_minimo es null/undefined (no definido)
            if (item.stock_minimo === null || item.stock_minimo === undefined) {
                return {
                    text: `${stock} ${item.type_measure?.code || ''}`,
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
                text: `${stock} ${item.type_measure?.code || ''}`,
                className: className
            };
        }
        return null;
    };

    // Función para obtener el flot del stock en ItemView (móvil)
    const getStockFlot = (producto) => {
        const stock = parseFloat(producto.quantity || 0);
        const stockMinimo = parseFloat(producto.stock_minimo || 0);
        
        // Solo usar flot1 (azul) si stock_minimo es null/undefined (no definido)
        if (producto.stock_minimo === null || producto.stock_minimo === undefined) {
            return {
                flot1: `${stock.toFixed(2)} ${producto.type_measure?.code || ''}`,
                flot2: null,
                flot3: null
            };
        }
        
        const diferencia = stock - stockMinimo;
        
        if (diferencia >= 20) {
            // Stock OK - flot1 (azul)
            return {
                flot1: `${stock.toFixed(2)} ${producto.type_measure?.code || ''}`,
                flot2: null,
                flot3: null
            };
        } else if (diferencia >= 5) {
            // Stock Bajo - flot2 (naranja)
            return {
                flot1: null,
                flot2: `${stock.toFixed(2)} ${producto.type_measure?.code || ''}`,
                flot3: null
            };
        } else {
            // Stock Crítico - flot3 (rojo) - incluye cuando stock = stock_minimo
            return {
                flot1: null,
                flot2: null,
                flot3: `${stock.toFixed(2)} ${producto.type_measure?.code || ''}`
            };
        }
    };

    return (
        <>
            <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={true}>
                <HeaderView
                    onBack={() => setIsOpen(false)}
                    showSearch={true}
                    searchPlaceholder="Buscar producto"
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchNormalizedChange={handleSearchNormalizedChange}
                    onSearchClear={handleSearchClear}
                    searchExpanded={isSearchExpanded}
                    onSearchToggle={handleSearchToggle}
                    title={tipo === 'almacen' ? 'Materia Prima' : tipo === 'entrada' ? 'Entradas' : tipo === 'pedido' ? 'Realizar Pedidos' : 'Salidas o Ventas'}
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
                                    onScroll={handleScroll}
                                    style={{
                                        maxHeight: (tipo === 'entrada' || tipo === 'salida' || tipo === 'pedido')
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
                                            handleRegistro(productoOriginal, tipo);
                                        }}
                                        getBadge={getBadge}
                                        getCellBadge={getCellBadge}
                                        onScroll={handleScroll}
                                        columnWidths={tipo === 'pedido' ? {
                                            name: '35%',
                                            quantity: '25%',
                                            category_name: '25%',
                                            type_measure_name: '26%'
                                        } : {
                                            name: '25%',
                                            description: '25%',
                                            quantity: '20%',
                                            category_name: '15%',
                                            type_measure_name: '15%'
                                        }}
                                    />
                                </div>
                            ) : (
                                // Vista de cards para pantallas pequeñas con PullToRefresh
                                <PullToRefresh
                                    onRefresh={handleRefresh}
                                    screenName="Almacén"
                                    containerStyle={
                                        tipo === 'salida' || tipo === 'entrada' ? {
                                            maxHeight: '100%',
                                            minHeight: '100%'
                                        } : {
                                            maxHeight: 'calc(100% - 80px)',
                                            minHeight: 'calc(100% - 80px)'
                                        }
                                    }
                                    onScroll={handleScroll}
                                >



                                    {visibleItems.length > 0 ? (
                                        visibleItems.map((producto, index) => {
                                            const cantidadEnCanasta = getCantidadEnCanasta(producto.id);
                                            
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
                                                    badge={tipo === 'pedido' && cantidadEnCanasta > 0 ? cantidadEnCanasta : null}
                                                    flot1={stockFlot.flot1}
                                                    flot2={stockFlot.flot2}
                                                    flot3={stockFlot.flot3}
                                                />
                                            );
                                        })
                                    ) : (
                                        <NoData
                                            icon="box"
            title={searchQuery || categoriaFiltro !== null || tipoMedidaFiltro !== null ? 'Sin resultados' : 'No hay productos'}
            detail={searchQuery || categoriaFiltro !== null || tipoMedidaFiltro !== null ? 'Intenta ajustar los filtros de búsqueda' : ' Agrega productos para comenzar a gestionar tu inventario'}
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
                            onClick={() => { setIsCategoriasOpen(true); }}
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
                {/* Modal de ver registro*/}
                <VerProducto
                    isOpen={isOpenVerProducto}
                    setIsOpen={setIsOpenVerProducto}
                    registro={infoPersona}
                    onProductDeleted={handleProductDeleted}
                    onProductUpdated={handleProductUpdated}
                    typeMeasures={tiposMedida}
                />

                {/* Modal de editar*/}
                <EditarAgregar
                    isOpen={isAgregarOpen}
                    setIsOpen={setIsAgregarOpen}
                    tipo='agregar'
                    onProductCreated={handleProductCreated}
                    typeMeasures={tiposMedida}
                />

                <Notification
                    isVisible={notification.isVisible}
                    type={notification.type}
                    text={notification.text}
                />

                {/* Modal de categorías de acopio*/}
                <CategoriasAcopio
                    isOpen={isCategoriasOpen}
                    setIsOpen={setIsCategoriasOpen}
                />

                {/* Modal de movimiento (entrada/salida) */}
                <MovimientoAcopio
                    isOpen={isMovimientoOpen}
                    setIsOpen={setIsMovimientoOpen}
                    producto={infoPersona}
                    tipo={tipo}
                    onMovimientoCreated={handleMovimientoCreated}
                />
                {/* View de canasta de pedidos */}
                <CanastaPedidos
                    isOpen={isCartMode && isLargeScreen ? true : isCanastaOpen}
                    setIsOpen={setIsCanastaOpen}
                    productosCanasta={productosCanasta}
                    setProductosCanasta={setProductosCanasta}
                    onPedidoCreado={handlePedidoCreado}
                    onPedidoCreadoConDescarga={handlePedidoCreadoConDescarga}
                    isCartMode={isCartMode && isLargeScreen}
                    onWhatsAppSelect={isCartMode && isLargeScreen ? handleWhatsAppSelect : null}
                />

                {/* Modal de descarga del pedido generado */}
                <DescargaPedidoBuilder
                    isOpen={isDescargaPedidoOpen}
                    setIsOpen={setIsDescargaPedidoOpen}
                    pedidoId={pedidoIdParaDescarga}
                    tipo="acopio"
                    nombreArchivoDefault={localStorage.getItem('nombreArchivoPedidos') || `Pedido_Acopio_${new Date().toLocaleDateString('es-ES').replace(/\//g, '-')}`}
                    tituloDocumentoDefault={localStorage.getItem('tituloDocumentoPedidos') || `Pedido de Acopio #${pedidoIdParaDescarga?.slice(-8) || ''}`}
                    esPedido={true}
                />

                {/* Carga de datos - solo cuando está abierto */}
                {isOpen && (
                    <>
                        <FetchData
                            service={productsAcopioService}
                            serviceName="productsAcopioService"
                            isOpen={isOpen}
                            onDataLoaded={handleProductosLoaded}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                        <FetchData
                            service={categoryAcopioService}
                            serviceName="categoryAcopioService"
                            isOpen={isOpen}
                            onDataLoaded={(data) => {
                                setCategorias(data);
                                setCategoriasLoaded(true);
                            }}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                        <FetchData
                            service={typeMeasureService}
                            serviceName="typeMeasureService"
                            isOpen={isOpen}
                            onDataLoaded={(data) => {
                                setTiposMedida(data);
                                setTiposMedidaLoaded(true);
                            }}
                            onLoadingStart={handleLoadingStart}
                            onLoadingEnd={handleLoadingEnd}
                        />
                    </>
                )}
                {/* Botón flotante de WhatsApp - solo en móvil */}
                {tipo === 'pedido' && !(isCartMode && isLargeScreen) ? (
                    <div style={{
                        position: 'fixed',
                        bottom: '100px',
                        right: '20px',
                        zIndex: 200
                    }}>
                        <Select
                            icon="whatsapp"
                            iconOnly={true}
                            options={[
                                { value: 'historial', label: 'Historial', icon: 'history' },
                                { value: 'ultimo-pedido', label: 'Último pedido', icon: 'time-five' }
                            ]}
                            onChange={handleWhatsAppSelect}
                            dropdownDirection="right"
                            containerStyle={{ background: 'none' }}
                        />
                    </div>
                ) : ''}
            </View>
            {/* Filtro de tipos de medida */}
            <FiltroTipoMedida
                isOpen={isOpenTipoMedida}
                setIsOpen={setOpenTipoMedida}
                onTipoMedidaSeleccionado={handleTipoMedidaFilter}
            />

            {/* Filtro de categorías */}
            <FiltroCategoriasAcopio
                isOpen={isOpenCategoria}
                setIsOpen={setOpenCategoria}
                onCategoriaSeleccionada={handleCategoriaFilter}
            />
            {/* Filtro de ordenamiento */}
            <FiltroOrdenamientoAcopio
                isOpen={isOpenOrden}
                setIsOpen={setOpenOrden}
                onOrdenamientoSeleccionado={handleOrdenamiento}
            />



            {/* Modal de Historial WhatsApp */}
            <HistorialWhatsapp
                isOpen={isHistorialModalOpen}
                setIsOpen={setIsHistorialModalOpen}
                titulo={historialData.titulo}
                descripcion={historialData.descripcion}
                tipo={historialData.tipo}
                datos={historialData.datos}
            />
        </>
    );
}
export default AlmacenAcopio;