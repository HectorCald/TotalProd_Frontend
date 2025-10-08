import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ItemView from '../../common/ItemView';
import VerProducto from './VerProducto';
import Filtros from '../../common/Filtros';
import Boton from '../../common/Boton';
import EditarAgregar from '../almacen-acopio/EditarAgregar';
import CategoriasAcopio from './CategoriasAcopio';
import MovimientoAcopio from './MovimientoAcopio';
import CanastaPedidos from './CanastaPedidos';
import productsAcopioService from '../../../services/productsAcopioService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import typeMeasureService from '../../../services/typeMeasureService';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import Notification from '../../common/Notification';
import { useLayout } from '../../../context/LayoutContext';
import Table from '../../common/Table';
import FiltroCategoriasAcopio from '../../mixed/FiltroCategoriasAcopio';
import FiltroTipoMedida from '../../mixed/FiltroTipoMedida';
import FiltroOrdenamientoAcopio from '../../mixed/FiltroOrdenamientoAcopio';
import FetchData from '../../mixed/FetchData';

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
    const [isSearchExpanded, setIsSearchExpanded] = useState(false);

    // Estados para los datos
    const [categorias, setCategorias] = useState([]);
    const [tiposMedida, setTiposMedida] = useState([]);
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados para filtros locales
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [tipoMedidaFiltro, setTipoMedidaFiltro] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    // Estados para productos
    const [productos, setProductos] = useState([]);
    const [error, setError] = useState(null);

    // Función simple para manejar el indicador de carga
    const handleLoading = useCallback((isLoading) => {
        setShowRefreshIndicator(isLoading);
        setIsRefreshing(isLoading);
    }, []);



    // Función para manejar cuando se cargan los productos
    const handleProductosLoaded = useCallback((data) => {
        setProductos(data);
    }, []);


    // Mapear Información de productos
    const productosMapeados = productos.map(producto => ({
        // Información básica
        id: producto.id,
        name: producto.name || '',
        description: producto.description || '',
        quantity: producto.quantity || 0,
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
    const [isOpenCategoria, setOpenCategoria] = useState(false);
    const [isOpenTipoMedida, setOpenTipoMedida] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);

    // Estados para canasta de pedidos
    const [productosCanasta, setProductosCanasta] = useState([]);
    const [isCanastaOpen, setIsCanastaOpen] = useState(false);

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
            setCategoriaFiltro(null);
            setTipoMedidaFiltro(null);
            setOrdenamiento('nombre_asc');
            
            // Cargar canastas desde localStorage
            cargarCanastasDesdeLocalStorage();
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

    // Filtrar y ordenar productos localmente
    const productosFiltrados = productosMapeados.filter(producto => {
        // Filtro de búsqueda
        const matchesSearch = !searchQuery || 
            producto.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            (producto.description && producto.description.toLowerCase().includes(searchQuery.toLowerCase()));

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
        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto actualizado correctamente')
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

    const getCantidadEnCanasta = (productoId) => {
        const producto = productosCanasta.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
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
    const tableHeaders = [
        { key: 'name', label: 'Producto', icon: 'package' },
        { key: 'description', label: 'Descripción', icon: 'comment' },
        { key: 'quantity', label: 'Cantidad', icon: 'bar-chart-alt-2' },
        { key: 'category_name', label: 'Categoría', icon: 'tag' },
        { key: 'type_measure_name', label: 'Medida', icon: 'ruler' }
    ];

    // Datos para la tabla
    const tableData = productosFiltrados.map(producto => ({
        id: producto.id,
        name: producto.name,
        description: producto.description || '--',
        quantity: `${parseFloat(producto.quantity || 0).toFixed(2)} ${producto.type_measure?.code || ''}`,
        category_name: producto.category_name || '--',
        type_measure_name: producto.type_measure?.name || '--'
    }));

    // Función para obtener el badge
    const getBadge = (producto) => {
        if (tipo === 'pedido') {
            const cantidadEnCanasta = getCantidadEnCanasta(producto.id);
            return cantidadEnCanasta > 0 ? cantidadEnCanasta : null;
        }
        return null;
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
                onSearchClear={handleSearchClear}
                searchExpanded={isSearchExpanded}
                onSearchToggle={handleSearchToggle}
                title={tipo === 'almacen' ? 'Materia Prima' : tipo === 'entrada' ? 'Entradas' : tipo === 'pedido' ? 'Realizar Pedidos' : 'Salidas o Ventas'}
            />
            <div className={`${styles.container} ${isCartMode && isLargeScreen ? styles.containerWithCart : ''}`}>
                <div className={styles.titleContainer}>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
                <Filtros options={opciones} />
                <div
                    className={styles.content}
                    style={{
                        maxHeight: (tipo === 'entrada' || tipo === 'salida' || tipo === 'pedido') && isLargeScreen
                            ? '100%'
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
                                        flot1={parseFloat(producto.quantity || 0).toFixed(2) + ' ' + producto.type_measure.code}
                                    />
                                );
                            })
                        ) : (
                            <div className={styles.noData}>
                                <p>{searchQuery || categoriaFiltro !== null || tipoMedidaFiltro !== null ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
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
                isCartMode={isCartMode && isLargeScreen}
            />

            {/* Carga de datos - solo cuando está abierto */}
            {isOpen && (
                <>
                    <FetchData
                        service={productsAcopioService}
                        serviceName="productsAcopioService"
                        isOpen={isOpen}
                        onDataLoaded={handleProductosLoaded}
                        onLoadingStart={() => handleLoading(true)}
                        onLoadingEnd={() => handleLoading(false)}
                    />
                    <FetchData
                        service={categoryAcopioService}
                        serviceName="categoryAcopioService"
                        isOpen={isOpen}
                        onDataLoaded={setCategorias}
                    />
                    <FetchData
                        service={typeMeasureService}
                        serviceName="typeMeasureService"
                        isOpen={isOpen}
                        onDataLoaded={setTiposMedida}
                    />
                </>
            )}
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
        </>
    );
}
export default AlmacenAcopio;