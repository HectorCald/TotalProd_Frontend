import React, { useState, useEffect } from 'react';
import { useDebounce } from 'use-debounce';
import styles from '../../../styles/Inicial.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import InputSearch from '../../common/InputSearch';
import ItemView from '../../common/ItemView';
import VerProducto from './VerProducto';
import Filtros from '../../common/Filtros';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import ItemLine from '../../common/ItemLine';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import CategoriasAlmacen from './CategoriasAlmacen';
import CanastaPedidos from './CanastaPedidos';
import CanastaMovimientos from './CanastaMovimientos';
import InputCantidad from '../../common/InputCantidad';
import Select from '../../common/Select';
import InputNormal from '../../common/InputNormal';
import productsAlmacenService from '../../../services/productsAlmacenService';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';

const medidas = [
    { value: 'kilo', label: 'Kilo', icon: 'tag' },
    { value: 'quintal', label: 'Quital', icon: 'tag' },
    { value: 'arroba', label: 'Arroba', icon: 'tag' },
    { value: 'caja', label: 'Caja', icon: 'tag' },
    { value: 'unidad', label: 'Unidad', icon: 'tag' },
    { value: 'libra', label: 'Libras', icon: 'tag' },
];

function AlmacenGeneral({ isOpen, setIsOpen, tipo = '' }) {
    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);
    const [isCategoriasOpen, setIsCategoriasOpen] = useState(false);

    // Estados para la carga
    const [loading, setLoading] = useState(false);
    const [loadingMore, setLoadingMore] = useState(false);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMorePages, setHasMorePages] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);
    
    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para los datos
    const [productoData, setProductoData] = useState([]);
    const [categorias, setCategorias] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(false);

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
    const [isOpenItem, setOpenItem] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [selectedMedidas, setSelectedMedidas] = useState('');

    // Estados para filtros de categoría y ordenamiento
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    // Estados para canasta de pedidos
    const [productosCanasta, setProductosCanasta] = useState([]);
    const [isCanastaOpen, setIsCanastaOpen] = useState(false);

    // Estados para canasta de movimientos (entradas y salidas separadas)
    const [productosCanastaEntradas, setProductosCanastaEntradas] = useState([]);
    const [productosCanastaSalidas, setProductosCanastaSalidas] = useState([]);
    const [isCanastaMovimientosOpen, setIsCanastaMovimientosOpen] = useState(false);

    // Cargar canasta desde localStorage al inicializar
    useEffect(() => {
        const canastaGuardada = localStorage.getItem('canastaPedidos');
        if (canastaGuardada) {
            try {
                setProductosCanasta(JSON.parse(canastaGuardada));
            } catch (error) {
                console.error('Error al cargar canasta desde localStorage:', error);
                localStorage.removeItem('canastaPedidos');
            }
        }

        // Cargar canasta de entradas
        const canastaEntradasGuardada = localStorage.getItem('canastaEntradas');
        if (canastaEntradasGuardada) {
            try {
                setProductosCanastaEntradas(JSON.parse(canastaEntradasGuardada));
            } catch (error) {
                console.error('Error al cargar canasta de entradas desde localStorage:', error);
                localStorage.removeItem('canastaEntradas');
            }
        }

        // Cargar canasta de salidas
        const canastaSalidasGuardada = localStorage.getItem('canastaSalidas');
        if (canastaSalidasGuardada) {
            try {
                setProductosCanastaSalidas(JSON.parse(canastaSalidasGuardada));
            } catch (error) {
                console.error('Error al cargar canasta de salidas desde localStorage:', error);
                localStorage.removeItem('canastaSalidas');
            }
        }
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

    // Función para cargar las categorías
    const fetchCategorias = async () => {
        try {
            setLoadingCategorias(true);
            const response = await categoryAlmacenService.getAll();
            if (response.success && response.data) {
                const mappedCategorias = response.data.map(cat => ({
                    value: cat.id,
                    label: cat.name,
                    id: cat.id,
                    name: cat.name
                }));
                setCategorias(mappedCategorias);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            setLoadingCategorias(false);
        }
    };


    // Función para obtener los productos
    const fetchProducts = async (page = 1, reset = true, isSearch = false, categoriaOverride = null, ordenamientoOverride = null, searchQueryOverride = null) => {
        try {
            if (reset) {
                if (isSearch) {
                    setIsSearching(true);
                } else {
                    setLoading(true);
                }
            } else {
                setLoadingMore(true);
            }

            // Usar override si se proporciona, sino usar el estado
            const categoriaToUse = categoriaOverride !== undefined ? categoriaOverride : categoriaFiltro;
            const ordenamientoToUse = ordenamientoOverride !== undefined ? ordenamientoOverride : ordenamiento;
            const searchQueryToUse = searchQueryOverride !== undefined ? searchQueryOverride : searchQuery;

            const response = await productsAlmacenService.getAll();
            if (response.success && response.data) {
                let productosFiltrados = response.data;

                // Aplicar búsqueda por texto
                if (searchQueryToUse && searchQueryToUse.trim() !== '') {
                    const query = searchQueryToUse.toLowerCase().trim();
                    productosFiltrados = productosFiltrados.filter(producto => 
                        (producto.name && producto.name.toLowerCase().includes(query)) ||
                        (producto.description && producto.description.toLowerCase().includes(query)) ||
                        (producto.codigo_barras && producto.codigo_barras.toLowerCase().includes(query)) ||
                        (producto.category_almacen && producto.category_almacen.name && producto.category_almacen.name.toLowerCase().includes(query))
                    );
                }

                // Aplicar filtro de categoría
                if (categoriaToUse !== null) {
                    if (categoriaToUse === '') {
                        // Productos sin categoría
                        productosFiltrados = productosFiltrados.filter(producto => !producto.category_almacen);
                    } else {
                        // Productos con categoría específica
                        productosFiltrados = productosFiltrados.filter(producto => 
                            producto.category_almacen && producto.category_almacen.id === categoriaToUse
                        );
                    }
                }

                // Aplicar ordenamiento
                if (ordenamientoToUse) {
                    productosFiltrados.sort((a, b) => {
                        switch (ordenamientoToUse) {
                            case 'nombre_asc':
                                return (a.name || '').localeCompare(b.name || '');
                            case 'nombre_desc':
                                return (b.name || '').localeCompare(a.name || '');
                            case 'stock_asc':
                                return (a.stock || 0) - (b.stock || 0);
                            case 'stock_desc':
                                return (b.stock || 0) - (a.stock || 0);
                            default:
                                return 0;
                        }
                    });
                }

                if (reset) {
                    setProductoData(productosFiltrados);
                } else {
                    setProductoData(prev => [...prev, ...productosFiltrados]);
                }

                setCurrentPage(page);
                setHasMorePages(response.pagination?.hasNextPage || false);

            } else {
                // Si no es éxito pero tampoco es un error de plan, no abrir modal
                console.log('Respuesta del servidor:', response);
            }
        } catch (error) {
            console.error('Error obteniendo productos:', error);
        } finally {
            setLoading(false);
            setLoadingMore(false);
            setIsSearching(false);
        }
    };

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !loadingMore) {
            fetchProducts(currentPage + 1, false);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchProducts(1, true, true, categoriaFiltro, ordenamiento, query); // isSearch = true
    };

    // Función para manejar filtro de categoría
    const handleCategoriaFilter = (categoriaId) => {
        setCategoriaFiltro(categoriaId);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchProducts(1, true, false, categoriaId, ordenamiento, searchQuery);
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
        setHasMorePages(true);
        fetchProducts(1, true, false, categoriaFiltro, orden, searchQuery);
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
        }
    }, [isOpen]);

    // Efecto único para cargar datos y búsqueda
    useEffect(() => {
        if (isOpen) {
            console.log('AlmacenGeneral - Cargando datos');
            // Asegurar que el modal esté cerrado al abrir el componente
            fetchCategorias();
            setCurrentPage(1);
            setHasMorePages(true);
            
            // Si hay búsqueda, buscar; si no, cargar todos
            if (debouncedSearchQuery) {
                handleSearch(debouncedSearchQuery);
            } else {
                fetchProducts(1, true, false, categoriaFiltro, ordenamiento, '');
            }
        }
    }, [isOpen, debouncedSearchQuery]);

    // Función para manejar cuando se crea un nuevo producto
    const handleProductCreated = (newProduct) => {
        // Agregar el nuevo producto a la lista
        setProductoData(prev => [newProduct, ...prev]);
        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Producto agregado correctamente')
    };

    // Función para manejar cuando se elimina un producto
    const handleProductDeleted = (deletedId) => {
        // Remover el producto eliminado de la lista
        setProductoData(prev => prev.filter(producto => producto.id !== deletedId));
        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto eliminado correctamente')
    };

    // Función para manejar cuando se actualiza un producto
    const handleProductUpdated = (updatedProduct) => {
        // Actualizar solo el producto específico en la lista
        setProductoData(prev => prev.map(producto =>
            producto.id === updatedProduct.id ? updatedProduct : producto
        ));
        // Actualizar también el producto que se está viendo
        setInfoPersona(updatedProduct);
        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto actualizado correctamente')
    };

    // Función para manejar cuando se actualizan múltiples productos (después de movimientos)
    const handleProductosUpdated = (productosActualizados) => {
        // Actualizar cada producto en la lista con su nuevo stock
        setProductoData(prev => prev.map(producto => {
            const productoActualizado = productosActualizados.find(p => p.id === producto.id);
            return productoActualizado ? productoActualizado : producto;
        }));
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

    const getCantidadEnCanasta = (productoId) => {
        const producto = productosCanasta.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    };

    // Función para manejar la canasta de movimientos (entradas y salidas separadas)
    const handleAgregarACanastaMovimientos = (producto, tipoMovimiento) => {
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

        // Obtener el primer precio del producto si existe
        const primerPrecio = producto.price_product && producto.price_product.length > 0 
            ? producto.price_product[0].valor 
            : 0;

        if (productoExistente) {
            // Para salidas, validar que no exceda el stock disponible
            if (tipoMovimiento === 'salida' && productoExistente.cantidad >= producto.stock) {
                mostrarNotificacion('error', `No se puede agregar más cantidad. Stock disponible: ${producto.stock}`);
                return;
            }
            
            // Si ya existe y no excede el stock (para salidas), aumentar la cantidad
            setCanastaActual(prev => prev.map(p =>
                p.id === producto.id
                    ? { ...p, cantidad: p.cantidad + 1 }
                    : p
            ));
        } else {
            // Si no existe, agregarlo nuevo con el precio del producto
            setCanastaActual(prev => [...prev, {
                ...producto,
                cantidad: 1,
                precio: primerPrecio
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
        if (!categoriaFiltro) return 'Categorías';
        const categoria = categorias.find(c => c.id === categoriaFiltro);
        return categoria ? categoria.name : 'Categorías';
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

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='box' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Almacen</h1>
                <p className={styles.subTitle}>Administra tu almacen de productos</p>
                <div className={styles.searchContainer}>
                    <InputSearch
                        placeholder='Buscar producto'
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                        }}
                    />
                </div>
                <Filtros options={opciones} />
                <div className={styles.content} onScroll={handleScroll}>
                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : productoData.length > 0 ? (
                        productoData.map((producto, index) => {
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
                            <p>{searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {loadingMore && (
                        <div className={styles.loadingMore}>
                            <p>Cargando más productos...</p>
                        </div>
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
            {tipo === 'pedido' ?
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label={`Canasta (${productosCanasta.length})`}
                        onClick={() => setIsCanastaOpen(true)}
                        disabled={productosCanasta.length === 0}
                    />
                </div> : ''}
            {tipo === 'entrada' ?
                <div className={styles.buttonFooter}>
                    <Boton
                        className='btn-original'
                        label={`Canasta (${productosCanastaEntradas.length})`}
                        onClick={() => setIsCanastaMovimientosOpen(true)}
                        disabled={productosCanastaEntradas.length === 0}
                    />
                </div> : ''}
            {tipo === 'salida' ?
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
            />

            {/* Modal de editar*/}
            <EditarAgregar
                isOpen={isAgregarOpen}
                setIsOpen={setIsAgregarOpen}
                tipo='agregar'
                onProductCreated={handleProductCreated}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />

            {/* Modal de categorías de acopio*/}
            <CategoriasAlmacen
                isOpen={isCategoriasOpen}
                setIsOpen={setIsCategoriasOpen}
            />



            {/* Modal de categorias*/}
            <ViewModal isOpen={isOpenItem} setIsOpen={setOpenItem}>
                <HeaderModal
                    title={infoPersona?.producto}
                    onClose={() => setOpenItem(false)}
                />
                <div className={styles.modalContent}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                        <InputCantidad value={1} onChange={() => { }} min={1} max={100000} />
                        <Select
                            placeholder="Medida"
                            options={medidas}
                            value={selectedMedidas}
                            onChange={setSelectedMedidas}
                            icon="ruler"
                        />
                    </div>
                    <InputNormal
                        tipo="text"
                        value={''}
                        placeholder='Obervaciones'
                    />
                    <Boton
                        className='btn-original'
                        label='Agregar orden'
                        style={{ marginTop: 'auto' }}
                    />
                </div>
            </ViewModal>
            {/* Modal mostrar cantidad item*/}
            <ViewModal isOpen={isOpenCategoria} setIsOpen={setOpenCategoria}>
                <HeaderModal
                    title="Categorias"
                    onClose={() => setOpenCategoria(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para filtrar todos los productos que correspondan a esa categoria.</p>

                    {/* Opción para mostrar todos */}
                    <ItemLine
                        title='Todas las categorías'
                        icon='tag'
                        onClick={() => {
                            handleCategoriaFilter(null);
                            setOpenCategoria(false);
                        }}
                    />

                    {/* Opción para productos sin categoría */}
                    <ItemLine
                        title='Sin categoría'
                        icon='tag'
                        onClick={() => {
                            handleCategoriaFilter('');
                            setOpenCategoria(false);
                        }}
                    />

                    {/* Categorías dinámicas */}
                    {loadingCategorias ? (
                        <div className={styles.loadingMore}>
                            <p>Cargando categorías...</p>
                        </div>
                    ) : (
                        categorias.map((categoria) => (
                            <ItemLine
                                key={categoria.id}
                                title={categoria.name}
                                icon='tag'
                                onClick={() => {
                                    handleCategoriaFilter(categoria.id);
                                    setOpenCategoria(false);
                                }}
                            />
                        ))
                    )}
                </div>
            </ViewModal>
            {/* Modal de ordenamiento*/}
            <ViewModal isOpen={isOpenOrden} setIsOpen={setOpenOrden}>
                <HeaderModal
                    title="Ordenamiento"
                    onClose={() => setOpenOrden(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para ordenar los productos</p>
                    <ItemLine
                        title='Nombre A-Z'
                        icon='sort-a-z'
                        onClick={() => {
                            handleOrdenamiento('nombre_asc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Nombre Z-A'
                        icon='sort-z-a'
                        onClick={() => {
                            handleOrdenamiento('nombre_desc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Stock Menor-Mayor'
                        icon='up-arrow-alt'
                        onClick={() => {
                            handleOrdenamiento('stock_asc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Stock Mayor-Menor'
                        icon='down-arrow-alt'
                        onClick={() => {
                            handleOrdenamiento('stock_desc');
                            setOpenOrden(false);
                        }}
                    />
                </div>
            </ViewModal>
            {/* View de canasta de pedidos */}
            <CanastaPedidos
                isOpen={isCanastaOpen}
                setIsOpen={setIsCanastaOpen}
                productosCanasta={productosCanasta}
                setProductosCanasta={setProductosCanasta}
                onCerrarCanasta={() => {
                    setIsCanastaOpen(false);
                    mostrarNotificacion('success', 'Pedido confirmado correctamente');
                }}
            />

            {/* View de canasta de movimientos */}
            {tipo === 'entrada' && (
                <CanastaMovimientos
                    isOpen={isCanastaMovimientosOpen}
                    setIsOpen={setIsCanastaMovimientosOpen}
                    productosCanasta={productosCanastaEntradas}
                    setProductosCanasta={setProductosCanastaEntradas}
                    tipoMovimiento={tipo}
                    onProductosUpdated={handleProductosUpdated}
                    onCerrarCanasta={() => {
                        setIsCanastaMovimientosOpen(false);
                        mostrarNotificacion('success', 'Entradas confirmadas correctamente');
                    }}
                />
            )}
            {tipo === 'salida' && (
                <CanastaMovimientos
                    isOpen={isCanastaMovimientosOpen}
                    setIsOpen={setIsCanastaMovimientosOpen}
                    productosCanasta={productosCanastaSalidas}
                    setProductosCanasta={setProductosCanastaSalidas}
                    tipoMovimiento={tipo}
                    onProductosUpdated={handleProductosUpdated}
                    onCerrarCanasta={() => {
                        setIsCanastaMovimientosOpen(false);
                        mostrarNotificacion('success', 'Salidas confirmadas correctamente');
                    }}
                />
            )}
        </View>

    );
}
export default AlmacenGeneral;