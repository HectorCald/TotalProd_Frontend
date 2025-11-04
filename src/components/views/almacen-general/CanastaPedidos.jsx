import React, { useState, useEffect, useRef } from 'react';
import styles from './CanastaMovimientos.module.css';
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

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, pedidoId = null, onPedidoActualizado = null, preciosTipos = [], sucursales = [], loadingPrecios = false, loadingSucursales = false, productosActualizados = [], isCartMode = false }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
    const [modoAgrupacion, setModoAgrupacion] = useState('agrupado'); // 'agrupado' o 'no_agrupado'
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);

    // Estado para notificaciones
    const [notification, setNotification] = useState({ isVisible: false, type: 'error', text: '' });
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

    // Inicializar precio seleccionado cuando se abren los precios (solo si no hay uno seleccionado)
    useEffect(() => {
        if (isOpen && preciosTipos.length > 0 && !precioSeleccionado) {
            // Si estamos editando un pedido, cargar el precio_id desde localStorage
            if (pedidoId) {
                const precioIdGuardado = localStorage.getItem('precioIdEditando');
                if (precioIdGuardado && preciosTipos.find(p => p.value === precioIdGuardado)) {
                    setPrecioSeleccionado(precioIdGuardado);
                } else if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            } else if (preciosTipos.length > 0) {
                // Seleccionar el primer precio por defecto
                setPrecioSeleccionado(preciosTipos[0].value);
            }
        }
    }, [isOpen, preciosTipos, precioSeleccionado, pedidoId]);

    // Inicializar cliente seleccionado cuando se edita un pedido
    useEffect(() => {
        if (isOpen && pedidoId) {
            const clienteId = localStorage.getItem('clienteIdEditando');
            const clienteName = localStorage.getItem('clienteNameEditando');
            if (clienteId) {
                setClienteSeleccionado(clienteId);
                setClienteSeleccionadoData({ id: clienteId, name: clienteName || '' });
            }
        }
    }, [isOpen, pedidoId]);

    // Inicializar modo de agrupación desde el pedido al abrir en edición
    useEffect(() => {
        if (isOpen && pedidoId) {
            const modoPedido = localStorage.getItem('pedidoAgrupadoEditando');
            if (modoPedido === 'agrupado' || modoPedido === 'no_agrupado') {
                setModoAgrupacion(modoPedido);
            }
        }
    }, [isOpen, pedidoId]);

    // Actualizar precios cuando se inicializa el precioSeleccionado
    useEffect(() => {
        if (precioSeleccionado && preciosTipos.length > 0 && productosCanasta.length > 0) {
            const precioSeleccionadoData = preciosTipos.find(p => p.value === precioSeleccionado);
            if (precioSeleccionadoData) {
                // Solo actualizar productos que no tienen precio o tienen precio 0 (recién agregados)
                const productosNecesitanPrecio = productosCanasta.filter(producto =>
                    !producto.precio || producto.precio === 0
                );

                if (productosNecesitanPrecio.length > 0) {
                    setProductosCanasta(prev => prev.map(producto => {
                        // Solo actualizar si el producto no tiene precio o tiene precio 0
                        if (!producto.precio || producto.precio === 0) {
                            const precioProducto = producto.price_product?.find(pp => pp.prices_types?.id === precioSeleccionadoData.value);
                            const precioUnit = precioProducto?.valor || 0;
                            // Considerar el modo de agrupación al calcular el precio
                            let nuevoPrecio = (modoAgrupacion === 'agrupado' && producto.grup) ? (precioUnit * (producto.grup || 1)) : precioUnit;

                            // Aplicar redondeo si está en modo agrupado
                            if (modoAgrupacion === 'agrupado' && producto.grup) {
                                nuevoPrecio = redondearPrecio(nuevoPrecio);
                            }

                            return {
                                ...producto,
                                precio: nuevoPrecio
                            };
                        }
                        return producto; // Mantener el precio actual si ya tiene uno
                    }));
                }
            }
        }
    }, [precioSeleccionado, preciosTipos, productosCanasta.length, modoAgrupacion]);

    // Guardar en localStorage cuando cambie la canasta
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaPedidos', JSON.stringify(productosCanasta));
        }
        // NO remover del localStorage aquí para evitar que se borre al recargar la página
        // La limpieza se maneja en las funciones específicas
    }, [productosCanasta, pedidoId]);

    // Cargar canasta desde localStorage al abrir el modal (solo si no estamos editando)
    useEffect(() => {
        if (isOpen && !pedidoId) {
            const canastaGuardada = localStorage.getItem('canastaPedidos');
            if (canastaGuardada) {
                try {
                    const productosGuardados = JSON.parse(canastaGuardada);
                    setProductosCanasta(productosGuardados);
                } catch (error) {
                    console.error('Error al cargar canasta desde localStorage:', error);
                }
            }
        }
    }, [isOpen, pedidoId]);

    // Sincronizar stock y precios del carrito con productos actualizados
    useEffect(() => {
        if (productosActualizados.length > 0 && productosCanasta.length > 0) {
            setProductosCanasta(prevCanasta => {
                return prevCanasta.map(productoCarrito => {
                    const productoActualizado = productosActualizados.find(p => p.id === productoCarrito.id);
                    if (productoActualizado) {
                        let productoModificado = { ...productoCarrito };

                        // Si el stock cambió, actualizar el stock en el carrito
                        if (productoActualizado.stock !== productoCarrito.stock) {
                            // Si la cantidad en el carrito excede el nuevo stock, ajustar
                            if (productoCarrito.cantidad > productoActualizado.stock) {
                                mostrarNotificacion('warning', `El stock de ${productoCarrito.name} cambió. Cantidad ajustada a ${productoActualizado.stock}`);
                                productoModificado.stock = productoActualizado.stock;
                                productoModificado.cantidad = productoActualizado.stock;
                            } else {
                                productoModificado.stock = productoActualizado.stock;
                            }
                        }

                        // Si los precios cambiaron, actualizar el precio en el carrito según el tipo seleccionado
                        if (productoActualizado.price_product && precioSeleccionado) {
                            const precioTipo = productoActualizado.price_product.find(pp => pp.prices_types?.id === precioSeleccionado);
                            if (precioTipo) {
                                const precioUnit = precioTipo.valor;
                                const precioFinal = (modoAgrupacion === 'agrupado' && productoCarrito.grup) ? (precioUnit * (productoCarrito.grup || 1)) : precioUnit;
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

            return { ...producto, precio: nuevoPrecio };
        }));
    };

    const handleCambiarModoAgrupacion = (nuevoModo) => {
        if (nuevoModo === modoAgrupacion) return;
        setModoAgrupacion(nuevoModo);
        setProductosCanasta(prev => prev.map(producto => {
            const stockOriginalEnUnidades = producto.stockOriginal || producto.stock;
            if (nuevoModo === 'agrupado' && producto.grup) {
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

                return { ...producto, cantidad: cantidadFinal, precio: precioPorGrupo, stock: stockEnGrupos, stockOriginal: stockOriginalEnUnidades };
            } else {
                const precioUnitario = (modoAgrupacion === 'agrupado' && producto.grup) ? ((producto.precio || 0) / (producto.grup || 1)) : (producto.precio || 0);
                return { ...producto, cantidad: producto.cantidad, precio: precioUnitario, stock: stockOriginalEnUnidades, stockOriginal: stockOriginalEnUnidades };
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
        localStorage.removeItem('canastaPedidos');
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    // Preparar productos respetando agrupación
    const prepararProductos = () => {
        return productosCanasta.map(producto => {
            let cantidadEnUnidades = producto.cantidad;
            let precioPorUnidad = producto.precio || 0;
            if (modoAgrupacion === 'agrupado' && producto.grup) {
                cantidadEnUnidades = (producto.cantidad || 0) * producto.grup;
                precioPorUnidad = (producto.precio || 0) / producto.grup;
            }
            return {
                id: producto.id,
                cantidad: cantidadEnUnidades,
                precio: precioPorUnidad
            };
        });
    };

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
                // Solo enviar cliente_id si el usuario seleccionó uno explícitamente
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
                localStorage.removeItem('pedidoIdEditando');
                localStorage.removeItem('precioIdEditando');
                localStorage.removeItem('pedidoAgrupadoEditando');
                localStorage.removeItem('productosPedidoEditando');

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


    // Exponer funciones para que AlmacenGeneral pueda acceder al precio y modo seleccionados
    useEffect(() => {
        // Guardar la referencia a las funciones en el window para acceso global
        window.getPrecioSeleccionadoCanastaPedidos = () => precioSeleccionado;
        window.getModoAgrupacionCanastaPedidos = () => modoAgrupacion;
    }, [precioSeleccionado, modoAgrupacion]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            {!isCartMode && <HeaderView onBack={() => {
                localStorage.removeItem('precioIdEditando');
                localStorage.removeItem('pedidoAgrupadoEditando');
                localStorage.removeItem('productosPedidoEditando');
                setIsOpen(false);
            }} />}
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                <h1 className={styles.title}>Canasta de Pedidos
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
                                                <BoxIcon name='minus' />
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
                            {/* Botón para seleccionar cliente entre sucursal y observaciones */}
                            <Boton
                                className='btn-gray'
                                label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
                                onClick={() => setIsClientesSeleccionOpen(true)}
                                style={{ width: '100%', justifyContent: 'flex-start', marginTop: 'auto' }}
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
                                label={pedidoId ? 'Actualizar Pedido' : 'Confirmar Pedido'}
                                onClick={pedidoId ? handleActualizarPedido : handleCrearPedido}
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