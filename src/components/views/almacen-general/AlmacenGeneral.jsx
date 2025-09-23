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
import EditarAgregar from './EditarAgregar';
import CanastaPedidos from './CanastaPedidos';
import CanastaMovimientos from './CanastaMovimientos';
import CategoriasAlmacen from './CategoriasAlmacen';
import Notification from '../../common/Notification';
import productsAlmacenService from '../../../services/productsAlmacenService';
import categoryAlmacenService from '../../../services/categoryAlmacenService';
import pricesTypesService from '../../../services/pricesTypesService';
import sucursalesService from '../../../services/sucursalesService';
import { useSucursales } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import { useUser } from '../../../context/UserContext';


function AlmacenGeneral({ isOpen, setIsOpen, tipo = '', onPedidoActualizado = null, onEntregaConfirmada = null, pedidoIdEditando = null }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();

    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);

    // Estados para búsqueda local
    const [searchQuery, setSearchQuery] = useState('');

    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados para filtros locales
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
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

    // Estados para datos
    const [productos, setProductos] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    
    const [categoriasData, setCategoriasData] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(false);
    
    const [preciosData, setPreciosData] = useState([]);
    const [loadingPrecios, setLoadingPrecios] = useState(false);
    
    const [sucursalesData, setSucursalesData] = useState([]);
    const [loadingSucursales, setLoadingSucursales] = useState(false);

    // Mapear datos al formato esperado por los componentes
    const categorias = categoriasData.map(cat => ({
        value: cat.id,
        label: cat.name,
        id: cat.id,
        name: cat.name
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

    // Función para cargar productos
    const cargarProductos = async () => {
        console.log('cargando productos almacen general');
        setIsLoading(true);
        setShowRefreshIndicator(true);
        setIsRefreshing(true);
        setError(null);
        
        try {
            const response = await productsAlmacenService.getAll();
            if (response.success) {
                setProductos(response.data);
            } else {
                setError(response);
            }
        } catch (error) {
            setError(error);
        } finally {
            setIsLoading(false);
            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    };

    // Función para cargar categorías
    const cargarCategorias = async () => {
        setLoadingCategorias(true);
        try {
            const response = await categoryAlmacenService.getAll();
            if (response.success) {
                setCategoriasData(response.data);
            }
        } catch (error) {
            console.error('Error cargando categorías:', error);
        } finally {
            setLoadingCategorias(false);
        }
    };

    // Función para cargar precios
    const cargarPrecios = async () => {
        setLoadingPrecios(true);
        try {
            const response = await pricesTypesService.getAll();
            if (response.success) {
                setPreciosData(response.data);
            }
        } catch (error) {
            console.error('Error cargando precios:', error);
        } finally {
            setLoadingPrecios(false);
        }
    };

    // Función para cargar sucursales
    const cargarSucursales = async () => {
        setLoadingSucursales(true);
        try {
            const response = await sucursalesService.getByEmpresaId();
            if (response.success) {
                setSucursalesData(response.data);
            }
        } catch (error) {
            console.error('Error cargando sucursales:', error);
        } finally {
            setLoadingSucursales(false);
        }
    };

    // Cargar datos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            cargarProductos();
            cargarCategorias();
            cargarPrecios();
            cargarSucursales();
        }
    }, [isOpen]);

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




    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        await cargarProductos();
        await cargarCategorias();
        await cargarPrecios();
        await cargarSucursales();
    };

    // Funciones de filtrado locales
    const handleCategoriaFilter = (categoriaId) => {
        setCategoriaFiltro(categoriaId);
    };

    const handleOrdenamiento = (orden) => {
        setOrdenamiento(orden);
    };

    // Efecto para resetear búsqueda y filtros cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCategoriaFiltro(null);
            setOrdenamiento('nombre_asc');
            
            // Cargar canastas desde localStorage
            cargarCanastasDesdeLocalStorage();
        }
    }, [isOpen]);

    // Efecto separado para limpiar variables cuando se cierra el modal
    useEffect(() => {
        if (!isOpen) {
            // Cuando se cierra el modal, limpiar pedidoIdEntregando, precioIdEditando y precioIdEntregando del localStorage
            if (tipo === 'pedido') {
                localStorage.removeItem('pedidoIdEditando');
                localStorage.removeItem('precioIdEditando');
            }
            if (tipo === 'salida') {
                localStorage.removeItem('pedidoIdEntregando');
                localStorage.removeItem('precioIdEntregando');
            }
        }
    }, [isOpen, tipo]);

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
                        const productoActual = productos.find(p => p.id === productoCanasta.id);
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
                
                // Si es una entrega, actualizar el stock de los productos con los datos actuales
                if (localStorage.getItem('pedidoIdEntregando')) {
                    const productosConStockActualizado = productosSalidas.map(productoCanasta => {
                        const productoActual = productos.find(p => p.id === productoCanasta.id);
                        return {
                            ...productoCanasta,
                            stock: productoActual?.stock || 0
                        };
                    });
                    setProductosCanastaSalidas(productosConStockActualizado);
                } else {
                    setProductosCanastaSalidas(productosSalidas);
                }
            }
        } catch (error) {
            console.error('Error al cargar canastas desde localStorage:', error);
        }
    };
    // Filtrar y ordenar productos localmente
    const productosFiltrados = productos.filter(producto => {
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
        // Actualizar solo el stock de los productos que cambiaron, sin hacer nueva petición
        setProductos(prevProductos => 
            prevProductos.map(producto => {
                const productoActualizado = productosActualizados.find(p => p.id === producto.id);
                return productoActualizado ? productoActualizado : producto;
            })
        );
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
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        Almacen
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
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
                <div className={styles.content}>
                    {productosFiltrados.length > 0 ? (
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
                preciosTipos={preciosTipos}
                loadingPrecios={loadingPrecios}
            />

            {/* Modal de editar*/}
            <EditarAgregar
                isOpen={isAgregarOpen}
                setIsOpen={setIsAgregarOpen}
                tipo='agregar'
                onProductCreated={handleProductCreated}
                preciosTipos={preciosTipos}
                loadingPrecios={loadingPrecios}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />


            {/* Modal categorias*/}
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
                pedidoId={pedidoIdEditando}
                onPedidoActualizado={onPedidoActualizado}
                preciosTipos={preciosTipos}
                sucursales={sucursales}
                loadingPrecios={loadingPrecios}
                loadingSucursales={loadingSucursales}
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
                <CanastaMovimientos
                    isOpen={isCanastaMovimientosOpen}
                    setIsOpen={setIsCanastaMovimientosOpen}
                    productosCanasta={productosCanastaEntradas}
                    setProductosCanasta={setProductosCanastaEntradas}
                    tipoMovimiento={tipo}
                    onProductosUpdated={handleProductosUpdated}
                    preciosTipos={preciosTipos}
                    loadingPrecios={loadingPrecios}
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
                    esEntrega={!!localStorage.getItem('pedidoIdEntregando')}
                    onProductosUpdated={handleProductosUpdated}
                    preciosTipos={preciosTipos}
                    loadingPrecios={loadingPrecios}
                    onCerrarCanasta={(productosActualizados, precioId, movimientoId) => {
                        // Si es una entrega, NO cerrar la canasta aquí, solo llamar a la función de entrega
                        if (onEntregaConfirmada && localStorage.getItem('pedidoIdEntregando')) {
                            onEntregaConfirmada(productosActualizados, precioId, movimientoId);
                        } else {
                            // Para movimientos normales, cerrar la canasta y mostrar notificación
                            setIsCanastaMovimientosOpen(false);
                            mostrarNotificacion('success', 'Salidas confirmadas correctamente');
                        }
                    }}
                />
            )}

            {/* Modal de Categorías de Almacén */}
            <CategoriasAlmacen
                isOpen={isCategoriasAlmacenOpen}
                setIsOpen={setIsCategoriasAlmacenOpen}
            />
        </View>
    );
}
export default AlmacenGeneral;