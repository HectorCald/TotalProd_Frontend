import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/Canasta.module.css';
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
import useCanastaProductos from './hooks/useCanastaProductos';
import usePrecioCanasta from './hooks/usePrecioCanasta';
import { useLayout } from '../../../context/LayoutContext';
import OpcionDesplegable from '../../common/OpcionDesplegable';
import { isSoloVentas } from '../../../utils/empresaHelper';
import { useUser } from '../../../context/UserContext';

function CanastaMovimientosEntrada({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const { isLargeScreen } = useLayout();
    const { user } = useUser();
    const soloVentas = isSoloVentas(user);
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);

    // Estados para proveedores
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
    const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);
    const [restarIngredientes, setRestarIngredientes] = useState(() => {
        const saved = localStorage.getItem('restarIngredientes');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Asegurar que restarIngredientes sea false cuando es solo ventas
    useEffect(() => {
        if (soloVentas) {
            setRestarIngredientes(false);
        }
    }, [soloVentas]);
    const [registrarGasto, setRegistrarGasto] = useState(false);
    const [costo, setCosto] = useState('');
    const [conceptoGasto, setConceptoGasto] = useState('');
    const [concepto, setConcepto] = useState('');
    const [metodoPago, setMetodoPago] = useState('');

    // Notificaciones
    const [notification, setNotification] = useState({ isVisible: false, type: 'error', text: '' });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({ isVisible: true, type: tipo, text: texto });
        setTimeout(() => { setNotification(prev => ({ ...prev, isVisible: false })); }, 3000);
    };

    const syncProductoEntrada = useCallback(({
        productoCarrito,
        productoActualizado,
        modoAgrupacion,
        precioSeleccionado,
        obtenerPrecioPorTipo
    }) => {
        let productoModificado = {
            ...productoCarrito,
            precioManual: productoCarrito.precioManual === true
        };
        const stockActual = productoActualizado.stock ?? productoCarrito.stockOriginal ?? productoCarrito.stock;

        if (stockActual !== productoCarrito.stockOriginal) {
            productoModificado.stockOriginal = stockActual;
            if (modoAgrupacion === 'agrupado' && productoCarrito.grup) {
                productoModificado.stock = Math.floor(stockActual / (productoCarrito.grup || 1));
            } else {
                productoModificado.stock = stockActual;
            }

            if (productoCarrito.cantidad > productoModificado.stock) {
                mostrarNotificacion('warning', `El stock de ${productoCarrito.name} cambió. Cantidad ajustada a ${productoModificado.stock}`);
                productoModificado.cantidad = productoModificado.stock;
            }
        }

        if (productoActualizado.price_product && precioSeleccionado) {
            productoModificado.price_product = productoActualizado.price_product;
            if (productoCarrito.precioManual !== true) {
                const precioCalculado = obtenerPrecioPorTipo(
                    { ...productoCarrito, price_product: productoActualizado.price_product },
                    precioSeleccionado,
                    modoAgrupacion
                );
                productoModificado.precio = precioCalculado;
            }
        }

        return productoModificado;
    }, [mostrarNotificacion]);

    const {
        precioSeleccionado,
        modoAgrupacion,
        animarCantidad,
        registerCantidadInputRef,
        handleCambiarTipoPrecio: cambiarTipoPrecio,
        handleCambiarModoAgrupacion: cambiarModoAgrupacion,
        handleActualizarPrecioManual: actualizarPrecioManual,
        triggerAnimacionCantidad,
        prepararProductos,
        obtenerPrecioAutomatico
    } = useCanastaProductos({
        isOpen,
        productosCanasta,
        setProductosCanasta,
        preciosTipos,
        productosActualizados,
        localStorageKey: 'canastaEntradas',
        shouldPersistLocalStorage: true,
        shouldLoadLocalStorage: true,
        isCartMode,
        autoFocusCantidad: true,
        exposeGlobals: {
            precioGetterName: 'getPrecioSeleccionadoCanastaMovimientosEntrada',
            modoGetterName: 'getModoAgrupacionCanastaMovimientosEntrada'
        },
        onSyncProducto: syncProductoEntrada
    });

    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }
        if (animar) {
            triggerAnimacionCantidad(productoId);
        }
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? {
                    ...p,
                    cantidad: nuevaCantidad,
                    ...(p.cantidadTemp !== undefined ? { cantidadTemp: undefined } : {})
                }
                : p
        ));
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
        actualizarPrecioManual(productoId, nuevoPrecio);
    };

    const handlePrecioTempChange = (productoId, valor) => {
        setProductosCanasta(prev => prev.map(p =>
            p.id === productoId
                ? { ...p, precioTemp: valor }
                : p
        ));
    };

    const handlePrecioBlur = (producto, valor) => {
        if (valor === '') {
            const precioAutomatico = obtenerPrecioAutomatico(producto);
            setProductosCanasta(prev => prev.map(p =>
                p.id === producto.id
                    ? {
                        ...p,
                        precio: precioAutomatico,
                        precioManual: false,
                        precioTemp: undefined
                    }
                    : p
            ));
            return;
        }

        handleActualizarPrecio(producto.id, valor);
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

    const handleBack = () => {
        setIsOpen(false);
    };

    const headerRightContent = (
        <div className={styles.titleButtons}>
            <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                <BoxIcon name='trash' className={styles.iconTrash} />
            </button>
        </div>
    );

    // Validar (entradas no requieren campos adicionales)
    const validarMovimiento = () => {
        return true;
    };

    // Función para obtener la ubicación GPS (opcional)
    const obtenerUbicacion = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                resolve(null);
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitud: position.coords.latitude,
                        longitud: position.coords.longitude
                    });
                },
                (error) => {
                    console.warn('Error obteniendo ubicación:', error);
                    // Si no se puede obtener, simplemente retornar null
                    resolve(null);
                },
                {
                    enableHighAccuracy: true,
                    timeout: 5000,
                    maximumAge: 0
                }
            );
        });
    };

    const handleConfirmarMovimientos = async () => {
        setLoadingConfirmar(true);
        try {
            if (!validarMovimiento()) {
                setLoadingConfirmar(false);
                return;
            }

            // Obtener ubicación GPS (opcional) - si no se puede obtener, se guarda null
            const ubicacion = await obtenerUbicacion();

            const movimientoData = {
                type: 'entrada',
                observaciones: (observacionesGenerales || null),
                precio_id: precioSeleccionado,
                metodo_pago: registrarGasto ? (metodoPago || null) : null,
                cliente_id: null,
                proveedor_id: registrarGasto ? (proveedorSeleccionado || null) : null,
                restar_ingredientes: !soloVentas && restarIngredientes && tieneProductosConRecetas(),
                agrupado: modoAgrupacion === 'agrupado',
                concepto: concepto && concepto.trim() !== '' ? concepto.trim() : null,
                productos: prepararProductos(),
                ...(ubicacion ? { ubicacion: `${ubicacion.longitud},${ubicacion.latitud}` } : {})
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
                const conceptoFinal = (conceptoGasto && conceptoGasto.trim() !== '') ? conceptoGasto.trim() : `Entradas (${productosCanasta.length} items)`;
                
                // Obtener fecha local en formato YYYY-MM-DD (no usar toISOString que devuelve UTC)
                const hoy = new Date();
                const año = hoy.getFullYear();
                const mes = String(hoy.getMonth() + 1).padStart(2, '0');
                const dia = String(hoy.getDate()).padStart(2, '0');
                const fechaLocal = `${año}-${mes}-${dia}`;
                
                const gastoData = {
                    fecha_gasto: fechaLocal, // Fecha actual en formato YYYY-MM-DD (zona horaria local)
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
                setConcepto('');
                setConceptoGasto('');
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

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            <HeaderView
                title="Canasta de Entradas"
                onBack={handleBack}
                showBackButton={!isCartMode}
                rightContent={headerRightContent}
            />
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                {/* Selectores de precio y agrupación */}
                <div className={styles.controlesGenerales}>
                    <Select
                        value={precioSeleccionado}
                        onChange={cambiarTipoPrecio}
                        options={preciosTipos}
                        placeholder="Precio"
                        disabled={loadingPrecios}
                        icon='dollar'
                    />
                    {/* Selector de modalidad fuera de controles generales */}
                    {productosCanasta.some(producto => producto.grup) && (

                        <Select
                            value={modoAgrupacion}
                            onChange={cambiarModoAgrupacion}
                            options={[
                                { value: 'agrupado', label: 'Agrupado', icon: 'layer' },
                                { value: 'no_agrupado', label: 'Unidades', icon: 'cube' }
                            ]}
                            placeholder="Modalidad"
                            icon={modoAgrupacion === 'agrupado' ? 'layer' : (modoAgrupacion === 'no_agrupado' ? 'cube' : 'layer')}
                            iconOnly={!isLargeScreen}
                            dropdownDirection="right"
                        />

                    )}
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
                                            <input
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                value={producto.precioTemp !== undefined ? producto.precioTemp : (producto.precio ?? '')}
                                                onChange={(e) => {
                                                    handlePrecioTempChange(producto.id, e.target.value);
                                                }}
                                                onBlur={(e) => {
                                                    handlePrecioBlur(producto, e.target.value);
                                                }}
                                                className={styles.precioInput}
                                            />
                                        </div>

                                        <div className={styles.cantidadControl}>
                                            <button className={styles.btnCantidad} onClick={() => handleActualizarCantidad(producto.id, producto.cantidad - 1, true)} disabled={producto.cantidad <= 1}>
                                                <BoxIcon name='minus' className={styles.iconMinus} />
                                            </button>
                                            <motion.span animate={animarCantidad[producto.id] ? { scale: [1, 1.3, 0.9, 1] } : { scale: 1 }} transition={{ duration: 0.3 }} className={styles.cantidad}>
                                            <input
                                                ref={registerCantidadInputRef(producto.id)}
                                                type="number"
                                                min="1"
                                                value={producto.cantidadTemp !== undefined ? producto.cantidadTemp : producto.cantidad}
                                                onChange={(e) => {
                                                    const valor = e.target.value;
                                                    if (valor === '') {
                                                        setProductosCanasta(prev => prev.map(prod =>
                                                            prod.id === producto.id
                                                                ? { ...prod, cantidadTemp: '' }
                                                                : prod
                                                        ));
                                                        return;
                                                    }
                                                    const nuevaCantidad = parseInt(valor, 10);
                                                    if (Number.isNaN(nuevaCantidad)) {
                                                        return;
                                                    }
                                                    handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                }}
                                                onBlur={(e) => {
                                                    const valor = e.target.value;
                                                    if (valor === '') {
                                                        setProductosCanasta(prev => prev.map(prod =>
                                                            prod.id === producto.id
                                                                ? { ...prod, cantidadTemp: undefined }
                                                                : prod
                                                        ));
                                                        return;
                                                    }
                                                    const nuevaCantidad = parseInt(valor, 10);
                                                    if (Number.isNaN(nuevaCantidad) || nuevaCantidad < 1) {
                                                        handleActualizarCantidad(producto.id, 1, false);
                                                    }
                                                }}
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

                            <hr className={styles.hr} />
                            {/* Registrar gasto (opcional) */}
                            <div className={styles.content} style={{  padding: '15px' }}>
                                <Switch
                                    title="Registrar gasto"
                                    subtitle="Crear un gasto automáticamente con estas entradas"
                                    checked={registrarGasto}
                                    onChange={setRegistrarGasto}
                                    icon="money"
                                />
                            </div>
                            {/* Switch para restar ingredientes (solo si hay productos con recetas y no es solo ventas) */}
                            {!soloVentas && tieneProductosConRecetas() && (
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
                                        value={conceptoGasto}
                                        onChange={(e) => setConceptoGasto(e.target.value)}
                                    />
                                </>
                            )}
                            {/* Otras opciones */}
                            <OpcionDesplegable titulo="Otras opciones">
                                <InputNormal
                                    placeholder="Concepto del movimiento (opcional)"
                                    tipo="text"
                                    value={concepto}
                                    onChange={(e) => setConcepto(e.target.value)}
                                    icon='text'
                                />
                            </OpcionDesplegable>
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