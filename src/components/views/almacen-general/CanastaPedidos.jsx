import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';
import Clientes from '../clientes/Clientes';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import useCanastaProductos from './hooks/useCanastaProductos';
import usePedidoEdicion from './hooks/usePedidoEdicion';
import { useLayout } from '../../../context/LayoutContext';

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, pedidoId = null, onPedidoActualizado = null, preciosTipos = [], sucursales = [], loadingPrecios = false, loadingSucursales = false, productosActualizados = [], isCartMode = false }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);

    // Estado para notificaciones
    const [notification, setNotification] = useState({ isVisible: false, type: 'error', text: '' });
    const notificationTimeoutRef = useRef(null);
    const mostrarNotificacion = useCallback((tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        if (notificationTimeoutRef.current) {
            clearTimeout(notificationTimeoutRef.current);
        }

        // Auto-ocultar después de 3 segundos
        notificationTimeoutRef.current = setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
            notificationTimeoutRef.current = null;
        }, 3000);
    }, []);

    const {
        isEditing,
        resolvePrecioInicial,
        resolveModoInicial,
        clearEdicionStorage
    } = usePedidoEdicion({
        pedidoId,
        isOpen,
        setClienteSeleccionado,
        setClienteSeleccionadoData
    });

    const syncProductoPedido = useCallback(({
        productoCarrito,
        productoActualizado,
        modoAgrupacion,
        precioSeleccionado,
        obtenerPrecioPorTipo
    }) => {
        let productoModificado = productoCarrito;
        let huboCambios = false;

        if (productoActualizado.stock !== undefined && productoActualizado.stock !== productoCarrito.stock) {
            if (productoCarrito.cantidad > productoActualizado.stock) {
                mostrarNotificacion('warning', `El stock de ${productoCarrito.name} cambió. Cantidad ajustada a ${productoActualizado.stock}`);
                productoModificado = {
                    ...productoModificado,
                    cantidad: productoActualizado.stock
                };
                huboCambios = true;
            }
            productoModificado = {
                ...productoModificado,
                stock: productoActualizado.stock
            };
            huboCambios = true;
        }

        if (productoActualizado.price_product && precioSeleccionado) {
            const base = productoModificado === productoCarrito ? { ...productoModificado } : productoModificado;
            const precioCalculado = obtenerPrecioPorTipo(
                { ...base, price_product: productoActualizado.price_product },
                precioSeleccionado,
                modoAgrupacion
            );
            if (precioCalculado !== productoCarrito.precio || productoActualizado.price_product !== productoCarrito.price_product) {
                productoModificado = {
                    ...base,
                    precio: precioCalculado,
                    price_product: productoActualizado.price_product
                };
                huboCambios = true;
            }
        }

        return huboCambios ? productoModificado : productoCarrito;
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
        localStorageKey: 'canastaPedidos',
        shouldPersistLocalStorage: true,
        shouldLoadLocalStorage: !isEditing,
        resolveInitialPrecioId: resolvePrecioInicial,
        resolveInitialModoAgrupacion: resolveModoInicial,
        exposeGlobals: {
            precioGetterName: 'getPrecioSeleccionadoCanastaPedidos',
            modoGetterName: 'getModoAgrupacionCanastaPedidos'
        },
        isCartMode,
        autoFocusCantidad: true,
        onSyncProducto: syncProductoPedido,
        onAfterModoAgrupacionChange: ({ producto, cantidadNueva }) => {
            if (producto?.grup) {
                mostrarNotificacion('warning', `La cantidad de ${producto.name} se ajustó al máximo disponible: ${cantidadNueva} grupos`);
            } else if (producto?.name) {
                mostrarNotificacion('warning', `La cantidad de ${producto.name} se ajustó al máximo disponible.`);
            } else {
                mostrarNotificacion('warning', `La cantidad se ajustó al máximo disponible.`);
            }
        }
    });

    useEffect(() => {
        if (!precioSeleccionado) return;
        if (!productosCanasta || productosCanasta.length === 0) return;
        const existenProductosSinPrecio = productosCanasta.some(producto => !producto.precio || producto.precio === 0);
        if (!existenProductosSinPrecio) return;
        cambiarTipoPrecio(precioSeleccionado);
    }, [cambiarTipoPrecio, precioSeleccionado, productosCanasta]);

    useEffect(() => {
        return () => {
            if (notificationTimeoutRef.current) {
                clearTimeout(notificationTimeoutRef.current);
            }
        };
    }, []);

    // Establecer "Casa Matriz" como valor por defecto
    useEffect(() => {
        // Solo si no estamos editando, hay sucursales disponibles, no hay sucursal seleccionada y el componente está abierto
        if (!pedidoId && sucursales.length > 0 && !sucursalSeleccionada && isOpen) {
            const casaMatriz = sucursales.find(sucursal => sucursal.label === 'Casa Matriz');
            if (casaMatriz) {
                setSucursalSeleccionada(casaMatriz.value);
            }
        }
    }, [sucursales, isOpen, pedidoId, sucursalSeleccionada]);


    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }
        if (animar) {
            triggerAnimacionCantidad(productoId);
        }
        setProductosCanasta(prev => prev.map(p => p.id === productoId
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

    const handleClienteSeleccionado = (cliente) => {
        setClienteSeleccionadoData(cliente);
        setClienteSeleccionado(cliente.id);
        setIsClientesSeleccionOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaPedidos');
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    const handleBack = () => {
        if (isEditing) {
            clearEdicionStorage();
        }
        setIsOpen(false);
    };

    const headerRightContent = (
        <div className={styles.titleButtons}>
            <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                <BoxIcon name='trash' className={styles.iconTrash} />
            </button>
        </div>
    );

    // Función para crear un nuevo pedido
    const handleCrearPedido = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar sucursal seleccionada
            if (!sucursalSeleccionada) {
                mostrarNotificacion('error', 'La sucursal es obligatoria');
                setLoadingConfirmar(false);
                return;
            }

            // Validar que no se seleccione la sucursal actual
            if (sucursalSeleccionada === sucursalActual?.id) {
                mostrarNotificacion('error', 'No puedes seleccionar tu sucursal actual como destino');
                setLoadingConfirmar(false);
                return;
            }

            // Preparar datos para enviar al backend
            const pedidoData = {
                observaciones: observacionesGenerales || null,
                precio_id: precioSeleccionado,
                sucursal_destino_id: sucursalSeleccionada,
                agrupado: modoAgrupacion === 'agrupado',
                // Si no hay cliente seleccionado, no enviar el campo para evitar overwriting en backend
                ...(clienteSeleccionado ? { cliente_id: clienteSeleccionado } : {}),
                productos: prepararProductos()
            };

            // Crear nuevo pedido
            const response = await pedidosAlmacenService.create(pedidoData);

            if (response.success) {
                // Limpiar la canasta
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setSucursalSeleccionada('');
                setClienteSeleccionado('');
                setClienteSeleccionadoData(null);

                // Limpiar localStorage
                localStorage.removeItem('canastaPedidos');

                // Cerrar canasta y mostrar notificación
                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta();
                }

            } else {
                console.error('Error al crear pedido:', response.message);
                mostrarNotificacion('error', response.message || 'Error al crear el pedido');
            }

        } catch (error) {
            console.error('Error al crear pedido:', error);
            mostrarNotificacion('error', error.message || 'Error al crear el pedido');
        } finally {
            setLoadingConfirmar(false);
        }
    };

    // Función para actualizar un pedido existente
    const handleActualizarPedido = async () => {
        setLoadingConfirmar(true);
        try {
            // Preparar datos para enviar al backend
            const pedidoData = {
                observaciones: observacionesGenerales || null,
                precio_id: precioSeleccionado,
                agrupado: modoAgrupacion === 'agrupado',
                ...(clienteSeleccionado ? { cliente_id: clienteSeleccionado } : {}),
                productos: prepararProductos()
            };

            // Actualizar pedido existente
            const response = await pedidosAlmacenService.update(pedidoId, pedidoData);

            if (response.success) {
                // Notificar al componente padre sobre la actualización
                if (onPedidoActualizado) {
                    onPedidoActualizado(response.data);
                }

                // Limpiar la canasta
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setClienteSeleccionado('');
                setClienteSeleccionadoData(null);

                // Limpiar localStorage
                localStorage.removeItem('canastaPedidos');
                clearEdicionStorage();

                // Cerrar canasta y mostrar notificación
                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta();
                }

            } else {
                console.error('Error al actualizar pedido:', response.message);
                mostrarNotificacion('error', response.message || 'Error al actualizar el pedido');
            }

        } catch (error) {
            console.error('Error al actualizar pedido:', error);
            mostrarNotificacion('error', error.message || 'Error al actualizar el pedido');
        } finally {
            setLoadingConfirmar(false);
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            <HeaderView
                title="Canasta de Pedidos"
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
                                                        ? `${(producto.stock || 0)} grupos`
                                                        : `${producto.stock || 0} ${producto.type_measure?.code || ''}`
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
                                                <BoxIcon name='minus' />
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
                                                            setProductosCanasta(prev => prev.map(p =>
                                                                p.id === producto.id
                                                                    ? { ...p, cantidadTemp: '' }
                                                                    : p
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
                                                            setProductosCanasta(prev => prev.map(p =>
                                                                p.id === producto.id
                                                                    ? { ...p, cantidadTemp: undefined }
                                                                    : p
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
                                                <BoxIcon name='plus' />
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
                            <hr className={styles.hr} />
                            {/* Botón para seleccionar cliente entre sucursal y observaciones */}
                            <Boton
                                className='btn-gray'
                                label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
                                onClick={() => setIsClientesSeleccionOpen(true)}
                                style={{ width: '100%', justifyContent: 'flex-start' }}
                            />
                            {/* Selector de sucursal - Solo mostrar si no estamos editando */}
                            {!pedidoId && (
                                <Select
                                    value={sucursalSeleccionada}
                                    onChange={setSucursalSeleccionada}
                                    options={sucursales}
                                    placeholder='Sucursal de destino (obligatorio)'
                                    disabled={loadingSucursales}
                                    icon='building'
                                />
                            )}
                            


                            {/* Input de observaciones debajo del selector de cliente */}

                            <InputNormal
                                tipo="text"
                                value={observacionesGenerales}
                                placeholder="Observaciones del pedido"
                                onChange={(e) => setObservacionesGenerales(e.target.value)}
                                icon='comment'
                            />
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                <span className={styles.totalGeneralLabel}>Total General:</span>
                                <span className={styles.totalGeneralValue}>Bs. {productosCanasta.reduce((total, producto) => {
                                    const valorProducto = (producto.precio || 0) * producto.cantidad;
                                    return total + valorProducto;
                                }, 0).toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={isEditing ? 'Actualizar Pedido' : 'Confirmar Pedido'}
                                onClick={isEditing ? handleActualizarPedido : handleCrearPedido}
                                loading={loadingConfirmar}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear pedidos</p>
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

export default CanastaPedidos;