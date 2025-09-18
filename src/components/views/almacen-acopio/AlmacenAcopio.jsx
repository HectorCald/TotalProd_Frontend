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
import EditarAgregar from '../almacen-acopio/EditarAgregar';
import CategoriasAcopio from './CategoriasAcopio';
import MovimientoAcopio from './MovimientoAcopio';
import CanastaPedidos from './CanastaPedidos';
import InputCantidad from '../../common/InputCantidad';
import Select from '../../common/Select';
import InputNormal from '../../common/InputNormal';
import { useProductosAcopio } from '../../../hooks/useData';
import { BoxIcon } from 'boxicons-react';
import RefreshIndicator from '../../common/RefreshIndicator';
import productsAcopioService from '../../../services/productsAcopioService';
import categoryAcopioService from '../../../services/categoryAcopioService';
import typeMeasureService from '../../../services/typeMeasureService';
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

function AlmacenAcopio({ isOpen, setIsOpen, tipo = '' }) {

    // Estados para los modales
    const [isOpenVerProducto, setIsOpenVerProducto] = useState(false);
    const [isMovimientoOpen, setIsMovimientoOpen] = useState(false);
    const [infoPersona, setInfoPersona] = useState(null);
    const [isAgregarOpen, setIsAgregarOpen] = useState(false);
    const [isCategoriasOpen, setIsCategoriasOpen] = useState(false);

    // Estados para paginación y búsqueda
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState('');
    const [isSearching, setIsSearching] = useState(false);

    // Debounce para búsqueda
    const [debouncedSearchQuery] = useDebounce(searchQuery, 500);

    // Estados para los datos
    const [categorias, setCategorias] = useState([]);
    const [loadingCategorias, setLoadingCategorias] = useState(false);
    const [tiposMedida, setTiposMedida] = useState([]);
    const [loadingTiposMedida, setLoadingTiposMedida] = useState(false);
    // Estados para RefreshIndicator
    const [showRefreshIndicator, setShowRefreshIndicator] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);

    // Estados para filtros (deshabilitados)
    const [categoriaFiltro, setCategoriaFiltro] = useState(null);
    const [tipoMedidaFiltro, setTipoMedidaFiltro] = useState(null);
    const [ordenamiento, setOrdenamiento] = useState('nombre_asc');

    // 🚀 Hook genérico con SWR - Solo se ejecuta cuando el modal está abierto
    const { productos, hasMorePages, error, isLoading, refetch } = useProductosAcopio(
        isOpen ? debouncedSearchQuery : '', 
        isOpen ? currentPage : 1,
        isOpen,
        categoriaFiltro,
        tipoMedidaFiltro,
        ordenamiento
    );

    // Mostrar indicador cuando se ejecuta fetcher (cualquier cambio en isLoading)
    useEffect(() => {
        if (isLoading && isOpen) {
            setShowRefreshIndicator(true);
            setIsRefreshing(true);
        } else if (!isLoading && showRefreshIndicator) {
            // Cuando termina de cargar, mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        }
    }, [isLoading, isOpen, showRefreshIndicator]);

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
    const [isOpenItem, setOpenItem] = useState(false);
    const [isOpenOrden, setOpenOrden] = useState(false);
    const [selectedMedidas, setSelectedMedidas] = useState('');

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

    // Función para cargar los tipos de medida
    const fetchTiposMedida = async () => {
        try {
            setLoadingTiposMedida(true);
            const response = await typeMeasureService.getAll();
            if (response.success && response.data) {
                const mappedTiposMedida = response.data.map(tipo => ({
                    value: tipo.id,
                    label: tipo.name,
                    id: tipo.id,
                    name: tipo.name,
                    code: tipo.code
                }));
                setTiposMedida(mappedTiposMedida);
            }
        } catch (error) {
            console.error('Error cargando tipos de medida:', error);
        } finally {
            setLoadingTiposMedida(false);
        }
    };

    // 🚀 SWR maneja automáticamente la carga de datos
    // No necesitamos fetchProducts manual

    // Función para manejar scroll infinito
    const handleScroll = (e) => {
        const { scrollTop, scrollHeight, clientHeight } = e.target;
        if (scrollHeight - scrollTop <= clientHeight + 100 && hasMorePages && !isLoading) {
            setCurrentPage(prev => prev + 1);
        }
    };

    // Función para manejar refresh con indicador
    const handleRefresh = async () => {
        setShowRefreshIndicator(true);
        setIsRefreshing(true);

        try {
            await refetch();

            // Mostrar "Actualizado" por 1 segundo
            setTimeout(() => {
                setIsRefreshing(false);
                setTimeout(() => {
                    setShowRefreshIndicator(false);
                }, 1000);
            }, 500);
        } catch (error) {
            setIsRefreshing(false);
            setShowRefreshIndicator(false);
        }
    };

    // Función para manejar búsqueda
    const handleSearch = (query) => {
        setSearchQuery(query);
        setCurrentPage(1);
    };

    // Funciones de filtrado - AHORA SÍ filtran productos
    const handleCategoriaFilter = (categoriaId) => {
        console.log('🔍 Filtro de categoría seleccionado:', categoriaId);
        setCategoriaFiltro(categoriaId); // Cambia el filtro y hace nueva petición
        setCurrentPage(1); // Resetear a primera página
    };

    const handleTipoMedidaFilter = (tipoMedidaId) => {
        console.log('🔍 Filtro de tipo de medida seleccionado:', tipoMedidaId);
        setTipoMedidaFiltro(tipoMedidaId); // Cambia el filtro y hace nueva petición
        setCurrentPage(1); // Resetear a primera página
    };

    const handleOrdenamiento = (orden) => {
        console.log('🔍 Ordenamiento seleccionado:', orden);
        setOrdenamiento(orden); // Cambia el ordenamiento y hace nueva petición
        setCurrentPage(1); // Resetear a primera página
    };

    // Efecto para resetear búsqueda cuando se abre
    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setCurrentPage(1);
        }
    }, [isOpen]);

    // Efecto para cargar categorías y tipos de medida cuando se abre
    useEffect(() => {
        if (isOpen) {
            fetchCategorias();
            fetchTiposMedida();
        }
    }, [isOpen]);

    // Efecto para manejar errores de SWR
    useEffect(() => {
        if (error) {
            console.error('Error obteniendo productos:', error);
        }
    }, [error]);

    // Función para manejar cuando se crea un nuevo producto
    const handleProductCreated = (newProduct) => {
        // Actualizar el cache localmente con el producto que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;

            return {
                ...currentData,
                data: [newProduct, ...currentData.data]
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor

        // Cerrar el modal
        setIsAgregarOpen(false);
        mostrarNotificacion('success', 'Producto agregado correctamente')
    };

    // Función para manejar cuando se elimina un producto
    const handleProductDeleted = (deletedId) => {
        // Actualizar el cache localmente removiendo el producto eliminado
        refetch((currentData) => {
            if (!currentData) return currentData;

            return {
                ...currentData,
                data: currentData.data.filter(producto => producto.id !== deletedId)
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor

        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto eliminado correctamente')
    };

    // Función para manejar cuando se actualiza un producto
    const handleProductUpdated = (updatedProduct) => {
        // Actualizar el cache localmente con el producto actualizado que devuelve el servidor
        refetch((currentData) => {
            if (!currentData) return currentData;

            return {
                ...currentData,
                data: currentData.data.map(producto =>
                    producto.id === updatedProduct.id ? updatedProduct : producto
                )
            };
        }, { revalidate: false }); // NO revalidar = NO petición al servidor

        // Actualizar también el producto que se está viendo
        setInfoPersona(updatedProduct);
        // Cerrar el modal de ver producto
        setIsOpenVerProducto(false);
        mostrarNotificacion('success', 'Producto actualizado correctamente')
    };

    // Función para manejar cuando se crea un movimiento
    const handleMovimientoCreated = (movimiento, tieneReceta = false) => {

        // Si es entrada con receta, recargar todos los productos para actualizar ingredientes
        if (tipo === 'entrada' && tieneReceta) {
            refetch(); // Recargar todos los productos
        } else {
            // Solo actualizar la cantidad del producto específico
            if (movimiento && movimiento.product) {
                refetch((currentData) => {
                    if (!currentData) return currentData;

                    return {
                        ...currentData,
                        data: currentData.data.map(producto =>
                            producto.id === movimiento.product.id
                                ? { ...producto, quantity: parseFloat(movimiento.product.quantity || 0).toFixed(2) }
                                : producto
                        )
                    };
                }, { revalidate: false }); // NO revalidar = NO petición al servidor

                // Actualizar también el producto que se está viendo
                setInfoPersona(prev => prev ? { ...prev, quantity: parseFloat(movimiento.product.quantity || 0).toFixed(2) } : prev);
            }
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

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.titleContainer}>
                    <h1 className={styles.title}>
                        Materia Prima
                        <button className={styles.refreshButton} onClick={handleRefresh}>
                            <BoxIcon name='refresh' />
                        </button>
                    </h1>
                    <RefreshIndicator
                        isVisible={showRefreshIndicator}
                        isLoading={isRefreshing}
                    />
                </div>
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
                <div
                    className={styles.content}
                    onScroll={handleScroll}
                    style={{
                        height: tipo === 'entrada' || tipo === 'salida'
                            ? ''
                            : 'calc(100vh - 310px)'
                    }}
                >

                    {isSearching ? (
                        <div className={styles.searchingData}>
                            <p>Buscando...</p>
                        </div>
                    ) : productos.length > 0 ? (
                        productos.map((producto, index) => {
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
                            <p>{searchQuery ? 'No se encontraron productos' : 'No hay productos registrados'}</p>
                        </div>
                    )}

                    {/* Indicador de carga para más elementos */}
                    {isLoading && (
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

            {/* Modal de tipos de medida - DESHABILITADO */}
            {/* <ViewModal isOpen={isOpenTipoMedida} setIsOpen={setOpenTipoMedida}>
                <HeaderModal
                    title="Tipos de Medida"
                    onClose={() => setOpenTipoMedida(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Filtrado deshabilitado</p>
                </div>
            </ViewModal> */}

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

            {/* Modal de tipos de medida*/}
            <ViewModal isOpen={isOpenTipoMedida} setIsOpen={setOpenTipoMedida}>
                <HeaderModal
                    title="Tipos de Medida"
                    onClose={() => setOpenTipoMedida(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Selecciona una opción para filtrar todos los productos que correspondan a ese tipo de medida.</p>

                    {/* Opción para mostrar todos */}
                    <ItemLine
                        title='Todas las medidas'
                        icon='ruler'
                        onClick={() => {
                            handleTipoMedidaFilter(null);
                            setOpenTipoMedida(false);
                        }}
                    />

                    {/* Tipos de medida dinámicos */}
                    {loadingTiposMedida ? (
                        <div className={styles.loadingMore}>
                            <p>Cargando tipos de medida...</p>
                        </div>
                    ) : (
                        tiposMedida.map((tipoMedida) => (
                            <ItemLine
                                key={tipoMedida.id}
                                title={tipoMedida.name}
                                icon='ruler'
                                onClick={() => {
                                    handleTipoMedidaFilter(tipoMedida.id);
                                    setOpenTipoMedida(false);
                                }}
                            />
                        ))
                    )}
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
export default AlmacenAcopio;