import React, { useState, useEffect, useRef } from 'react';
import styles from './CanastaMovimientos.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import Switch from '../../common/Switch';
import Proveedores from '../proveedores/Proveedores';
import Notification from '../../common/Notification';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import gastosService from '../../../services/gastosService';
import InputNormal from '../../common/InputNormal';

function CanastaMovimientosEntrada({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [modoAgrupacion, setModoAgrupacion] = useState('agrupado');

    // Estados para proveedores
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
    const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);
    const [restarIngredientes, setRestarIngredientes] = useState(() => {
        const saved = localStorage.getItem('restarIngredientes');
        return saved !== null ? JSON.parse(saved) : true;
    });
    const [registrarGasto, setRegistrarGasto] = useState(false);
    const [costo, setCosto] = useState('');
    const [concepto, setConcepto] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    // Notificaciones
    const [notification, setNotification] = useState({ isVisible: false, type: 'error', text: '' });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({ isVisible: true, type: tipo, text: texto });
        setTimeout(() => { setNotification(prev => ({ ...prev, isVisible: false })); }, 3000);
    };

    // Referencias para el auto-focus en inputs de cantidad
    const cantidadInputRefs = useRef({});
    useEffect(() => {
        if (isCartMode && productosCanasta.length > 0) {
            const ultimoProducto = productosCanasta[productosCanasta.length - 1];
            const inputRef = cantidadInputRefs.current[ultimoProducto.id];
            if (inputRef) {
                setTimeout(() => {
                    inputRef.focus();
                    inputRef.select();
                }, 100);
            }
        }
    }, [productosCanasta.length, isCartMode]);

    // Inicializar precio seleccionado
    useEffect(() => {
        if (isOpen && preciosTipos.length > 0 && !precioSeleccionado) {
            setPrecioSeleccionado(preciosTipos[0].value);
        }
    }, [isOpen, preciosTipos, precioSeleccionado]);

    // Guardar canasta en localStorage (entradas)
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaEntradas', JSON.stringify(productosCanasta));
        }
    }, [productosCanasta]);

    // Cargar canasta desde localStorage al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const canastaGuardada = localStorage.getItem('canastaEntradas');
            if (canastaGuardada) {
                try {
                    const productosGuardados = JSON.parse(canastaGuardada);
                    setProductosCanasta(productosGuardados);
                } catch (error) {
                    console.error('Error al cargar canasta desde localStorage:', error);
                }
            }
        }
    }, [isOpen]);

    // Sincronizar stock y precios del carrito con productos actualizados
    useEffect(() => {
        if (productosActualizados.length > 0 && productosCanasta.length > 0) {
            setProductosCanasta(prevCanasta => {
                return prevCanasta.map(productoCarrito => {
                    const productoActualizado = productosActualizados.find(p => p.id === productoCarrito.id);
                    if (productoActualizado) {
                        let productoModificado = { ...productoCarrito };

                        // Si el stock cambió, actualizar el stock en el carrito
                        if (productoActualizado.stock !== productoCarrito.stockOriginal) {
                            // Actualizar el stockOriginal con el nuevo stock del backend
                            productoModificado.stockOriginal = productoActualizado.stock;

                            // Recalcular el stock mostrado según el modo de agrupación actual
                            if (modoAgrupacion === 'agrupado' && productoCarrito.grup) {
                                productoModificado.stock = Math.floor(productoActualizado.stock / productoCarrito.grup);
                            } else {
                                productoModificado.stock = productoActualizado.stock;
                            }

                            // Si la cantidad en el carrito excede el nuevo stock, ajustar
                            if (productoCarrito.cantidad > productoModificado.stock) {
                                mostrarNotificacion('warning', `El stock de ${productoCarrito.name} cambió. Cantidad ajustada a ${productoModificado.stock}`);
                                productoModificado.cantidad = productoModificado.stock;
                            }
                        }

                        // Actualizar precio según tipo seleccionado
                        if (productoActualizado.price_product && precioSeleccionado) {
                            const precioTipo = productoActualizado.price_product.find(pp => pp.prices_types?.id === precioSeleccionado);
                            if (precioTipo) {
                                const precioUnit = precioTipo.valor;
                                let precioFinal = (modoAgrupacion === 'agrupado' && productoCarrito.grup) ? (precioUnit * (productoCarrito.grup || 1)) : precioUnit;

                                // Aplicar redondeo si está en modo agrupado
                                if (modoAgrupacion === 'agrupado' && productoCarrito.grup) {
                                    precioFinal = redondearPrecio(precioFinal);
                                }

                                productoModificado.precio = precioFinal;
                                productoModificado.price_product = productoActualizado.price_product;
                            }
                        }
                        return productoModificado;
                    }
                    return productoCarrito;
                });
            });
        }
    }, [productosActualizados, precioSeleccionado, modoAgrupacion]);




    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }
        if (animar) {
            setAnimarCantidad(prev => ({ ...prev, [productoId]: true }));
            setTimeout(() => { setAnimarCantidad(prev => ({ ...prev, [productoId]: false })); }, 300);
        }
        setProductosCanasta(prev => prev.map(p => p.id === productoId ? { ...p, cantidad: nuevaCantidad } : p));
    };

    const handleEliminarProducto = (productoId) => {
        const elemento = document.querySelector(`[data-producto-id="${productoId}"]`);
        if (elemento) {
            elemento.classList.add(styles.eliminando);
            setTimeout(() => { setProductosCanasta(prev => prev.filter(p => p.id !== productoId)); }, 300);
        } else {
            setProductosCanasta(prev => prev.filter(p => p.id !== productoId));
        }
    };

    const handleActualizarPrecio = (productoId, nuevoPrecio) => {
        setProductosCanasta(prev => prev.map(p => p.id === productoId ? { ...p, precio: parseFloat(nuevoPrecio) || 0 } : p));
    };

    // Función para redondear precios según las reglas especificadas
    const redondearPrecio = (precio) => {
        const decimal = precio % 1;
        if (decimal >= 0.5) {
            return Math.ceil(precio);
        } else {
            return Math.floor(precio);
        }
    };

    const handleCambiarTipoPrecio = (nuevoTipoPrecio) => {
        setPrecioSeleccionado(nuevoTipoPrecio);
        setProductosCanasta(prev => prev.map(producto => {
            const precioProducto = producto.price_product?.find(pp => pp.prices_types?.id === nuevoTipoPrecio);
            const precioUnit = precioProducto?.valor || 0;
            let nuevoPrecio = (modoAgrupacion === 'agrupado' && producto.grup) ? (precioUnit * (producto.grup || 1)) : precioUnit;

            // Aplicar redondeo si está en modo agrupado
            if (modoAgrupacion === 'agrupado' && producto.grup) {
                nuevoPrecio = redondearPrecio(nuevoPrecio);
            }

            return { ...producto, precio: nuevoPrecio };
        }));
    };

    const handleCambiarModoAgrupacion = (nuevoModo) => {
        if (nuevoModo === modoAgrupacion) return;
        setModoAgrupacion(nuevoModo);
        setProductosCanasta(prev => prev.map(producto => {
            // Usar stockOriginal si existe, sino usar stock
            // Si no hay stockOriginal, establecerlo ahora
            const stockOriginalEnUnidades = producto.stockOriginal || producto.stock;
            if (!producto.stockOriginal) {
                producto.stockOriginal = producto.stock;
            }
            if (nuevoModo === 'agrupado' && producto.grup) {
                const stockEnGrupos = Math.floor(stockOriginalEnUnidades / producto.grup);
                const precioUnitario = (modoAgrupacion === 'agrupado' && producto.grup) ? ((producto.precio || 0) / (producto.grup || 1)) : (producto.precio || 0);
                let precioPorGrupo = precioUnitario * (producto.grup || 1);

                // Aplicar redondeo al precio por grupo
                precioPorGrupo = redondearPrecio(precioPorGrupo);

                return { ...producto, cantidad: producto.cantidad, precio: precioPorGrupo, stock: stockEnGrupos, stockOriginal: stockOriginalEnUnidades };
            } else {
                const precioUnitario = (modoAgrupacion === 'agrupado' && producto.grup) ? ((producto.precio || 0) / (producto.grup || 1)) : (producto.precio || 0);
                return { ...producto, cantidad: producto.cantidad, precio: precioUnitario, stock: stockOriginalEnUnidades, stockOriginal: stockOriginalEnUnidades };
            }
        }));
    };

    const handleProveedorSeleccionado = (proveedor) => {
        setProveedorSeleccionadoData(proveedor);
        setProveedorSeleccionado(proveedor.id);
        setIsProveedoresSeleccionOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaEntradas');
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    // Preparar productos respetando agrupación
    const prepararProductos = () => {
        return productosCanasta.map(producto => {
            let cantidadEnUnidades = producto.cantidad;
            let precioPorUnidad = producto.precio || 0;
            if (modoAgrupacion === 'agrupado' && producto.grup) {
                cantidadEnUnidades = producto.cantidad * producto.grup;
                precioPorUnidad = producto.precio / producto.grup;
            }
            return { id: producto.id, cantidad: cantidadEnUnidades, precio: precioPorUnidad };
        });
    };

    // Validar (entradas no requieren campos adicionales)
    const validarMovimiento = () => {
        return true;
    };

    const handleConfirmarMovimientos = async () => {
        setLoadingConfirmar(true);
        try {
            if (!validarMovimiento()) {
                setLoadingConfirmar(false);
                return;
            }

            const movimientoData = {
                type: 'entrada',
                observaciones: (observacionesGenerales || null),
                precio_id: precioSeleccionado,
                metodo_pago: registrarGasto ? (metodoPago || null) : null,
                cliente_id: null,
                proveedor_id: registrarGasto ? (proveedorSeleccionado || null) : null,
                restar_ingredientes: restarIngredientes && tieneProductosConRecetas(),
                agrupado: modoAgrupacion === 'agrupado',
                productos: prepararProductos()
            };

            // Si registrarGasto está activo, crear gasto primero
            let gastoId = null;
            if (registrarGasto) {
                if (!costo || parseFloat(costo) <= 0) {
                    mostrarNotificacion('error', 'El costo es obligatorio y debe ser mayor a 0');
                    setLoadingConfirmar(false);
                    return;
                }
                if (!metodoPago || metodoPago.trim() === '') {
                    mostrarNotificacion('error', 'El método de pago es obligatorio');
                    setLoadingConfirmar(false);
                    return;
                }
                const valorTotal = parseFloat(costo);
                const conceptoFinal = (concepto && concepto.trim() !== '') ? concepto.trim() : `Entradas (${productosCanasta.length} items)`;
                const gastoData = {
                    fecha_gasto: new Date().toISOString().split('T')[0],
                    valor: valorTotal,
                    concepto: conceptoFinal,
                    metodo_pago: metodoPago,
                    proveedor_id: proveedorSeleccionado || null
                };
                const gastoResponse = await gastosService.create(gastoData);
                if (!gastoResponse.success) {
                    mostrarNotificacion('error', `Error al crear gasto: ${gastoResponse.message}`);
                    setLoadingConfirmar(false);
                    return;
                }
                gastoId = gastoResponse.data.id;
                movimientoData.gasto_id = gastoId;
            }

            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);
            const movimientoId = (movimientoResponse && movimientoResponse.success) ? movimientoResponse.data?.id : null;

            if (movimientoId) {
                const productosEnUnidades = prepararProductos();
                const productosStockActualizados = productosEnUnidades.map(pu => {
                    const prodActual = (productosActualizados || []).find(p => p.id === pu.id);
                    const stockBase = prodActual ? (prodActual.stock || 0) : 0;
                    const nuevoStock = Math.max(0, stockBase + pu.cantidad);
                    return { id: pu.id, stock: nuevoStock };
                });
                if (onProductosUpdated) {
                    onProductosUpdated(productosStockActualizados);
                }

                setProductosCanasta([]);
                setObservacionesGenerales('');
                setProveedorSeleccionado('');
                localStorage.removeItem('canastaEntradas');
                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta(productosStockActualizados, precioSeleccionado, movimientoId);
                }
            } else {
                mostrarNotificacion('error', 'Error al crear el movimiento');
                // Si falló el movimiento y se creó gasto, intentar rollback
                try {
                    if (registrarGasto && gastoId) {
                        await gastosService.delete(gastoId);
                    }
                } catch (e) {
                    console.error('Error rollback gasto:', e);
                }
            }
        } catch (error) {
            mostrarNotificacion('error', error.message || 'Error al confirmar movimientos');
        } finally {
            setLoadingConfirmar(false);
        }
    };

    const tieneProductosConRecetas = () => {
        return productosCanasta.some(producto => producto.recetas && producto.recetas.length > 0);
    };

    // Exponer las funciones para que AlmacenGeneral pueda acceder al precio seleccionado y modo de agrupación
    useEffect(() => {
        // Guardar las referencias a las funciones en el window para acceso global
        window.getPrecioSeleccionadoCanastaMovimientosEntrada = () => precioSeleccionado;
        window.getModoAgrupacionCanastaMovimientosEntrada = () => modoAgrupacion;
    }, [precioSeleccionado, modoAgrupacion]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            {!isCartMode && <HeaderView onBack={() => setIsOpen(false)} />}
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                <h1 className={styles.title}>Canasta de Entradas
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>
                    </div>
                </h1>
                {/* Selectores de precio y agrupación */}
                <div className={styles.controlesGenerales}>
                    <Select
                        value={precioSeleccionado}
                        onChange={handleCambiarTipoPrecio}
                        options={preciosTipos}
                        placeholder="Seleccionar precio general"
                        disabled={loadingPrecios}
                        icon='dollar'
                    />
                    <Select
                        value={modoAgrupacion}
                        onChange={handleCambiarModoAgrupacion}
                        options={[
                            { value: 'agrupado', label: 'Agrupado' },
                            { value: 'no_agrupado', label: 'No agrupado' }
                        ]}
                        placeholder="Modo de agrupación"
                        icon='package'
                    />
                </div>

                {productosCanasta.length > 0 ? (
                    <>
                        <div className={styles.productosList}>
                            {productosCanasta.map((producto, index) => (
                                <div key={`${producto.id}-${index}`} className={styles.productoItem} data-producto-id={producto.id}>
                                    <div className={styles.productoInfo} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                        <div className={styles.productoInfoContent}>
                                            <BoxIcon name='box' className={styles.productoIcon} />
                                            <div>
                                                <h3 className={styles.productoNombre}>{producto.name}</h3>
                                                <p className={styles.stockInfo}>
                                                    {modoAgrupacion === 'agrupado' && producto.grup
                                                        ? `${producto.stock || 0} grupos`
                                                        : `${producto.stock || 0} unidades`
                                                    }
                                                </p>
                                            </div>
                                        </div>

                                        <button className={styles.btnEliminar} onClick={() => handleEliminarProducto(producto.id)}>
                                            <BoxIcon name='trash' className={styles.btnEliminarIcon} />
                                        </button>
                                    </div>

                                    <div className={styles.productoControles}>
                                        <div className={styles.precioControl}>
                                            <label className={styles.precioLabel}>Precio (Bs.)</label>
                                            <input type="number" step="0.01" min="0" value={producto.precio || 0} onChange={(e) => handleActualizarPrecio(producto.id, e.target.value)} className={styles.precioInput} />
                                        </div>

                                        <div className={styles.cantidadControl}>
                                            <button className={styles.btnCantidad} onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1, true)} disabled={producto.cantidad <= 1}>
                                                <BoxIcon name='minus' className={styles.iconMinus} />
                                            </button>
                                            <motion.span animate={animarCantidad[producto.id] ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }} transition={{ duration: 0.3 }} className={styles.cantidad}>
                                                <input
                                                    ref={(el) => { if (el) { cantidadInputRefs.current[producto.id] = el; } }}
                                                    type="number"
                                                    value={producto.cantidad}
                                                    min="1"
                                                    onChange={(e) => { const nuevaCantidad = parseInt(e.target.value) || 1; handleActualizarCantidad(producto.id, nuevaCantidad, false); }}
                                                    onBlur={(e) => { const nuevaCantidad = parseInt(e.target.value) || 1; if (nuevaCantidad < 1) { handleActualizarCantidad(producto.id, 1, false); } }}
                                                />
                                            </motion.span>
                                            <button className={styles.btnCantidad} onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}>
                                                <BoxIcon name='plus' className={styles.iconPlus} />
                                            </button>
                                        </div>
                                    </div>

                                    <div className={styles.productoTotal}>
                                        <span className={styles.totalLabel}>Subtotal:</span>
                                        <span className={styles.totalValue}>Bs. {((producto.precio || 0) * producto.cantidad).toFixed(2)}</span>
                                    </div>
                                </div>
                            ))}


                            {/* Registrar gasto (opcional) */}
                            <div className={styles.content} style={{ marginTop: 'auto', padding: '15px' }}>
                                <Switch
                                    title="Registrar gasto"
                                    subtitle="Crear un gasto automáticamente con estas entradas"
                                    checked={registrarGasto}
                                    onChange={setRegistrarGasto}
                                    icon="money"
                                />
                            </div>
                            {/* Switch para restar ingredientes (solo si hay productos con recetas) */}
                            {tieneProductosConRecetas() && (
                                <div className={styles.content} style={{ padding: '15px' }}>
                                    <Switch
                                        title="Restar ingredientes"
                                        subtitle="Restar automáticamente los ingredientes de las recetas"
                                        checked={restarIngredientes}
                                        onChange={(value) => {
                                            setRestarIngredientes(value);
                                            localStorage.setItem('restarIngredientes', JSON.stringify(value));
                                        }}
                                        icon="minus-circle"
                                    />
                                </div>
                            )}
                            {registrarGasto && (
                                <>
                                    <InputNormal
                                        placeholder="Costo (Bs.)"
                                        type="number"
                                        step="0.01" min="0"
                                        value={costo}
                                        onChange={(e) => setCosto(e.target.value)}
                                        className={styles.precioInput}
                                    />
                                    <Boton
                                        className='btn-gray'
                                        label={proveedorSeleccionadoData ? 'Proveedor: ' + proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
                                        onClick={() => setIsProveedoresSeleccionOpen(true)}
                                        style={{ width: '100%', justifyContent: 'flex-start' }}
                                    />
                                    <div className={styles.content} style={{ padding: '5px 15px' }}>
                                        <SelectorMetodoPago value={metodoPago} onChange={setMetodoPago} />
                                    </div>
                                    <InputNormal
                                        placeholder="Concepto del gasto"
                                        type="text"
                                        value={concepto}
                                        onChange={(e) => setConcepto(e.target.value)}
                                    />
                                </>
                            )}
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                <span className={styles.totalGeneralLabel}>Total:</span>
                                <span className={styles.totalGeneralValue}>Bs. {productosCanasta.reduce((total, producto) => {
                                    const valorProducto = (producto.precio || 0) * producto.cantidad;
                                    return total + valorProducto;
                                }, 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={'Confirmar Entrada'}
                                onClick={handleConfirmarMovimientos}
                                loading={loadingConfirmar}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear entradas</p>
                    </div>
                )}
            </div>

            {/* Modal de limpiar canasta */}
            <LimpiarCanasta
                isOpen={isLimpiarModalOpen}
                setIsOpen={setIsLimpiarModalOpen}
                onConfirmar={handleLimpiarCanasta}
            />

            {/* View de selección de proveedores */}
            <Proveedores
                isOpen={isProveedoresSeleccionOpen}
                setIsOpen={setIsProveedoresSeleccionOpen}
                modoSeleccion={true}
                onProveedorSeleccionado={handleProveedorSeleccionado}
            />

            <Notification isVisible={notification.isVisible} type={notification.type} text={notification.text} />
        </View>
    );
}

export default CanastaMovimientosEntrada;