import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import Clientes from '../clientes/Clientes';
import { useToast } from '../../../context/ToastContext';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import InputDate from '../../common/InputDate';
import cotizacionesService from '../../../services/cotizacionesService';
import useCanastaProductos from '../almacen-general/hooks/useCanastaProductos';
import usePrecioCanasta from '../almacen-general/hooks/usePrecioCanasta';
import { useLayout } from '../../../context/LayoutContext';

function CanastaCotizacion({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const { isLargeScreen } = useLayout();
    const { showWarning, showDanger } = useToast();
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

    // Hook para manejar la lógica de precios de cotizaciones
    const {
        resolvePrecioInicial,
        resolveModoInicial
    } = usePrecioCanasta({
        tipoCanasta: 'cotizacion',
        esEntrega: false,
        isOpen,
        precioSeleccionado: null, // Se actualizará después
        isEditing: false,
    });

    const syncProductoCotizacion = useCallback(({
        productoCarrito,
        productoActualizado,
        modoAgrupacion,
        precioSeleccionado,
        obtenerPrecioPorTipo
    }) => {
        const productoModificado = {
            ...productoCarrito,
            precioManual: productoCarrito.precioManual === true
        };

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
                    showWarning('Aviso', `El stock de ${productoCarrito.name} cambió. Cantidad ajustada a ${productoModificado.stock}`);
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
        }

        return productoModificado;
    }, [showWarning, showDanger]);

    const calcularSubtotalProducto = useCallback((producto) => {
        if (!producto) return 0;
        const precio = Number(producto.precio) || 0;
        const cantidad = Number(producto.cantidad) || 0;
        return Number((precio * cantidad).toFixed(2));
    }, []);

    const {
        precioSeleccionado,
        setPrecioSeleccionado,
        modoAgrupacion,
        setModoAgrupacion,
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
        localStorageKey: 'canastaCotizaciones',
        shouldPersistLocalStorage: true,
        shouldLoadLocalStorage: true,
        resolveInitialPrecioId: resolvePrecioInicial,
        resolveInitialModoAgrupacion: resolveModoInicial,
        exposeGlobals: {
            precioGetterName: 'getPrecioSeleccionadoCanastaCotizaciones',
            modoGetterName: 'getModoAgrupacionCanastaCotizaciones'
        },
        isCartMode,
        autoFocusCantidad: true,
        onSyncProducto: syncProductoCotizacion,
        onAfterModoAgrupacionChange: ({ producto, cantidadNueva }) => {
            if (producto?.name && cantidadNueva !== undefined) {
                showWarning('Aviso', `La cantidad de ${producto.name} se ajustó al máximo disponible: ${cantidadNueva} grupos`);
            }
        }
    });

    // Hook para guardar el precio cuando esté disponible
    usePrecioCanasta({
        tipoCanasta: 'cotizacion',
        esEntrega: false,
        isOpen,
        precioSeleccionado, // Ahora pasamos el precioSeleccionado real
        isEditing: false,
    });

    const prepararProductosCotizacion = useCallback(() => {
        const productosBase = prepararProductos();
        const productosMap = new Map(productosBase.map(p => [p.id, p]));

        return productosCanasta.map(producto => {
            const base = productosMap.get(producto.id) || {
                id: producto.id,
                cantidad: producto.cantidad,
                precio: Number(producto.precio) || 0
            };

            return {
                ...base,
                subtotal: calcularSubtotalProducto(producto)
            };
        });
    }, [calcularSubtotalProducto, prepararProductos, productosCanasta]);

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
        //     showDanger('Error', 'No se puede exceder el stock disponible');
        //     return; // No actualizar si excede el stock
        // }

        // Si debe animar, activar la animación
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

    // Cargar información del cliente de la cotización cuando se repite
    useEffect(() => {
        if (isOpen) {
            const clienteId = localStorage.getItem('clienteIdCotizacionRepitiendo');
            const clienteName = localStorage.getItem('clienteNameCotizacionRepitiendo');

            if (clienteId && clienteName) {
                setClienteSeleccionadoData({
                    id: clienteId,
                    name: clienteName
                });
                setClienteSeleccionado(clienteId);
            } else {
                setClienteSeleccionadoData(null);
                setClienteSeleccionado('');
            }
        } else if (!isOpen) {
            setClienteSeleccionadoData(null);
            setClienteSeleccionado('');
        }
    }, [isOpen]);

    // Cargar método de pago de la cotización cuando se repite
    useEffect(() => {
        if (isOpen) {
            const metodoPago = localStorage.getItem('metodoPagoCotizacionRepitiendo');
            if (metodoPago) {
                setMetodoPagoSeleccionado(metodoPago);
            }
        } else if (!isOpen) {
            setMetodoPagoSeleccionado('');
        }
    }, [isOpen]);

    // Cargar fecha de vencimiento de la cotización cuando se repite
    useEffect(() => {
        if (isOpen) {
            const fechaVenc = localStorage.getItem('fechaVencimientoCotizacionRepitiendo');
            if (fechaVenc) {
                setFechaVencimiento(fechaVenc);
            }
        } else if (!isOpen) {
            setFechaVencimiento('');
        }
    }, [isOpen]);

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        // Limpiar también el localStorage
        localStorage.removeItem('canastaCotizaciones');
        // Limpiar variables de repetición
        localStorage.removeItem('precioIdCotizacionRepitiendo');
        localStorage.removeItem('cotizacionAgrupadoRepitiendo');
        localStorage.removeItem('clienteIdCotizacionRepitiendo');
        localStorage.removeItem('clienteNameCotizacionRepitiendo');
        localStorage.removeItem('metodoPagoCotizacionRepitiendo');
        localStorage.removeItem('fechaVencimientoCotizacionRepitiendo');
        localStorage.removeItem('productosCotizacionRepitiendo');
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
            showDanger('Error', 'El cliente es obligatorio para cotizaciones a crédito');
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

            const productosCotizacion = prepararProductosCotizacion();

            // Preparar datos para la cotización
            const cotizacionData = {
                observaciones: observacionesGenerales || null,
                metodo_pago: metodoPagoSeleccionado || null,
                cliente_id: clienteSeleccionado || null,
                fecha_vencimiento: fechaVencimiento || null,
                agrupado: modoAgrupacion === 'agrupado',
                precio_id: precioSeleccionado || null,
                productos: productosCotizacion
            };

            // Crear la cotización
            const result = await cotizacionesService.create(cotizacionData);

            if (!result.success) {
                showDanger('Error', result.message || 'Error al crear la cotización');
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

            // Limpiar variables de repetición
            localStorage.removeItem('precioIdCotizacionRepitiendo');
            localStorage.removeItem('cotizacionAgrupadoRepitiendo');
            localStorage.removeItem('clienteIdCotizacionRepitiendo');
            localStorage.removeItem('clienteNameCotizacionRepitiendo');
            localStorage.removeItem('metodoPagoCotizacionRepitiendo');
            localStorage.removeItem('fechaVencimientoCotizacionRepitiendo');
            localStorage.removeItem('productosCotizacionRepitiendo');

            // Solo cerrar la canasta en móvil, no en PC (modo carrito)
            if (!isCartMode) {
                setIsOpen(false);
            }

            if (onCerrarCanasta) {
                onCerrarCanasta(result.data);
            }

        } catch (error) {
            console.error('Error al confirmar:', error);
            showDanger('Error', error.message || 'Error al confirmar');
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
                    {/* Selector de modalidad fuera de controles generales */}
                    {productosCanasta.some(producto => producto.grup) && (

                        <Select
                            value={modoAgrupacion}
                            onChange={handleCambiarModoAgrupacion}
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
                                <hr className={styles.hr} />
                                <Boton
                                    className='btn-gray'
                                    label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : (metodoPagoSeleccionado === 'credito' ? 'Seleccionar Cliente (obligatorio)' : 'Seleccionar Cliente (opcional)')}
                                    onClick={() => setIsClientesSeleccionOpen(true)}
                                    style={{
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

        </View>
    );
}

export default CanastaCotizacion;