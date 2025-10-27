import React, { useState, useEffect, useRef } from 'react';
import styles from '../almacen-general/CanastaMovimientos.module.css';
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
import InputNormal from '../../common/InputNormal';
import cotizacionesService from '../../../services/cotizacionesService';

function CanastaCotizacion({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [modoAgrupacion, setModoAgrupacion] = useState('agrupado'); // 'agrupado' o 'no_agrupado'

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
    // Referencias para el auto-focus en inputs de cantidad
    const cantidadInputRefs = useRef({});
    useEffect(() => {
        if (isCartMode && productosCanasta.length > 0) {
            // Encontrar el último producto agregado (el más reciente)
            const ultimoProducto = productosCanasta[productosCanasta.length - 1];
            const inputRef = cantidadInputRefs.current[ultimoProducto.id];

            if (inputRef) {
                // Pequeño delay para asegurar que el DOM se haya actualizado
                setTimeout(() => {
                    inputRef.focus();
                    inputRef.select(); // Seleccionar todo el texto para facilitar la edición
                }, 100);
            }
        }
    }, [productosCanasta.length, isCartMode]);

    // Inicializar precio seleccionado
    useEffect(() => {
        if (isOpen && preciosTipos.length > 0 && !precioSeleccionado) {
            // Para cotizaciones, seleccionar el primer precio por defecto
            if (preciosTipos.length > 0) {
                setPrecioSeleccionado(preciosTipos[0].value);
            }
        }
    }, [isOpen, preciosTipos, precioSeleccionado]);

    // Guardar en localStorage cuando cambie la canasta
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaCotizaciones', JSON.stringify(productosCanasta));
        }
    }, [productosCanasta]);

    // Cargar canasta desde localStorage al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const canastaGuardada = localStorage.getItem('canastaCotizaciones');
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

                        // Si los precios cambiaron, actualizar el precio en el carrito según el tipo seleccionado
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
                                productoModificado.price_product = productoActualizado.price_product; // Actualizar también la estructura de precios
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

            return {
                ...producto,
                precio: nuevoPrecio
            };
        }));
    };

    const handleCambiarModoAgrupacion = (nuevoModo) => {
        if (nuevoModo === modoAgrupacion) return;
        setModoAgrupacion(nuevoModo);

        // Actualizar productos según el nuevo modo - SOLO cambiar precio y stock, NO la cantidad
        setProductosCanasta(prev => prev.map(producto => {
            // Usar stockOriginal si existe, sino usar stock
            // Si no hay stockOriginal, establecerlo ahora
            const stockOriginalEnUnidades = producto.stockOriginal || producto.stock;
            if (!producto.stockOriginal) {
                producto.stockOriginal = producto.stock;
            }

            if (nuevoModo === 'agrupado' && producto.grup) {
                // Cambiar a modo agrupado
                const stockEnGrupos = Math.floor(stockOriginalEnUnidades / producto.grup);
                const precioUnitario = (modoAgrupacion === 'agrupado' && producto.grup) ? ((producto.precio || 0) / (producto.grup || 1)) : (producto.precio || 0);
                let precioPorGrupo = precioUnitario * (producto.grup || 1);

                // Aplicar redondeo al precio por grupo
                precioPorGrupo = redondearPrecio(precioPorGrupo);

                // Si la cantidad actual excede el stock disponible en grupos, ajustar al máximo
                let cantidadFinal = producto.cantidad;
                if (producto.cantidad > stockEnGrupos) {
                    cantidadFinal = stockEnGrupos;
                    mostrarNotificacion('warning', `La cantidad de ${producto.name} se ajustó al máximo disponible: ${stockEnGrupos} grupos`);
                }

                return {
                    ...producto,
                    cantidad: cantidadFinal,
                    precio: precioPorGrupo,
                    stock: stockEnGrupos,
                    stockOriginal: stockOriginalEnUnidades // Mantener el stock original
                };
            } else {
                // Cambiar a modo no agrupado - SOLO cambiar precio y stock, NO la cantidad
                const precioUnitario = (modoAgrupacion === 'agrupado' && producto.grup) ? ((producto.precio || 0) / (producto.grup || 1)) : (producto.precio || 0);

                return {
                    ...producto,
                    cantidad: producto.cantidad, // NO CAMBIAR LA CANTIDAD
                    precio: precioUnitario,
                    stock: stockOriginalEnUnidades, // Stock original en unidades
                    stockOriginal: stockOriginalEnUnidades // Mantener el stock original
                };
            }
        }));
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

    // Preparar productos respetando agrupación
    const prepararProductos = () => {
        return productosCanasta.map(producto => {
            let cantidadEnUnidades = producto.cantidad;
            let precioPorUnidad = producto.precio || 0;

            if (modoAgrupacion === 'agrupado' && producto.grup) {
                cantidadEnUnidades = producto.cantidad * producto.grup;
                precioPorUnidad = producto.precio / producto.grup;
            }
            return {
                id: producto.id,
                cantidad: cantidadEnUnidades,
                precio: precioPorUnidad
            };
        });
    };

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

    // Exponer las funciones para que AlmacenGeneral-Auxiliar pueda acceder al precio seleccionado y modo de agrupación
    useEffect(() => {
        // Guardar las referencias a las funciones en el window para acceso global
        window.getPrecioSeleccionadoCanastaCotizaciones = () => precioSeleccionado;
        window.getModoAgrupacionCanastaCotizaciones = () => modoAgrupacion;
    }, [precioSeleccionado, modoAgrupacion]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            {!isCartMode && <HeaderView onBack={() => setIsOpen(false)} />}
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                <h1 className={styles.title}>Canasta de Cotizaciones
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>
                    </div>
                </h1>

                {/* Selectores de precio y agrupación */}
                <div className={styles.controlesGenerales}>
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
                    <div className={styles.grupoGeneral}>
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
                                                    ref={(el) => {
                                                        if (el) {
                                                            cantidadInputRefs.current[producto.id] = el;
                                                        }
                                                    }}
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
                                <InputNormal
                                    tipo="date"
                                    value={fechaVencimiento}
                                    onChange={(e) => setFechaVencimiento(e.target.value)}
                                    icon="calendar"
                                    placeholder="Seleccionar fecha de vencimiento"
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