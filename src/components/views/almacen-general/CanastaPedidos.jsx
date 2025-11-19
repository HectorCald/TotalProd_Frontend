import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import InputNormal from '../../common/InputNormal';
import Select from '../../common/Select';
import SelectorSucursal from '../../mixed/SelectorSucursal';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import sucursalesService from '../../../services/sucursalesService';
import Notification from '../../common/Notification';
import { useUser } from '../../../context/UserContext';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import useCanastaProductos from './hooks/useCanastaProductos';
import usePedidoEdicion from './hooks/usePedidoEdicion';
import usePrecioCanasta from './hooks/usePrecioCanasta';
import { useLayout } from '../../../context/LayoutContext';

function CanastaPedidos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, pedidoId = null, onPedidoActualizado = null, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const { sucursalSeleccionada: sucursalActual } = useUser();
    const { isLargeScreen } = useLayout();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
    const [sucursalSeleccionadaData, setSucursalSeleccionadaData] = useState(null);

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
        clearEdicionStorage
    } = usePedidoEdicion({
        pedidoId,
        isOpen
    });

    // Hook para manejar la lógica de precios de pedidos
    const {
        resolvePrecioInicial,
        resolveModoInicial
    } = usePrecioCanasta({
        tipoCanasta: 'pedido',
        esEntrega: false,
        isOpen,
        precioSeleccionado: null, // Se actualizará después
        isEditing,
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

        // Para pedidos y entradas, NO validar stock ni ajustar cantidad
        // Solo actualizar el stock para mostrar información actualizada
        if (productoActualizado.stock !== undefined && productoActualizado.stock !== productoCarrito.stock) {
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
    }, []);

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

    // Obtener empresa actual y empresas asociadas
    const empresaIdActual = sucursalActual?.empresas?.id;
    const empresasAsociadas = useMemo(() => {
        try {
            const FAVORITES_KEY = 'empresas_favoritas';
            const stored = localStorage.getItem(FAVORITES_KEY);
            if (stored) {
                const parsed = JSON.parse(stored);
                return Array.isArray(parsed) ? parsed : [];
            }
            return [];
        } catch (error) {
            console.error('Error al obtener empresas favoritas:', error);
            return [];
        }
    }, []);

    // Función para obtener empresa_id de los productos en la canasta
    const obtenerEmpresaIdDeProductos = useCallback(() => {
        if (!productosCanasta || productosCanasta.length === 0) return null;
        
        // Obtener empresa_id del primer producto
        const primerProducto = productosCanasta[0];
        if (primerProducto.es_asociado === true) {
            // Si es asociado, obtener empresa_id del producto
            return primerProducto.empresa_id || null;
        } else {
            // Si no es asociado, es de la empresa actual
            return empresaIdActual;
        }
    }, [productosCanasta, empresaIdActual]);

    // Handler para cuando se selecciona una sucursal
    const handleSucursalChange = useCallback((sucursalId) => {
        setSucursalSeleccionada(sucursalId);
        
        // Obtener datos de la sucursal seleccionada desde el servicio
        if (sucursalId && empresaIdActual) {
            sucursalesService.getByEmpresaId(empresaIdActual).then(response => {
                if (response.success && response.data) {
                    const sucursalEncontrada = response.data.find(s => s.id === sucursalId);
                    if (sucursalEncontrada) {
                        setSucursalSeleccionadaData({
                            id: sucursalEncontrada.id,
                            empresa_id: sucursalEncontrada.empresas?.id || null
                        });
                    }
                }
            }).catch(() => {
                // Si falla, intentar obtener desde las opciones del SelectorSucursal
                // El SelectorSucursal maneja esto internamente
            });
        }
    }, [empresaIdActual]);

    // Guardar valores en localStorage cuando cambian
    useEffect(() => {
        if (sucursalSeleccionada && !pedidoId) {
            localStorage.setItem('sucursalPedidoGuardada', sucursalSeleccionada);
        }
    }, [sucursalSeleccionada, pedidoId]);



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

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaPedidos');
        // Limpiar valores guardados
        localStorage.removeItem('sucursalPedidoGuardada');
        setSucursalSeleccionada('');
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

            // Validar compatibilidad de empresa
            const empresaIdProductos = obtenerEmpresaIdDeProductos();
            if (empresaIdProductos) {
                // Obtener empresa_id de la sucursal seleccionada
                const response = await sucursalesService.getByEmpresaId(empresaIdActual);
                if (response.success && response.data) {
                    const sucursalEncontrada = response.data.find(s => s.id === sucursalSeleccionada);
                    if (sucursalEncontrada) {
                        const empresaIdSucursal = sucursalEncontrada.empresas?.id;
                        if (empresaIdSucursal && empresaIdSucursal !== empresaIdProductos) {
                            mostrarNotificacion('error', 'La sucursal de destino no tiene los productos requeridos para pedir');
                            setLoadingConfirmar(false);
                            return;
                        }
                    }
                }
            }

            // Preparar datos para enviar al backend
            const pedidoData = {
                observaciones: observacionesGenerales || null,
                precio_id: precioSeleccionado,
                sucursal_destino_id: sucursalSeleccionada,
                agrupado: modoAgrupacion === 'agrupado',
                productos: prepararProductos()
            };

            // Crear nuevo pedido
            const response = await pedidosAlmacenService.create(pedidoData);

            if (response.success) {
                // Obtener el ID del pedido creado
                const pedidoIdCreado = response.data?.id || null;

                // Limpiar la canasta
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setSucursalSeleccionada('');

                // Limpiar localStorage
                localStorage.removeItem('canastaPedidos');

                // Cerrar canasta y mostrar notificación
                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta(pedidoIdCreado);
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
                productos: prepararProductos()
            };

            // Actualizar pedido existente
            const response = await pedidosAlmacenService.update(pedidoId, pedidoData);

            if (response.success) {
                // Obtener el ID del pedido actualizado
                const pedidoIdActualizado = response.data?.id || pedidoId;

                // Notificar al componente padre sobre la actualización
                if (onPedidoActualizado) {
                    onPedidoActualizado(response.data);
                }

                // Limpiar la canasta
                setProductosCanasta([]);
                setObservacionesGenerales('');

                // Limpiar localStorage
                localStorage.removeItem('canastaPedidos');
                clearEdicionStorage();

                // Cerrar canasta y mostrar notificación
                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta(pedidoIdActualizado);
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
                            {/* Selector de sucursal - Solo mostrar si no estamos editando */}
                            {!pedidoId && (
                                <SelectorSucursal
                                    value={sucursalSeleccionada}
                                    onChange={handleSucursalChange}
                                    placeholder='Sucursal de destino (obligatorio)'
                                    excludeCurrentSucursal={true}
                                    openUpward={true}
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

            <Notification isVisible={notification.isVisible} type={notification.type} text={notification.text} />
        </View>
    );
}

export default CanastaPedidos;