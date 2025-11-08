import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import Clientes from '../clientes/Clientes';
import Notification from '../../common/Notification';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import InputDate from '../../common/InputDate';
import cotizacionesService from '../../../services/cotizacionesService';
import useCanastaProductos from '../almacen-general/hooks/useCanastaProductos';

function CanastaCotizacion({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    // Estados para clientes (para cotizaciones)
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);

    // Estados para método de pago y fecha de vencimiento
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
    const [fechaVencimiento, setFechaVencimiento] = useState('');

    // Estado para notificaciones
    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'error',
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

    const resolvePrecioInicial = useCallback((tipos) => {
        return tipos && tipos.length > 0 ? tipos[0].value : null;
    }, []);

    const syncProductoCotizacion = useCallback(({
        productoCarrito,
        productoActualizado,
        modoAgrupacion,
        precioSeleccionado,
        obtenerPrecioPorTipo
    }) => {
        const productoModificado = { ...productoCarrito };

        if (productoActualizado) {
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
                const precioCalculado = obtenerPrecioPorTipo(
                    { ...productoCarrito, price_product: productoActualizado.price_product },
                    precioSeleccionado,
                    modoAgrupacion
                );
                productoModificado.precio = precioCalculado;
                productoModificado.price_product = productoActualizado.price_product;
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
        prepararProductos
    } = useCanastaProductos({
        isOpen,
        productosCanasta,
        setProductosCanasta,
        preciosTipos,
        productosActualizados,
        localStorageKey: 'canastaCotizaciones',
        shouldPersistLocalStorage: true,
        shouldLoadLocalStorage: true,
        resolveInitialPrecioId: resolvePrecioInicial,
        exposeGlobals: {
            precioGetterName: 'getPrecioSeleccionadoCanastaCotizaciones',
            modoGetterName: 'getModoAgrupacionCanastaCotizaciones'
        },
        isCartMode,
        onSyncProducto: syncProductoCotizacion,
        onAfterModoAgrupacionChange: ({ producto, cantidadNueva }) => {
            if (producto?.name && cantidadNueva !== undefined) {
                mostrarNotificacion('warning', `La cantidad de ${producto.name} se ajustó al máximo disponible: ${cantidadNueva} grupos`);
            }
        }
    });

    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }

        // Obtener el producto actual para validar el stock
        const productoActual = productosCanasta.find(p => p.id === productoId);
        if (!productoActual) return;

        // Para cotizaciones, no validar stock (pueden cotizar sin stock)
        // const stockParaValidar = (modoAgrupacion === 'agrupado' && productoActual.grup)
        //     ? productoActual.stock
        //     : (productoActual.stockOriginal || productoActual.stock);
        // if (nuevaCantidad > stockParaValidar) {
        //     console.warn(`No se puede exceder el stock disponible: ${stockParaValidar}`);
        //     mostrarNotificacion('error', 'No se puede exceder el stock disponible');
        //     return; // No actualizar si excede el stock
        // }

        // Si debe animar, activar la animación
        if (animar) {
            triggerAnimacionCantidad(productoId);
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
        actualizarPrecioManual(productoId, nuevoPrecio);
    };

    const handleCambiarTipoPrecio = (nuevoTipoPrecio) => {
        cambiarTipoPrecio(nuevoTipoPrecio);
    };

    const handleCambiarModoAgrupacion = (nuevoModo) => {
        cambiarModoAgrupacion(nuevoModo);
    };

    const handleClienteSeleccionado = (cliente) => {
        setClienteSeleccionadoData(cliente);
        setClienteSeleccionado(cliente.id);
        setIsClientesSeleccionOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        // Limpiar también el localStorage
        localStorage.removeItem('canastaCotizaciones');
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
    // Validaciones para cotizaciones
    const validarCotizacion = () => {
        // Para cotizaciones, el método de pago y fecha de vencimiento son opcionales
        // Solo validar cliente si se selecciona crédito
        if (metodoPagoSeleccionado === 'credito' && !clienteSeleccionado) {
            mostrarNotificacion('error', 'El cliente es obligatorio para cotizaciones a crédito');
            return false;
        }

        return true;
    };

    const handleConfirmar = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar cotización
            if (!validarCotizacion()) {
                setLoadingConfirmar(false);
                return;
            }

            // Preparar datos para la cotización
            const cotizacionData = {
                observaciones: observacionesGenerales || null,
                metodo_pago: metodoPagoSeleccionado || null,
                cliente_id: clienteSeleccionado || null,
                fecha_vencimiento: fechaVencimiento || null,
                agrupado: modoAgrupacion === 'agrupado',
                precio_id: precioSeleccionado || null,
                productos: prepararProductos()
            };

            // Crear la cotización
            const result = await cotizacionesService.create(cotizacionData);

            if (!result.success) {
                mostrarNotificacion('error', result.message || 'Error al crear la cotización');
                setLoadingConfirmar(false);
                return;
            }

            // Limpiar canasta y cerrar
            setProductosCanasta([]);
            setObservacionesGenerales('');
            setClienteSeleccionado('');
            setMetodoPagoSeleccionado('');
            setFechaVencimiento('');
            localStorage.removeItem('canastaCotizaciones');

            // Solo cerrar la canasta en móvil, no en PC (modo carrito)
            if (!isCartMode) {
                setIsOpen(false);
            }

            if (onCerrarCanasta) {
                onCerrarCanasta(result.data);
            }

        } catch (error) {
            console.error('Error al confirmar:', error);
            mostrarNotificacion('error', error.message || 'Error al confirmar');
        } finally {
            setLoadingConfirmar(false);
        }
    };
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            <HeaderView
                title="Canasta de Cotizaciones"
                onBack={handleBack}
                showBackButton={!isCartMode}
                rightContent={headerRightContent}
            />
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                {/* Selectores de precio y agrupación */}
                <div className={styles.controlesGenerales}>
                    <Select
                        value={precioSeleccionado}
                        onChange={handleCambiarTipoPrecio}
                        options={preciosTipos}
                        placeholder="Precio"
                        disabled={loadingPrecios}
                        icon='dollar'
                    />

                    {productosCanasta.some(producto => producto.grup) && (
                        <Select
                            value={modoAgrupacion}
                            onChange={handleCambiarModoAgrupacion}
                            options={[
                                { value: 'agrupado', label: 'Agrupado' },
                                { value: 'no_agrupado', label: 'Unidades' }
                            ]}
                            placeholder="Modalidad"
                            icon='package'
                        />
                    )}
                </div>

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
                                                    {modoAgrupacion === 'agrupado' && producto.grup
                                                        ? `${producto.stock || 0} grupos`
                                                        : `${producto.stock || 0} unidades`
                                                    }
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
                                                    ref={registerCantidadInputRef(producto.id)}
                                                    type="number"
                                                    value={producto.cantidad}
                                                    min="1"
                                                    onChange={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        if (nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        }
                                                    }}
                                                />
                                            </motion.span>
                                            <button
                                                className={styles.btnCantidad}
                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}
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
                            {/* Controles específicos para cotizaciones */}
                            <>
                                {/* Selector de cliente para cotizaciones (opcional) */}

                                <Boton
                                    className='btn-gray'
                                    label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : (metodoPagoSeleccionado === 'credito' ? 'Seleccionar Cliente (obligatorio)' : 'Seleccionar Cliente (opcional)')}
                                    onClick={() => setIsClientesSeleccionOpen(true)}
                                    style={{
                                        marginTop: 'auto',
                                        width: '100%',
                                        justifyContent: 'flex-start',
                                        ...(metodoPagoSeleccionado === 'credito' && !clienteSeleccionadoData ? { borderColor: '#e74c3c', color: '#e74c3c' } : {})
                                    }}
                                />

                                {/* Selector de método de pago para cotizaciones (opcional) */}
                                <SelectorMetodoPago
                                    value={metodoPagoSeleccionado}
                                    onChange={setMetodoPagoSeleccionado}
                                    placeholder="Método de pago (opcional)"
                                />

                                {/* Fecha de vencimiento de la cotización (opcional) */}
                                <p className={styles.subTitle}>Fecha de Vencimiento (opcional):</p>
                                <InputDate
                                    mode="date"
                                    value={fechaVencimiento}
                                    onChange={(val) => setFechaVencimiento(val)}
                                    placeholder="Seleccionar fecha de vencimiento"
                                    icon="calendar"
                                />


                            </>
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
                                label='Realizar Cotización'
                                onClick={handleConfirmar}
                                loading={loadingConfirmar}
                                disabled={
                                    // Deshabilitar si es cotización a crédito sin cliente
                                    metodoPagoSeleccionado === 'credito' && !clienteSeleccionado
                                }
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear cotizaciones</p>
                    </div>
                )}
            </div>

            {/* Modal de limpiar canasta */}
            <LimpiarCanasta
                isOpen={isLimpiarModalOpen}
                setIsOpen={setIsLimpiarModalOpen}
                onConfirmar={handleLimpiarCanasta}
            />

            {/* View de selección de clientes */}
            <Clientes
                isOpen={isClientesSeleccionOpen}
                setIsOpen={setIsClientesSeleccionOpen}
                modoSeleccion={true}
                onClienteSeleccionado={handleClienteSeleccionado}
            />

            <Notification isVisible={notification.isVisible} type={notification.type} text={notification.text} />
        </View>
    );
}

export default CanastaCotizacion;