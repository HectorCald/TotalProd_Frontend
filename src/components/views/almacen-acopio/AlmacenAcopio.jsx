import React, { useState, useEffect } from 'react';
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
import EditarAgregar from '../almacen-acopio/EditarAgregar';
import CategoriasAcopio from './CategoriasAcopio';
import MovimientoAcopio from './MovimientoAcopio';
import CanastaPedidos from './CanastaPedidos';
import InputCantidad from '../../common/InputCantidad';
import Select from '../../common/Select';
import InputNormal from '../../common/InputNormal';
import productsAcopioService from '../../../services/productsAcopioService';
import categoryAcopioService from '../../../services/categoryAcopioService';
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

function Registros({ isOpen, setIsOpen, tipo = '' }) {
    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
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
    const [filtroActivo, setFiltroActivo] = useState('todos');
    
    // Estados para filtros de categoría y ordenamiento
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    // Estados para canasta de pedidos
    const [productosCanasta, setProductosCanasta] = useState([]);
    const [isCanastaOpen, setIsCanastaOpen] = useState(false);

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
    }, []);
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

    // Función para cargar las categorías
    const fetchCategorias = async () => {
        try {
            setLoadingCategorias(true);
            const response = await categoryAcopioService.getAll();
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
    const fetchProducts = async (page = 1, reset = true, isSearch = false, categoriaOverride = null, ordenamientoOverride = null) => {
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

            console.log('fetchProducts - categoriaOverride:', categoriaOverride, 'categoriaToUse:', categoriaToUse, 'searchQuery:', searchQuery);

            const response = await productsAcopioService.getAll(page, 20, searchQuery, categoriaToUse, ordenamientoToUse);
            if (response.success && response.data) {
                if (reset) {
                    setProductoData(response.data);
                } else {
                    setProductoData(prev => [...prev, ...response.data]);
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

    useEffect(() => {
        if (isOpen) {
            // Asegurar que el modal esté cerrado al abrir el componente
            fetchCategorias();
            fetchProducts();
        }
    }, [isOpen]);

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
        fetchProducts(1, true, true); // isSearch = true
    };

    // Función para manejar filtro de categoría
    const handleCategoriaFilter = (categoriaId) => {
        setCategoriaFiltro(categoriaId);
        setCurrentPage(1);
        setHasMorePages(true);
        // Resetear búsqueda cuando se cambia categoría
        setSearchQuery('');
        fetchProducts(1, true, false, categoriaId);
    };

    // Función para manejar ordenamiento
    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
        setCurrentPage(1);
        setHasMorePages(true);
        // Resetear búsqueda cuando se cambia ordenamiento
        setSearchQuery('');
        fetchProducts(1, true, false, null, orden);
    };


    // Debounce para búsqueda en tiempo real
    useEffect(() => {
        if (isOpen) {
            const timeoutId = setTimeout(() => {
                if (searchQuery !== '') {
                    handleSearch(searchQuery);
                } else {
                    // Si está vacío, cargar todos los productos
                    setCurrentPage(1);
                    setHasMorePages(true);
                    fetchProducts(1, true);
                }
            }, 500); // 500ms de delay para evitar muchas peticiones
            return () => clearTimeout(timeoutId);
        }
    }, [searchQuery, isOpen]);

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

    // Función para manejar cuando se crea un movimiento
    const handleMovimientoCreated = (movimiento) => {
        
        // Actualizar la cantidad del producto en la lista
        if (movimiento && movimiento.product) {
            setProductoData(prev => prev.map(producto =>
                producto.id === movimiento.product.id 
                    ? { ...producto, quantity: movimiento.product.quantity }
                    : producto
            ));
            // Actualizar también el producto que se está viendo
            setInfoPersona(prev => prev ? { ...prev, quantity: movimiento.product.quantity } : prev);
        }
        // Cerrar el modal de movimiento
        setIsMovimientoOpen(false);
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

    const getCantidadEnCanasta = (productoId) => {
        const producto = productosCanasta.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    };
    // Función para obtener el nombre de la categoría seleccionada
    const getCategoriaNombre = () => {
        if (categoriaFiltro === null) return 'Todas';
        if (categoriaFiltro === '') return 'Sin categoría';
        if (!categoriaFiltro) return 'Categorias';
        const categoria = categorias.find(c => c.id === categoriaFiltro);
        return categoria ? categoria.name : 'Categorias';
    };

    // Función para obtener el nombre del ordenamiento
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
            active: filtroActivo === 'categorias' || categoriaFiltro !== null,
            onClick: () => setOpenCategoria(true)
        },
        {
            label: getOrdenamientoNombre(),
            active: filtroActivo === 'ordenamiento' || ordenamiento !== 'nombre_asc',
            onClick: () => setOpenOrden(true)
        },
    ];

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            {loading && <LoadingSpinner iconName='leaf' />}
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Almacen</h1>
                <p className={styles.subTitle}>Administra tu almacen de Materia Prima</p>
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
                            return (
                            <ItemView
                                    key={producto.id || index}
                                    title={producto.name || 'Sin nombre'}
                                    description={producto.description || 'Sin descripción'}
                                    icon="box"
                                arrow={tipo !== 'almacen' ? false : true}
                                    onClick={() => handleRegistro(producto, tipo)}
                                entrada={tipo === 'pesaje' ? true : false}
                                entradaData={[
                                    { name: "Prima", value: 0 },
                                    { name: "Bruta", value: 0 },
                                ]}
                                    badge={tipo === 'pedido' && cantidadEnCanasta > 0 ? cantidadEnCanasta : null}
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
                        title='Cantidad Menor-Mayor'
                        icon='up-arrow-alt'
                        onClick={() => {
                            handleOrdenamiento('cantidad_asc');
                            setOpenOrden(false);
                        }}
                    />
                    <ItemLine
                        title='Cantidad Mayor-Menor'
                        icon='down-arrow-alt'
                        onClick={() => {
                            handleOrdenamiento('cantidad_desc');
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
                
        </View>

    );
}
export default Registros;