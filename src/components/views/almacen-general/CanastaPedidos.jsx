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
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, pedidoId = null, onPedidoActualizado = null, preciosTipos = [], sucursales = [], loadingPrecios = false, loadingSucursales = false, productosActualizados = [] }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
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
                            const nuevoPrecio = precioProducto?.valor || 0;
                            
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
    }, [precioSeleccionado, preciosTipos, productosCanasta.length]);


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

    // Sincronizar stock del carrito con productos actualizados
    useEffect(() => {
        if (productosActualizados.length > 0 && productosCanasta.length > 0) {
            setProductosCanasta(prevCanasta => {
                return prevCanasta.map(productoCarrito => {
                    const productoActualizado = productosActualizados.find(p => p.id === productoCarrito.id);
                    if (productoActualizado) {
                        // Si el stock cambió, actualizar el stock en el carrito
                        if (productoActualizado.stock !== productoCarrito.stock) {
                            // Si la cantidad en el carrito excede el nuevo stock, ajustar
                            if (productoCarrito.cantidad > productoActualizado.stock) {
                                mostrarNotificacion('warning', `El stock de ${productoCarrito.name} cambió. Cantidad ajustada a ${productoActualizado.stock}`);
                                return {
                                    ...productoCarrito,
                                    stock: productoActualizado.stock,
                                    cantidad: productoActualizado.stock
                                };
                            }
                            return {
                                ...productoCarrito,
                                stock: productoActualizado.stock
                            };
                        }
                    }
                    return productoCarrito;
                });
            });
        }
    }, [productosActualizados]);

    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
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

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaPedidos');
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    const handleConfirmarPedido = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar sucursal seleccionada solo si no estamos editando
            if (!pedidoId) {
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
            }

            // Preparar datos para enviar al backend
            const pedidoData = {
                observaciones: observacionesGenerales || null,
                precio_id: precioSeleccionado,
                productos: productosCanasta.map(producto => ({
                    id: producto.id,
                    cantidad: producto.cantidad,
                    precio: producto.precio || 0
                }))
            };

            // Solo incluir pedido_sucursal_id si no estamos editando
            if (!pedidoId) {
                pedidoData.pedido_sucursal_id = sucursalSeleccionada;
            }

            let response;
            if (pedidoId) {
                // Actualizar pedido existente
                response = await pedidosAlmacenService.update(pedidoId, pedidoData);
            } else {
                // Crear nuevo pedido
                response = await pedidosAlmacenService.create(pedidoData);
            }

            if (response.success) {
                // Si es una actualización, notificar al componente padre
                if (pedidoId && onPedidoActualizado) {
                    onPedidoActualizado(response.data);
                }

                // Limpiar la canasta
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setSucursalSeleccionada('');
                
                // Limpiar localStorage
                localStorage.removeItem('canastaPedidos');
                
                // Cerrar modal de confirmación
                setIsConfirmarModalOpen(false);
                
                // Cerrar canasta y mostrar notificación
                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta();
                }
            } else {
                console.error('Error al procesar pedido:', response.message);
                mostrarNotificacion('error', response.message || 'Error al procesar el pedido');
            }

        } catch (error) {
            console.error('Error al confirmar pedido:', error);
            mostrarNotificacion('error', error.message || 'Error al confirmar el pedido');
        } finally {
            setLoadingConfirmar(false);
        }
    };

    const getTotalValor = () => {
        return productosCanasta.reduce((total, producto) => {
            const valorProducto = (producto.precio || 0) * producto.cantidad;
            return total + valorProducto;
        }, 0);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => {
                localStorage.removeItem('precioIdEditando');
                setIsOpen(false);
            }} />
            <div className={styles.container}>
                <h1 className={styles.title}>Canasta de Pedidos
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
                                                    Disponible: {producto.stock || 0} {producto.type_measure?.code || ''}
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
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                <span className={styles.totalGeneralLabel}>Total General:</span>
                                <span className={styles.totalGeneralValue}>Bs. {getTotalValor().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={pedidoId ? 'Resumen de Actualización' : 'Resumen de Pedido'}
                                onClick={() => setIsConfirmarModalOpen(true)}
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
            <ViewModal isOpen={isLimpiarModalOpen} setIsOpen={setIsLimpiarModalOpen}>
                <HeaderModal
                    title="Limpiar Canasta"
                    onClose={() => setIsLimpiarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas limpiar toda la canasta? Esta acción no se puede deshacer.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            onClick={() => setIsLimpiarModalOpen(false)}
                        />
                         <Boton
                            className='btn-red'
                            label='Si, limpiar'
                            onClick={handleLimpiarCanasta}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de confirmar pedido */}
            <ViewModal isOpen={isConfirmarModalOpen} setIsOpen={setIsConfirmarModalOpen}>
                <HeaderModal
                    title={pedidoId ? "Resumen de Actualización" : "Resumen de Pedido"}
                    onClose={() => setIsConfirmarModalOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>Productos a pedir:</p>
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

                    {/* Selector de sucursal - Solo mostrar si no estamos editando */}
                    {!pedidoId && (
                        <div className={styles.content} style={{ padding: '10px 15px' }}>
                            <Select
                                value={sucursalSeleccionada}
                                onChange={setSucursalSeleccionada}
                                options={sucursales}
                                placeholder='Sucursal de destino (obligatorio)'
                                disabled={loadingSucursales}
                                icon='building'
                            />
                        </div>
                    )}

                    <div className={styles.observacionesGenerales}>
                        <InputNormal
                            tipo="text"
                            value={observacionesGenerales}
                            placeholder="Observaciones del pedido"
                            onChange={(e) => setObservacionesGenerales(e.target.value)}
                        />
                    </div>
                    
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-original'
                            label={pedidoId ? 'Actualizar Pedido' : 'Confirmar Pedido'}
                            onClick={handleConfirmarPedido}
                            loading={loadingConfirmar}
                        />
                    </div>
                </div>
            </ViewModal>

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default CanastaPedidos;