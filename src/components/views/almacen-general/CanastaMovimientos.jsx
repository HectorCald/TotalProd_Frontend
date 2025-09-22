import React, { useState, useEffect } from 'react';
import styles from './CanastaMovimientos.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import ItemLine from '../../common/ItemLine';
import { motion } from 'framer-motion';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import Switch from '../../common/Switch';
import Proveedores from '../proveedores/Proveedores';
import Clientes from '../clientes/Clientes';
import MensajeError from '../../common/MensajeError';

function CanastaMovimientos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, tipoMovimiento, onCerrarCanasta, onProductosUpdated, esEntrega = false, preciosTipos = [], loadingPrecios = false }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');

    // Estados para proveedores y clientes
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
    const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);
    const [errorMessage, setErrorMessage] = useState('');
    const [restarIngredientes, setRestarIngredientes] = useState(() => {
        const saved = localStorage.getItem('restarIngredientes');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Opciones de métodos de pago
    const metodosPago = [
        { value: 'qr', label: 'QR', icon: 'qr-scan' },
        { value: 'transferencia', label: 'Transferencia', icon: 'transfer' },
        { value: 'tarjeta', label: 'Tarjeta', icon: 'credit-card' },
        { value: 'efectivo', label: 'Efectivo', icon: 'money' },
        { value: 'credito', label: 'Crédito', icon: 'credit-card' }
    ];

    // Inicializar precio seleccionado cuando se abren los precios (solo si no hay uno seleccionado)
    useEffect(() => {
        if (isOpen && preciosTipos.length > 0 && !precioSeleccionado) {
            // Verificar si hay un precio específico guardado para entregas
            if (esEntrega) {
                const precioIdEntregando = localStorage.getItem('precioIdEntregando');
                if (precioIdEntregando && preciosTipos.find(p => p.value === precioIdEntregando)) {
                    setPrecioSeleccionado(precioIdEntregando);
                } else if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            } else {
                // Para otros casos, seleccionar el primer precio por defecto
                if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            }
        }
    }, [isOpen, preciosTipos, esEntrega, precioSeleccionado]);


    // Guardar en localStorage cuando cambie la canasta (separado por tipo)
    useEffect(() => {
        const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
        if (productosCanasta.length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(productosCanasta));
        }
        // NO remover del localStorage aquí para evitar que se borre al recargar la página
        // La limpieza se maneja en las funciones específicas
    }, [productosCanasta, tipoMovimiento, esEntrega]);

    // Cargar canasta desde localStorage al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
            const canastaGuardada = localStorage.getItem(localStorageKey);
            if (canastaGuardada) {
                try {
                    const productosGuardados = JSON.parse(canastaGuardada);
                    
                    // Si es una entrega (salida), actualizar el stock de los productos
                    if (tipoMovimiento === 'salida' && esEntrega) {
                        // Los productos ya vienen con el stock actualizado desde VerPedido.jsx
                        setProductosCanasta(productosGuardados);
                    } else {
                        setProductosCanasta(productosGuardados);
                    }
                } catch (error) {
                    console.error('Error al cargar canasta desde localStorage:', error);
                }
            }
        }
    }, [isOpen, tipoMovimiento, esEntrega]);



    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }

        // Obtener el producto actual para validar el stock
        const productoActual = productosCanasta.find(p => p.id === productoId);
        if (!productoActual) return;

        // Validar que no exceda el stock disponible
        if (nuevaCantidad > productoActual.stock) {
            console.warn(`No se puede exceder el stock disponible: ${productoActual.stock}`);
            return; // No actualizar si excede el stock
        }

        // Si debe animar, activar la animación
        if (animar) {
            setAnimarCantidad(prev => ({
                ...prev,
                [productoId]: true
            }));
            
            // Desactivar la animación después de 300ms
            setTimeout(() => {
                setAnimarCantidad(prev => ({
                    ...prev,
                    [productoId]: false
                }));
            }, 300);
        }

        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, cantidad: nuevaCantidad }
                : p
        ));
    };

    const handleEliminarProducto = (productoId) => {
        // Agregar clase de animación antes de eliminar
        const elemento = document.querySelector(`[data-producto-id="${productoId}"]`);
        if (elemento) {
            elemento.classList.add(styles.eliminando);
            setTimeout(() => {
                setProductosCanasta(prev => prev.filter(p => p.id !== productoId));
            }, 300);
        } else {
            setProductosCanasta(prev => prev.filter(p => p.id !== productoId));
        }
    };

    const handleActualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, precio: parseFloat(nuevoPrecio) || 0 }
                : p
        ));
    };

    const handleCambiarTipoPrecio = (nuevoTipoPrecio) => {
        setPrecioSeleccionado(nuevoTipoPrecio);
        
        // Actualizar precios de todos los productos
        setProductosCanasta(prev => prev.map(producto => {
            const precioProducto = producto.price_product?.find(pp => pp.prices_types?.id === nuevoTipoPrecio);
            const nuevoPrecio = precioProducto?.valor || 0;
            
            return {
                ...producto,
                precio: nuevoPrecio
            };
        }));
    };

    // Función para manejar cuando se selecciona un proveedor
    const handleProveedorSeleccionado = (proveedor) => {
        setProveedorSeleccionadoData(proveedor);
        setProveedorSeleccionado(proveedor.id);
        setIsProveedoresSeleccionOpen(false);
    };

    // Función para manejar cuando se selecciona un cliente
    const handleClienteSeleccionado = (cliente) => {
        setClienteSeleccionadoData(cliente);
        setClienteSeleccionado(cliente.id);
        setIsClientesSeleccionOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        // Limpiar también el localStorage
        const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
        localStorage.removeItem(localStorageKey);
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    const handleConfirmarMovimientos = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar método de pago para salidas
            if (tipoMovimiento === 'salida' && !metodoPagoSeleccionado) {
                setErrorMessage('El método de pago es obligatorio');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
                setLoadingConfirmar(false);
                return;
            }

            // Preparar observaciones (agregar info del pedido si es entrega)
            let observacionesFinales = observacionesGenerales || '';
            if (esEntrega && localStorage.getItem('pedidoIdEntregando')) {
                const pedidoId = localStorage.getItem('pedidoIdEntregando');
                const infoPedido = `Entrega automática del pedido #${pedidoId.slice(-8)}`;
                observacionesFinales = observacionesFinales 
                    ? `${infoPedido} - ${observacionesFinales}`
                    : infoPedido;
            }

            // Preparar datos para enviar al backend
            const movimientoData = {
                type: tipoMovimiento,
                observaciones: observacionesFinales || null,
                precio_id: precioSeleccionado,
                metodo_pago: tipoMovimiento === 'salida' ? metodoPagoSeleccionado : null,
                cliente_id: tipoMovimiento === 'salida' ? (clienteSeleccionado || null) : null,
                proveedor_id: tipoMovimiento === 'entrada' ? (proveedorSeleccionado || null) : null,
                restar_ingredientes: tipoMovimiento === 'entrada' && restarIngredientes && tieneProductosConRecetas(),
                productos: productosCanasta.map(producto => ({
                    id: producto.id,
                    cantidad: producto.cantidad,
                    precio: producto.precio || 0
                }))
            };

            // Enviar al backend
            const response = await movimientosAlmacenService.create(movimientoData);

            if (response.success) {
                // Actualizar productos con los datos del backend (stock actualizado)
                if (response.data?.productos && onProductosUpdated) {
                    const productosActualizados = response.data.productos.map(productoMovimiento => ({
                        ...productoMovimiento.producto,
                        stock: productoMovimiento.producto.stock // Stock actualizado del backend
                    }));
                    onProductosUpdated(productosActualizados);
                }

                if (esEntrega) {
                    // Para entregas, NO cerrar la canasta aquí, solo pasar el movimiento_id
                    // La canasta se cerrará cuando se complete la entrega del pedido
                    if (onCerrarCanasta) {
                        onCerrarCanasta(productosCanasta, precioSeleccionado, response.data.id);
                    }
                } else {
                    // Para movimientos normales, cerrar canasta y mostrar notificación
                    setProductosCanasta([]);
                    setObservacionesGenerales('');
                    setProveedorSeleccionado('');
                    setClienteSeleccionado('');
                    setMetodoPagoSeleccionado('');
                    
                    // Limpiar localStorage
                    const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
                    localStorage.removeItem(localStorageKey);
                    
                    // Cerrar modal de confirmación
                    setIsConfirmarModalOpen(false);
                    
                    // Cerrar canasta y mostrar notificación
                    setIsOpen(false);
                    if (onCerrarCanasta) {
                        onCerrarCanasta(productosCanasta, precioSeleccionado);
                    }
                }
            } else {
                console.error('Error al crear movimiento:', response.message);
                // Aquí podrías mostrar una notificación de error
            }

        } catch (error) {
            console.error('Error al confirmar movimientos:', error);
            // Aquí podrías mostrar una notificación de error
        } finally {
            setLoadingConfirmar(false);
        }
    };

    const getTotalProductos = () => {
        return productosCanasta.reduce((total, producto) => total + producto.cantidad, 0);
    };

    const getTotalValor = () => {
        return productosCanasta.reduce((total, producto) => {
            const valorProducto = (producto.precio || 0) * producto.cantidad;
            return total + valorProducto;
        }, 0);
    };
    
    // Verificar si algún producto en la canasta tiene recetas
    const tieneProductosConRecetas = () => {
        return productosCanasta.some(producto => 
            producto.recetas && producto.recetas.length > 0
        );
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>Canasta de {tipoMovimiento === 'entrada' ? 'Entradas' : 'Salidas'}
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>
                    </div>
                </h1>

                {/* Selector de precio general */}
                {productosCanasta.length > 0 && (
                    <div className={styles.precioGeneral}>
                        <Select
                            value={precioSeleccionado}
                            onChange={handleCambiarTipoPrecio}
                            options={preciosTipos}
                            placeholder="Seleccionar precio general"
                            disabled={loadingPrecios}
                            icon='dollar'
                        />
                    </div>
                )}

                {productosCanasta.length > 0 ? (
                    <>
                        <div className={styles.productosList}>
                            {productosCanasta.map((producto, index) => (
                                <div
                                    key={`${producto.id}-${index}`}
                                    className={styles.productoItem}
                                    data-producto-id={producto.id}
                                >
                                    <div className={styles.productoInfo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div className={styles.productoInfoContent}>
                                            <BoxIcon name='box' className={styles.productoIcon} />
                                            <div>
                                                <h3 className={styles.productoNombre}>{producto.name}</h3>
                                                <p className={styles.stockInfo}>
                                                    Stock: {producto.stock || 0} {producto.type_measure?.code || ''}
                                                </p>
                                            </div>
                                        </div>

                                        <button
                                            className={styles.btnEliminar}
                                            onClick={() => handleEliminarProducto(producto.id)}
                                        >
                                            <BoxIcon name='trash' className={styles.btnEliminarIcon} />
                                        </button>
                                    </div>

                                    <div className={styles.productoControles}>
                                        <div className={styles.precioControl}>
                                            <label className={styles.precioLabel}>Precio (Bs.)</label>
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={producto.precio || 0}
                                                onChange={(e) => handleActualizarPrecio(producto.id, e.target.value)}
                                                className={styles.precioInput}
                                            />
                                        </div>
                                        
                                        <div className={styles.cantidadControl}>
                                             <button
                                                 className={styles.btnCantidad}
                                                 onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1, true)}
                                                 disabled={producto.cantidad <= 1}
                                             >
                                                 <BoxIcon name='minus' className={styles.iconMinus} />
                                             </button>
                                            <motion.span
                                                animate={animarCantidad[producto.id] ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }}
                                                transition={{ duration: 0.3 }}
                                                className={styles.cantidad}
                                            >
                                                <input
                                                    type="number"
                                                    value={producto.cantidad}
                                                    min="1"
                                                    max={producto.stock}
                                                    onChange={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        if (nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        } else if (nuevaCantidad > producto.stock) {
                                                            // Si excede el stock, ajustar al stock máximo
                                                            handleActualizarCantidad(producto.id, producto.stock, false);
                                                        }
                                                    }}
                                                />
                                            </motion.span>
                                             <button
                                                 className={styles.btnCantidad}
                                                 onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}
                                                 disabled={producto.cantidad >= producto.stock}
                                             >
                                                 <BoxIcon name='plus' className={styles.iconPlus} />
                                             </button>
                                        </div>
                                    </div>

                                    <div className={styles.productoTotal}>
                                        <span className={styles.totalLabel}>Subtotal:</span>
                                        <span className={styles.totalValue}>
                                            Bs. {((producto.precio || 0) * producto.cantidad).toFixed(2)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                <span className={styles.totalGeneralLabel}>Total:</span>
                                <span className={styles.totalGeneralValue}>Bs. {getTotalValor().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={`Resumen de ${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'}`}
                                onClick={() => setIsConfirmarModalOpen(true)}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear {tipoMovimiento === 'entrada' ? 'entradas' : 'salidas'}</p>
                    </div>
                )}
            </div>

            {/* Modal de limpiar canasta */}
            <ViewModal isOpen={isLimpiarModalOpen} setIsOpen={setIsLimpiarModalOpen}>
                <HeaderModal
                    title="Limpiar Canasta"
                    onClose={() => setIsLimpiarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas limpiar toda la canasta? Esta acción no se puede deshacer.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-red'
                            label='Si, limpiar'
                            onClick={handleLimpiarCanasta}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            onClick={() => setIsLimpiarModalOpen(false)}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de confirmar movimientos */}
            <ViewModal isOpen={isConfirmarModalOpen} setIsOpen={setIsConfirmarModalOpen}>
                <HeaderModal
                    title={`Resumen de ${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'}`}
                    onClose={() => setIsConfirmarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <MensajeError mensaje={errorMessage} />
                    <p className={styles.subTitle}>Productos a {tipoMovimiento === 'entrada' ? 'ingresar' : 'retirar'}:</p>
                    <div className={styles.content}>
                        {productosCanasta.map((producto, index) => (
                            <ItemLine
                                key={`resumen-${producto.id}-${index}`}
                                icon='box'
                                title={`${producto.name} (${producto.cantidad} ${producto.type_measure?.code ||'u'}) - Bs. ${((producto.precio || 0) * producto.cantidad).toFixed(2)}`}
                                onClick={() => handleEliminarProducto(producto.id)}
                            />
                        ))}
                    </div>
                    
                    <div className={styles.totalResumen}>
                        <div className={styles.totalResumenContent}>
                            <span className={styles.totalResumenLabel}>Total:</span>
                            <span className={styles.totalResumenValue}>Bs. {getTotalValor().toFixed(2)}</span>
                        </div>
                    </div>

                    {/* Selector de proveedor para entradas */}
                    {tipoMovimiento === 'entrada' && (
                        <div className={styles.content} style={{ padding: '5px 15px' }}>
                            <Boton
                                className='btn-transparent'
                                label={proveedorSeleccionadoData ? proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
                                onClick={() => setIsProveedoresSeleccionOpen(true)}
                                style={{ width: '100%', justifyContent: 'flex-start' }}
                            />
                        </div>
                    )}

                    {/* Selector de cliente para salidas (oculto en entregas) */}
                    {tipoMovimiento === 'salida' && !esEntrega && (
                        <div className={styles.content} style={{ padding: '5px 15px' }}>
                            <Boton
                                className='btn-transparent'
                                label={clienteSeleccionadoData ? clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
                                onClick={() => setIsClientesSeleccionOpen(true)}
                                style={{ width: '100%', justifyContent: 'flex-start' }}
                            />
                        </div>
                    )}


                    {/* Selector de método de pago para salidas */}
                    {tipoMovimiento === 'salida' && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Select
                                value={metodoPagoSeleccionado}
                                onChange={setMetodoPagoSeleccionado}
                                options={metodosPago}
                                placeholder='Método de pago (obligatorio)'
                                icon='credit-card'
                            />
                        </div>
                    )}

                    {/* Switch para restar ingredientes (solo para entradas y si hay productos con recetas) */}
                    {tipoMovimiento === 'entrada' && tieneProductosConRecetas() && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Switch
                                title="Restar ingredientes"
                                subtitle="Restar automáticamente los ingredientes de las recetas del stock"
                                checked={restarIngredientes}
                                onChange={(value) => {
                                    setRestarIngredientes(value);
                                    localStorage.setItem('restarIngredientes', JSON.stringify(value));
                                }}
                                icon="minus-circle"
                            />
                        </div>
                    )}

                    <div className={styles.observacionesGenerales}>
                        <InputNormal
                            tipo="text"
                            value={observacionesGenerales}
                            placeholder="Observaciones generales"
                            onChange={(e) => setObservacionesGenerales(e.target.value)}
                        />
                    </div>
                    
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-original'
                            label={esEntrega ? 'Entregar Pedido' : `Confirmar ${tipoMovimiento === 'Entrada' ? 'Entradas' : 'Salida'}`}
                            onClick={handleConfirmarMovimientos}
                            loading={loadingConfirmar}
                        />
                    </div>
                </div>
            </ViewModal>


            {/* View de selección de proveedores */}
            <Proveedores
                isOpen={isProveedoresSeleccionOpen}
                setIsOpen={setIsProveedoresSeleccionOpen}
                modoSeleccion={true}
                onProveedorSeleccionado={handleProveedorSeleccionado}
            />

            {/* View de selección de clientes */}
            <Clientes
                isOpen={isClientesSeleccionOpen}
                setIsOpen={setIsClientesSeleccionOpen}
                modoSeleccion={true}
                onClienteSeleccionado={handleClienteSeleccionado}
            />
        </View>
    );
}

export default CanastaMovimientos;
