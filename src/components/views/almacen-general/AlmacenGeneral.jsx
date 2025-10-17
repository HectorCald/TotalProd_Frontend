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
import productsAlmacenService from '../../../services/productsAlmacenService';
import FiltroCategorias from '../../mixed/FiltroCategorias';
import FiltroOrdenamiento from '../../mixed/FiltroOrdenamiento';
import FetchData from '../../mixed/FetchData';
import pricesTypesService from '../../../services/pricesTypesService';
import sucursalesService from '../../../services/sucursalesService';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useUser } from '../../../context/UserContext';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import DescargaMovimientoBuilder from '../movimientos/DescargaMovimientoBuilder';


function AlmacenGeneral({ isOpen, setIsOpen, tipo = '', onPedidoActualizado = null, onEntregaConfirmada = null, pedidoIdEditando = null }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();

    // Determinar si es modo carrito (para panel lateral)
    const isCartMode = tipo === 'pedido' || tipo === 'entrada' || tipo === 'salida';

    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados para filtros locales
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [categoriaFiltroNombre, setCategoriaFiltroNombre] = useState('Categorías');
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    // Estados para filtros y modales
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [isCategoriasAlmacenOpen, setIsCategoriasAlmacenOpen] = useState(false);

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

    // Estados para la notificación
    const [notification, setNotification] = useState({ isVisible: false, type: 'success', text: '' });
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

    // Función simple para manejar el indicador de carga
    const handleLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
    }, []);
    useEffect(() => {
        if (!isOpen) {
            setShowRefreshIndicator(false);
            setIsRefreshing(false);
        }
    }, [isOpen]);

    // Mapear Información
    const productosMapeados = productos.map(producto => ({
        // Información básica
        id: producto.id,
        name: producto.name || '',
        codigo_barras: producto.codigo_barras || '',
        description: producto.description || '',
        stock: producto.stock || 0,
        grup: producto.grup || 0,
        created_at: producto.created_at,
        empresa_id: producto.empresa_id,

        // Información de categoría
        category_id: producto.category_id || '',
        category_name: producto.category_name || 'Sin categoría',
        category_almacen: producto.category_almacen || null,

        // Información de precios
        price_product: producto.price_product || [],

        // Información de recetas
        recetas: producto.recetas || [],

        // Información de sucursales
        productos_sucursal: producto.productos_sucursal || []
    }));
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
        setProductos(data);
    }, []);
    // Función para manejar cuando se cargan los precios
    const handlePreciosLoaded = useCallback((data) => {
        setPreciosData(data);
    }, []);
    // Función para manejar cuando se cargan las sucursales
    const handleSucursalesLoaded = useCallback((data) => {
        setSucursalesData(data);
    }, []);



    // Función para manejar el click en un producto
    const handleRegistro = (producto, tipo) => {
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
    };


    // Funciones de filtrado locales
    const handleCategoriaFilter = (categoriaId, categoriaNombre = null) => {
        setCategoriaFiltro(categoriaId);
        if (categoriaId === null) {
            setCategoriaFiltroNombre('Categorías');
        } else if (categoriaId === '') {
            setCategoriaFiltroNombre('Sin categoría');
        } else if (categoriaNombre) {
            setCategoriaFiltroNombre(categoriaNombre);
        }
    };
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
    };
     const productosFiltrados = productosMapeados.filter(producto => {
        // Filtro de búsqueda
        const matchesSearch = !searchQuery ||
            producto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (producto.description && producto.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
            (producto.codigo_barras && producto.codigo_barras.toLowerCase().includes(searchQuery.toLowerCase()));

        // Filtro de categoría
        const matchesCategoria = categoriaFiltro === null ||
            (categoriaFiltro === '' ? !producto.category_id : producto.category_id === categoriaFiltro);

        return matchesSearch && matchesCategoria;
    }).sort((a, b) => {
        // Ordenamiento
        switch (ordenamiento) {
            case 'nombre_asc':
                return a.name.localeCompare(b.name);
            case 'nombre_desc':
                return b.name.localeCompare(a.name);
            case 'stock_asc':
                return (a.stock || 0) - (b.stock || 0);
            case 'stock_desc':
                return (b.stock || 0) - (a.stock || 0);
            default:
                return a.name.localeCompare(b.name);
        }
    });



    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCategoriaFiltro(null);
            setCategoriaFiltroNombre('Categorías');
            setOrdenamiento('nombre_asc');

            // Cargar canastas desde localStorage
            cargarCanastasDesdeLocalStorage();
        }
    }, [isOpen]);

    // Efecto para cargar productos del pedido automáticamente cuando es una entrega
    useEffect(() => {
        if (isOpen && tipo === 'salida' && localStorage.getItem('pedidoIdEntregando')) {
            // Si es una entrega, cargar los productos del pedido automáticamente
            const pedidoId = localStorage.getItem('pedidoIdEntregando');
            if (pedidoId && productos.length > 0) {
                // Obtener los productos del pedido desde el localStorage o desde la API
                // Por ahora, asumimos que los productos vienen en el localStorage
                const productosPedido = localStorage.getItem('productosPedidoEntregando');
                if (productosPedido) {
                    try {
                        const productosParaEntregar = JSON.parse(productosPedido);
                        // Agregar cada producto a la canasta de salidas con la cantidad específica del pedido
                        productosParaEntregar.forEach(productoPedido => {
                            const productoCompleto = productos.find(p => p.id === productoPedido.id);
                            if (productoCompleto) {
                                handleAgregarACanastaMovimientos(productoCompleto, 'salida', null, productoPedido.cantidad);
                            }
                        });
                        // Limpiar el localStorage temporal
                        localStorage.removeItem('productosPedidoEntregando');
                    } catch (error) {
                        console.error('Error al cargar productos del pedido:', error);
                    }
                }
            }
        }
    }, [isOpen, tipo, productos]);

    // Efecto para cargar productos del pedido automáticamente cuando se está editando
    useEffect(() => {
        if (isOpen && tipo === 'pedido' && localStorage.getItem('pedidoIdEditando')) {
            // Si se está editando un pedido, cargar los productos del pedido automáticamente
            const pedidoId = localStorage.getItem('pedidoIdEditando');
            if (pedidoId && productos.length > 0) {
                const productosPedido = localStorage.getItem('productosPedidoEditando');
                if (productosPedido) {
                    try {
                        const productosParaEditar = JSON.parse(productosPedido);
                        // Agregar cada producto a la canasta de pedidos con la cantidad específica del pedido
                        productosParaEditar.forEach(productoPedido => {
                            const productoCompleto = productos.find(p => p.id === productoPedido.id);
                            if (productoCompleto) {
                                handleAgregarACanasta(productoCompleto, productoPedido.cantidad);
                            }
                        });
                        // Limpiar el localStorage temporal
                        localStorage.removeItem('productosPedidoEditando');
                    } catch (error) {
                        console.error('Error al cargar productos del pedido para editar:', error);
                    }
                }
            }
        }
    }, [isOpen, tipo, productos]);

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

    // Efecto separado para limpiar variables cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            // Cuando se cierra el modal, limpiar pedidoIdEntregando, precioIdEditando y precioIdEntregando del localStorage
            if (tipo === 'pedido') {
                localStorage.removeItem('pedidoIdEditando');
                localStorage.removeItem('precioIdEditando');
                localStorage.removeItem('pedidoAgrupadoEditando');
                localStorage.removeItem('productosPedidoEditando');
            }
            if (tipo === 'salida') {
                localStorage.removeItem('pedidoIdEntregando');
                localStorage.removeItem('precioIdEntregando');
            }
        }
    }, [isOpen, tipo]);

   

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
        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
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

    // Función para manejar la canasta de pedidos
    const handleAgregarACanasta = (producto, cantidadEspecifica = null) => {
        const productoExistente = productosCanasta.find(p => p.id === producto.id);

        // Obtener el precio correcto según el tipo seleccionado
        let precioProducto = 0;
        let precioActual = null;

        // Intentar obtener el precio seleccionado de la canasta de pedidos
        if (window.getPrecioSeleccionadoCanastaPedidos) {
            precioActual = window.getPrecioSeleccionadoCanastaPedidos();
        }

        if (precioActual && producto.price_product && producto.price_product.length > 0) {
            // Buscar el precio del tipo seleccionado
            const precioTipo = producto.price_product.find(pp => pp.prices_types?.id === precioActual);
            precioProducto = precioTipo ? precioTipo.valor : (producto.price_product[0]?.valor || 0);
        } else {
            // Si no hay precio seleccionado, usar el primer precio
            precioProducto = producto.price_product && producto.price_product.length > 0
                ? producto.price_product[0].valor
                : 0;
        }

        if (productoExistente) {
            // Si se especifica una cantidad (para edición), usar esa cantidad
            if (cantidadEspecifica !== null) {
                setProductosCanasta(prev => prev.map(p =>
                    p.id === producto.id
                        ? { ...p, cantidad: cantidadEspecifica }
                        : p
                ));
                return;
            }

            // Si ya existe, aumentar la cantidad
            setProductosCanasta(prev => prev.map(p =>
                p.id === producto.id
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            // Si no existe, agregarlo nuevo con el precio correcto
            // Determinar si la canasta de pedidos está en modo agrupado
            let esAgrupado = false;
            if (window.getModoAgrupacionCanastaPedidos) {
                esAgrupado = window.getModoAgrupacionCanastaPedidos() === 'agrupado';
            }

            let cantidadInicial = cantidadEspecifica !== null ? cantidadEspecifica : 1;
            let precioFinal = precioProducto;
            let stockMostrado = producto.stock;

            if (esAgrupado && producto.grup) {
                if (cantidadEspecifica === null) {
                    cantidadInicial = 1; // 1 grupo
                }
                precioFinal = precioProducto * (producto.grup || 1); // precio por grupo
                stockMostrado = Math.floor((producto.stock || 0) / (producto.grup || 1)); // stock en grupos
            }

            setProductosCanasta(prev => [...prev, {
                ...producto,
                cantidad: cantidadInicial,
                precio: precioFinal,
                stock: stockMostrado,
                stockOriginal: producto.stock,
                medidaPedido: 'kg',
                observacionesPedido: ''
            }]);
        }
    };
    const getCantidadEnCanasta = (productoId) => {
        const producto = productosCanasta.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    };

    // Función para manejar la canasta de movimientos (entradas y salidas separadas)
    const handleAgregarACanastaMovimientos = (producto, tipoMovimiento, precioSeleccionado = null, cantidadEspecifica = null) => {
        // Para salidas, validar que el producto tenga stock
        if (tipoMovimiento === 'salida' && (!producto.stock || producto.stock <= 0)) {
            mostrarNotificacion('error', 'No se puede agregar el producto porque no tiene stock disponible');
            return;
        }

        // Determinar qué canasta usar
        const esEntrada = tipoMovimiento === 'entrada';
        const canastaActual = esEntrada ? productosCanastaEntradas : productosCanastaSalidas;
        const setCanastaActual = esEntrada ? setProductosCanastaEntradas : setProductosCanastaSalidas;
        const nombreLocalStorage = esEntrada ? 'canastaEntradas' : 'canastaSalidas';

        const productoExistente = canastaActual.find(p => p.id === producto.id);

        // Obtener el precio correcto según el tipo seleccionado
        let precioProducto = 0;

        // Si no se pasa precioSeleccionado como parámetro, intentar obtenerlo de la canasta
        let precioActual = precioSeleccionado;
        if (!precioActual && tipoMovimiento === 'entrada' && window.getPrecioSeleccionadoCanastaMovimientosEntrada) {
            precioActual = window.getPrecioSeleccionadoCanastaMovimientosEntrada();
        } else if (!precioActual && tipoMovimiento === 'salida' && window.getPrecioSeleccionadoCanastaMovimientos) {
            precioActual = window.getPrecioSeleccionadoCanastaMovimientos();
        }

        if (precioActual && producto.price_product && producto.price_product.length > 0) {
            // Buscar el precio del tipo seleccionado
            const precioTipo = producto.price_product.find(pp => pp.prices_types?.id === precioActual);
            precioProducto = precioTipo ? precioTipo.valor : (producto.price_product[0]?.valor || 0);
        } else {
            // Si no hay precio seleccionado, usar el primer precio
            precioProducto = producto.price_product && producto.price_product.length > 0
                ? producto.price_product[0].valor
                : 0;
        }

        if (productoExistente) {
            // Si se especifica una cantidad (para entregas), usar esa cantidad
            if (cantidadEspecifica !== null) {
                setCanastaActual(prev => prev.map(p =>
                    p.id === producto.id
                        ? { ...p, cantidad: cantidadEspecifica }
                        : p
                ));
                return;
            }

            // Para salidas, validar que no exceda el stock disponible
            let stockParaValidar = producto.stock; // Stock original en unidades

            // Si está en modo agrupado y el producto tiene grupo, convertir a grupos
            let modoAgrupacionActual = null;
            if (tipoMovimiento === 'entrada' && window.getModoAgrupacionCanastaMovimientosEntrada) {
                modoAgrupacionActual = window.getModoAgrupacionCanastaMovimientosEntrada();
            } else if (tipoMovimiento === 'salida' && window.getModoAgrupacionCanastaMovimientos) {
                modoAgrupacionActual = window.getModoAgrupacionCanastaMovimientos();
            } else if (localStorage.getItem('pedidoAgrupadoEntregando')) {
                modoAgrupacionActual = localStorage.getItem('pedidoAgrupadoEntregando');
            }
            if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                stockParaValidar = Math.floor(producto.stock / producto.grup); // Stock en grupos
            }

            if (tipoMovimiento === 'salida' && productoExistente.cantidad >= stockParaValidar) {
                mostrarNotificacion('error', `No se puede agregar más cantidad. Stock disponible: ${stockParaValidar}`);
                return;
            }

            // Si ya existe y no excede el stock (para salidas), aumentar la cantidad
            setCanastaActual(prev => prev.map(p =>
                p.id === producto.id
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            // Si no existe, agregarlo nuevo con el precio correcto
            // Obtener el modo de agrupación desde la canasta o desde el pedido (entrega)
            let cantidadInicial = cantidadEspecifica !== null ? cantidadEspecifica : 1;
            let precioFinal = precioProducto;
            let stockMostrado = producto.stock;

            let modoAgrupacionActual = null;
            if (tipoMovimiento === 'entrada' && window.getModoAgrupacionCanastaMovimientosEntrada) {
                modoAgrupacionActual = window.getModoAgrupacionCanastaMovimientosEntrada();
            } else if (tipoMovimiento === 'salida' && window.getModoAgrupacionCanastaMovimientos) {
                modoAgrupacionActual = window.getModoAgrupacionCanastaMovimientos();
            } else if (localStorage.getItem('pedidoAgrupadoEntregando')) {
                modoAgrupacionActual = localStorage.getItem('pedidoAgrupadoEntregando');
            }
            if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                if (cantidadEspecifica === null) {
                    cantidadInicial = 1;
                }
                precioFinal = precioProducto * (producto.grup || 1);
                stockMostrado = Math.floor((producto.stock || 0) / (producto.grup || 1));
            }

            setCanastaActual(prev => [...prev, {
                ...producto,
                cantidad: cantidadInicial,
                precio: precioFinal,
                stock: stockMostrado,
                stockOriginal: producto.stock // Guardar el stock original en unidades
            }]);
        }

        // El localStorage se guardará automáticamente en el useEffect de CanastaMovimientos
    };
    const getCantidadEnCanastaMovimientos = (productoId, tipoMovimiento) => {
        const esEntrada = tipoMovimiento === 'entrada';
        const canastaActual = esEntrada ? productosCanastaEntradas : productosCanastaSalidas;
        const producto = canastaActual.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    };

    // Función para obtener el nombre de la categoría seleccionada
    const getCategoriaNombre = () => {
        if (categoriaFiltro === null) return 'Categorías';
        if (categoriaFiltro === '') return 'Sin categoría';
        return categoriaFiltroNombre || 'Categorías';
    };
    // Función para obtener el nombre del ordenamiento
    const getOrdenamientoNombre = () => {
        const ordenamientos = {
            'nombre_asc': 'Nombre A-Z',
            'nombre_desc': 'Nombre Z-A',
            'stock_asc': 'Stock ↑',
            'stock_desc': 'Stock ↓'
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
            label: getOrdenamientoNombre(),
            active: ordenamiento !== 'nombre_asc',
            onClick: () => setOpenOrden(true)
        },
    ];


    // Headers para la tabla
    const tableHeaders = [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'codigo_barras', label: 'C. Barras', icon: 'barcode' },
        { key: 'stock', label: 'Stock', icon: 'bar-chart-alt-2' },
        { key: 'stock_grup', label: 'Grup', icon: 'package' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' }
    ];
    // Datos para la tabla
    const tableData = productosFiltrados.map(producto => ({
        id: producto.id,
        name: producto.name,
        codigo_barras: producto.codigo_barras,
        stock: `${producto.stock} Ud.`,
        stock_grup: producto.grup ? Math.floor(producto.stock / producto.grup) + ' Ud.' : '--',
        category_name: producto.category_name,
    }));

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

    return (
        <>
            <View isOpen={isOpen} setIsOpen={setIsOpen} isMainView={!pedidoIdEditando && !localStorage.getItem('pedidoIdEntregando')}>
                <HeaderView
                    onBack={() => setIsOpen(false)}
                    showSearch={true}
                    searchPlaceholder="Buscar producto"
                    title={tipo === 'almacen' ? 'Almacén' : tipo === 'entrada' ? 'Entradas' : tipo === 'pedido' ? 'Realizar Pedidos' : 'Salidas o Ventas'}
                    searchValue={searchQuery}
                    onSearchChange={handleSearchChange}
                    onSearchClear={handleSearchClear}
                    searchExpanded={isSearchExpanded}
                    onSearchToggle={handleSearchToggle}
                />
                <div className={`${styles.container} ${isCartMode && isLargeScreen ? styles.containerWithCart : ''}`}>
                    <div className={styles.titleContainer}>
                        <RefreshIndicator
                            isVisible={showRefreshIndicator}
                            isLoading={isRefreshing}
                        />
                    </div>
                    <Filtros options={opciones} />
                    <div className={styles.content}
                        style={{
                            maxHeight: (tipo === 'entrada' || tipo === 'salida' || tipo === 'pedido') && isLargeScreen
                                ? '100vh'
                                : ''
                        }}
                    >
                        {isLargeScreen ? (
                            // Vista de tabla para pantallas grandes
                            <Table
                                headers={tableHeaders}
                                data={tableData}
                                onRowClick={(producto) => {
                                    // Buscar el producto original sin formatear
                                    const productoOriginal = productosFiltrados.find(p => p.id === producto.id);
                                    handleRegistro(productoOriginal, tipo);
                                }}
                                getBadge={getBadge}
                            />
                        ) : (
                            // Vista de cards para pantallas pequeñas
                            productosFiltrados.length > 0 ? (
                                productosFiltrados.map((producto, index) => {
                                    const cantidadEnCanasta = getCantidadEnCanasta(producto.id);
                                    const cantidadEnCanastaMovimientos = (tipo === 'entrada' || tipo === 'salida')
                                        ? getCantidadEnCanastaMovimientos(producto.id, tipo)
                                        : 0;
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
                                            flot1={producto.stock + ' Ud.'}
                                        />
                                    );
                                })
                            ) : (
                                <div className={styles.noData}>
                                    <p>{searchQuery || categoriaFiltro !== null ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                                </div>
                            )
                        )}
                    </div>
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

                {/* Carga de datos - solo cuando está abierto */}
                {isOpen && (
                    <>
                        <FetchData
                            service={productsAlmacenService}
                            serviceName="productsAlmacenService"
                            isOpen={isOpen}
                            onDataLoaded={handleProductosLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
                        />
                        <FetchData
                            service={pricesTypesService}
                            serviceName="pricesTypesService"
                            isOpen={isOpen}
                            onDataLoaded={handlePreciosLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
                        />
                        <FetchData
                            service={sucursalesService}
                            serviceName="sucursalesService"
                            method="getByEmpresaId"
                            isOpen={isOpen}
                            onDataLoaded={handleSucursalesLoaded}
                            onLoadingStart={() => handleLoading(true)}
                            onLoadingEnd={() => handleLoading(false)}
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
                        onCerrarCanasta={(productosActualizados, precioId, movimientoId, pedidoActualizadoData) => {
                            // Si es una entrega, llamar a la función de entrega
                            if (onEntregaConfirmada && localStorage.getItem('pedidoIdEntregando')) {
                                onEntregaConfirmada(productosActualizados, precioId, movimientoId, pedidoActualizadoData);
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