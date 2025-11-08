import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import Clientes from '../clientes/Clientes';
import Notification from '../../common/Notification';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import deudasService from '../../../services/deudasService';
import InputNormal from '../../common/InputNormal';
import useCanastaProductos from './hooks/useCanastaProductos';
import useEntregaMovimientos from './hooks/useEntregaMovimientos';

function CanastaMovimientos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, esEntrega = false, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false, onPedidoActualizado = null, isEditandoMovimiento = false, movimientoIdEditando = null, onMovimientoEditado = null }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [descuento, setDescuento] = useState('');
    const [aumento, setAumento] = useState('');

    // Estados para clientes y método de pago (solo para salidas)
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);
    // Estados para cliente del pedido (en entregas)
    const [clientePedidoData, setClientePedidoData] = useState(null);
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
        }, 4000);
    };
    // Referencias para el auto-focus en inputs de cantidad
    const resolveRepeticionPrecioInicial = useCallback((tipos) => {
        if (!tipos || tipos.length === 0) return null;
        const precioIdRepitiendo = localStorage.getItem('precioIdRepitiendo') || localStorage.getItem('precioIdEditando');
        if (precioIdRepitiendo && tipos.find(p => p.value === precioIdRepitiendo)) {
            return precioIdRepitiendo;
        }
        return tipos[0]?.value ?? null;
    }, []);

    const resolveRepeticionModoInicial = useCallback(() => {
        const modoMovimiento = localStorage.getItem('movimientoAgrupadoRepitiendo') || localStorage.getItem('movimientoAgrupadoEditando');
        if (modoMovimiento === 'agrupado' || modoMovimiento === 'no_agrupado') {
            return modoMovimiento;
        }
        return null;
    }, []);

    const {
        pedidoIdEntregando,
        precioIdEntregando,
        clienteEntregando,
        metodoPagoEntregando,
        modoAgrupacionEntregando,
        applyEntregaPrecioInicial,
        clearEntregaTemporal
    } = useEntregaMovimientos({
        esEntrega,
        isOpen
    });

    const syncProductoSalida = useCallback(({
        productoCarrito,
        productoActualizado,
        modoAgrupacion,
        precioSeleccionado,
        obtenerPrecioPorTipo
    }) => {
        const stockOriginal = productoActualizado.stock ?? 0;
        const stockCambio = stockOriginal !== productoCarrito.stockOriginal;

        const productoModificado = {
            ...productoCarrito,
            stockOriginal
        };

        let stockMostrado = stockOriginal;
        if (modoAgrupacion === 'agrupado' && productoCarrito.grup) {
            stockMostrado = Math.floor(stockOriginal / (productoCarrito.grup || 1));
        }
        productoModificado.stock = stockMostrado;

        if (stockMostrado <= 0) {
            mostrarNotificacion('warning', `Se eliminaron algunos productos porque no hay stock disponible`);
            return null;
        }

        if (productoCarrito.cantidad > stockMostrado) {
            if (stockCambio) {
                mostrarNotificacion('warning', `Se ajustó la cantidad de algunos productos para que no excedan el stock disponible`);
            }
            productoModificado.cantidad = stockMostrado;
        }

        if (productoActualizado.price_product && precioSeleccionado) {
            const precioFinal = obtenerPrecioPorTipo(
                { ...productoCarrito, price_product: productoActualizado.price_product },
                precioSeleccionado,
                modoAgrupacion
            );
            productoModificado.precio = precioFinal;
            productoModificado.price_product = productoActualizado.price_product;
        }

        return productoModificado;
    }, [mostrarNotificacion]);

    const resolvePrecioInicial = useCallback((tipos) => {
        if (!tipos || tipos.length === 0) return null;
        if (esEntrega) {
            return applyEntregaPrecioInicial(tipos) ?? tipos[0].value ?? null;
        }
        return resolveRepeticionPrecioInicial(tipos);
    }, [applyEntregaPrecioInicial, esEntrega, resolveRepeticionPrecioInicial]);

    const resolveModoInicial = useCallback(() => {
        if (esEntrega) {
            return modoAgrupacionEntregando || null;
        }
        return resolveRepeticionModoInicial();
    }, [esEntrega, modoAgrupacionEntregando, resolveRepeticionModoInicial]);

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
        prepararProductos
    } = useCanastaProductos({
        isOpen,
        productosCanasta,
        setProductosCanasta,
        preciosTipos,
        productosActualizados,
        localStorageKey: 'canastaSalidas',
        shouldPersistLocalStorage: true,
        persistWhenEmpty: false,
        shouldLoadLocalStorage: true,
        resolveInitialPrecioId: resolvePrecioInicial,
        resolveInitialModoAgrupacion: resolveModoInicial,
        exposeGlobals: {
            precioGetterName: 'getPrecioSeleccionadoCanastaMovimientos',
            modoGetterName: 'getModoAgrupacionCanastaMovimientos'
        },
        isCartMode,
        onSyncProducto: syncProductoSalida,
        onAfterModoAgrupacionChange: ({ producto, cantidadNueva }) => {
            if (producto && producto.name && cantidadNueva !== undefined) {
                mostrarNotificacion('warning', `Se ajustó la cantidad de ${producto.name} para que no exceda el stock disponible`);
            } else {
                mostrarNotificacion('warning', `Se ajustó la cantidad de algunos productos para que no excedan el stock disponible`);
            }
        }
    });

    useEffect(() => {
        if (!esEntrega || !isOpen) return;
        if (clienteEntregando) {
            setClienteSeleccionado(clienteEntregando.id);
            setClienteSeleccionadoData(clienteEntregando);
            setClientePedidoData(clienteEntregando);
        } else {
            setClienteSeleccionado('');
            setClienteSeleccionadoData(null);
            setClientePedidoData(null);
        }
    }, [clienteEntregando, esEntrega, isOpen]);

    useEffect(() => {
        if (!esEntrega || !isOpen) return;
        if (metodoPagoEntregando) {
            setMetodoPagoSeleccionado(metodoPagoEntregando);
        }
    }, [esEntrega, isOpen, metodoPagoEntregando]);

    useEffect(() => {
        if (!esEntrega || !isOpen) return;
        if (precioIdEntregando) {
            setPrecioSeleccionado(precioIdEntregando);
        }
    }, [esEntrega, isOpen, precioIdEntregando, setPrecioSeleccionado]);

    useEffect(() => {
        if (!esEntrega || !isOpen) return;
        if (modoAgrupacionEntregando) {
            setModoAgrupacion(modoAgrupacionEntregando);
        }
    }, [esEntrega, isOpen, modoAgrupacionEntregando, setModoAgrupacion]);

    useEffect(() => {
        if (isOpen && !esEntrega) {
            const descuentoRepitiendo = localStorage.getItem('descuentoMovimientoRepitiendo') || localStorage.getItem('descuentoMovimientoEditando');
            const aumentoRepitiendo = localStorage.getItem('aumentoMovimientoRepitiendo') || localStorage.getItem('aumentoMovimientoEditando');

            setDescuento(descuentoRepitiendo ?? '');
            setAumento(aumentoRepitiendo ?? '');
        } else if (!isOpen && !esEntrega) {
            setDescuento('');
            setAumento('');
        }
    }, [esEntrega, isOpen]);

    // Cargar información del cliente del movimiento cuando es una repetición
    useEffect(() => {
        if (isOpen && !esEntrega) {
            const clienteId = localStorage.getItem('clienteIdRepitiendo') || localStorage.getItem('clienteIdEditando');
            const clienteName = localStorage.getItem('clienteNameRepitiendo') || localStorage.getItem('clienteNameEditando');

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
        } else if (!isOpen && !esEntrega) {
            setClienteSeleccionadoData(null);
            setClienteSeleccionado('');
        }
    }, [esEntrega, isOpen]);

    // Cargar método de pago del movimiento cuando es una repetición
    useEffect(() => {
        if (isOpen && !esEntrega) {
            const metodoPago = localStorage.getItem('metodoPagoRepitiendo') || localStorage.getItem('metodoPagoEditando');
            if (metodoPago) {
                setMetodoPagoSeleccionado(metodoPago);
            }
        } else if (!isOpen && !esEntrega) {
            setMetodoPagoSeleccionado('');
        }
    }, [esEntrega, isOpen]);

    // Cargar datos de cotización cuando se está realizando una venta
    useEffect(() => {
        if (isOpen && localStorage.getItem('productosCotizacionVendiendo')) {
            // Cargar precio de la cotización
            const precioIdCotizacion = localStorage.getItem('precioIdCotizacionVendiendo');
            if (precioIdCotizacion) {
                setPrecioSeleccionado(precioIdCotizacion);
            }

            // Cargar modalidad de la cotización
            const modalidadCotizacion = localStorage.getItem('cotizacionAgrupadoVendiendo');
            if (modalidadCotizacion === 'agrupado' || modalidadCotizacion === 'no_agrupado') {
                setModoAgrupacion(modalidadCotizacion);
            }

            // Cargar cliente de la cotización
            const clienteIdCotizacion = localStorage.getItem('clienteIdCotizacionVendiendo');
            const clienteNameCotizacion = localStorage.getItem('clienteNameCotizacionVendiendo');
            if (clienteIdCotizacion && clienteNameCotizacion) {
                setClienteSeleccionadoData({
                    id: clienteIdCotizacion,
                    name: clienteNameCotizacion
                });
                setClienteSeleccionado(clienteIdCotizacion);
            }
        }
    }, [isOpen]);

    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }

        // Obtener el producto actual para validar el stock
        const productoActual = productosCanasta.find(p => p.id === productoId);
        if (!productoActual) return;

        // Validar que no exceda el stock disponible (solo para salidas)
        const stockParaValidar = (modoAgrupacion === 'agrupado' && productoActual.grup)
            ? productoActual.stock
            : (productoActual.stockOriginal || productoActual.stock);
        if (nuevaCantidad > stockParaValidar) {
            console.warn(`No se puede exceder el stock disponible: ${stockParaValidar}`);
            mostrarNotificacion('error', 'No se puede exceder el stock disponible');
            return; // No actualizar si excede el stock
        }

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

    const handleClienteSeleccionado = (cliente) => {
        setClienteSeleccionadoData(cliente);
        setClienteSeleccionado(cliente.id);
        setIsClientesSeleccionOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        localStorage.removeItem('canastaSalidas');
        localStorage.removeItem('descuentoMovimientoRepitiendo');
        localStorage.removeItem('aumentoMovimientoRepitiendo');
        localStorage.removeItem('descuentoMovimientoEditando');
        localStorage.removeItem('aumentoMovimientoEditando');
        setDescuento('');
        setAumento('');
        setClienteSeleccionado('');
        setClienteSeleccionadoData(null);
        if (isEditandoMovimiento && movimientoIdEditando) {
            localStorage.removeItem('movimientoIdEditando');
        }
        localStorage.removeItem('productosEdicion');
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    // Validaciones: para salidas/metodo de pago y crédito
    const validarMovimiento = () => {
        // VALIDAR STOCK ANTES DE CUALQUIER OTRA VALIDACIÓN (este componente es solo para salidas)
        const productosSinStock = productosCanasta.filter(producto => {
            const stockDisponible = producto.stockOriginal || producto.stock || 0;
            const cantidadRequerida = producto.cantidad || 0;

            // Si está en modo agrupado y el producto tiene grupo, convertir a unidades
            let cantidadEnUnidades = cantidadRequerida;
            if (modoAgrupacion === 'agrupado' && producto.grup && producto.grup > 0) {
                cantidadEnUnidades = cantidadRequerida * producto.grup;
            }

            return stockDisponible < cantidadEnUnidades;
        });

        if (productosSinStock.length > 0) {
            const nombresProductos = productosSinStock.map(p => p.name).join(', ');
            mostrarNotificacion('error', `STOCK INSUFICIENTE: Los siguientes productos no tienen stock suficiente: ${nombresProductos}`);
            return false;
        }

        if (!metodoPagoSeleccionado) {
            mostrarNotificacion('error', 'El método de pago es obligatorio');
            return false;
        }

        if (metodoPagoSeleccionado === 'credito' && !esEntrega && !clienteSeleccionado) {
            mostrarNotificacion('error', 'El cliente es obligatorio para ventas a crédito');
            return false;
        }

        // Para entregas, validar que haya un cliente si es crédito (del pedido o seleccionado)
        if (metodoPagoSeleccionado === 'credito' && esEntrega && !clientePedidoData && !clienteSeleccionadoData) {
            mostrarNotificacion('error', 'Debe seleccionar un cliente para venta a crédito');
            return false;
        }

        return true;
    };

    const handleConfirmar = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar movimiento
            if (!validarMovimiento()) {
                setLoadingConfirmar(false);
                return;
            }

            const fechaMovimientoEditando = isEditandoMovimiento ? localStorage.getItem('fechaMovimientoEditando') : null;

            if (isEditandoMovimiento && movimientoIdEditando) {
                const anulacionResp = await movimientosAlmacenService.anular(movimientoIdEditando);
                if (!anulacionResp?.success) {
                    const mensajeError = anulacionResp?.message || 'Error al anular el movimiento anterior';
                    mostrarNotificacion('error', mensajeError);
                    setLoadingConfirmar(false);
                    return;
                }

                const eliminacionResp = await movimientosAlmacenService.eliminar(movimientoIdEditando);
                if (!eliminacionResp?.success) {
                    const mensajeEliminar = eliminacionResp?.message || 'Error al eliminar el movimiento anterior';
                    mostrarNotificacion('error', mensajeEliminar);
                    setLoadingConfirmar(false);
                    return;
                }
            }

            let pedidoActualizado = null;
            let pedidoId = null;
            let movimientoId = null;

            // 1) Si es entrega: actualizar pedido primero
            let numeroPedido = null;
            if (esEntrega) {
                pedidoId = pedidoIdEntregando || localStorage.getItem('pedidoIdEntregando');
                if (!pedidoId) {
                    mostrarNotificacion('error', 'No se encontró el ID del pedido');
                    setLoadingConfirmar(false);
                    return;
                }

                const pedidoData = {
                    productos: prepararProductos(),
                    observaciones: observacionesGenerales || null,
                    precio_id: precioSeleccionado,
                    agrupado: modoAgrupacion === 'agrupado'
                };
                pedidoActualizado = await pedidosAlmacenService.update(pedidoId, pedidoData);

                // Obtener el numero_pedido del pedido actualizado
                if (pedidoActualizado?.data?.numero_pedido !== undefined) {
                    numeroPedido = pedidoActualizado.data.numero_pedido;
                }

                // Notificar al componente padre sobre la actualización del pedido
                if (onPedidoActualizado && pedidoActualizado?.data) {
                    onPedidoActualizado(pedidoActualizado.data);
                }
            }


            // 2) Crear o actualizar movimiento de salida
            const observacionesFinales = esEntrega
                ? (observacionesGenerales
                    ? `Entrega del pedido Nº ${numeroPedido || 'N/A'} - ${observacionesGenerales}`
                    : `Entrega del pedido Nº ${numeroPedido || 'N/A'}`)
                : (observacionesGenerales || null);

            // Crear nuevo movimiento
            const movimientoData = {
                type: 'salida',
                observaciones: observacionesFinales,
                precio_id: precioSeleccionado,
                metodo_pago: metodoPagoSeleccionado,
                cliente_id: esEntrega ? (clienteSeleccionadoData?.id || clientePedidoData?.id || null) : (clienteSeleccionado || null),
                proveedor_id: null,
                restar_ingredientes: false,
                agrupado: modoAgrupacion === 'agrupado',
                descuento: parseFloat(descuento) || 0,
                aumento: parseFloat(aumento) || 0,
                productos: prepararProductos(),
                ...(fechaMovimientoEditando ? { fecha: fechaMovimientoEditando } : {})
            };
            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);
            movimientoId = (movimientoResponse && movimientoResponse.success) ? movimientoResponse.data?.id : null;

            if (movimientoId) {
                // Actualizar stock EN FRONT
                const productosEnUnidades = prepararProductos();
                const productosStockActualizados = productosEnUnidades.map(pu => {
                    const prodActual = (productosActualizados || []).find(p => p.id === pu.id);
                    const stockBase = prodActual ? (prodActual.stock || 0) : 0;
                    const nuevoStock = Math.max(0, stockBase - pu.cantidad); // salida resta stock
                    return { id: pu.id, stock: nuevoStock };
                });
                if (onProductosUpdated) {
                    onProductosUpdated(productosStockActualizados);
                }

                // 3) Si es crédito: crear o actualizar deuda
                if (metodoPagoSeleccionado === 'credito') {
                    try {
                        const subtotalMovimiento = productosCanasta.reduce((total, producto) => {
                            const valorProducto = (producto.precio || 0) * producto.cantidad;
                            return total + valorProducto;
                        }, 0);
                        const descuentoValue = parseFloat(descuento) || 0;
                        const aumentoValue = parseFloat(aumento) || 0;
                        const totalMovimiento = subtotalMovimiento - descuentoValue + aumentoValue;
                        const fechaDeudaBase = (() => {
                            if (fechaMovimientoEditando) {
                                const fechaParsed = new Date(fechaMovimientoEditando);
                                if (!isNaN(fechaParsed.getTime())) {
                                    return fechaParsed.toISOString().split('T')[0];
                                }
                            }
                            return new Date().toISOString().split('T')[0];
                        })();
                        let concepto = 'Venta a crédito';
                        let destinoSucursalId = null;

                        // Si es entrega, usar datos del pedido
                        if (esEntrega) {
                            const sucursalOrigenName = localStorage.getItem('pedidoDestinoSucursalName');
                            concepto = sucursalOrigenName ? `Pedido Nº ${numeroPedido || 'N/A'} - ${sucursalOrigenName}` : `Pedido Nº ${numeroPedido || 'N/A'}`;
                            destinoSucursalId = localStorage.getItem('pedidoDestinoSucursalId');
                        }

                        // Crear nueva deuda
                        const deudaData = {
                            fecha_deuda: fechaDeudaBase,
                            fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            monto_total: totalMovimiento,
                            saldo_pendiente: totalMovimiento,
                            concepto: concepto,
                            estado: 'pendiente',
                            cliente_id: esEntrega ? (clienteSeleccionadoData?.id || clientePedidoData?.id || null) : (clienteSeleccionado || null),
                            movimiento_salida_id: movimientoId,
                            destino_sucursal_id: destinoSucursalId
                        };

                        const deudaResponse = await deudasService.create(deudaData);
                        if (deudaResponse.success) {
                            // Actualizar el movimiento con el deuda_id
                            try {
                                await movimientosAlmacenService.update(movimientoId, { deuda_id: deudaResponse.data.id });
                            } catch (updateError) {
                                console.warn('Error al actualizar movimiento con deuda_id:', updateError);
                            }
                        } else {
                            mostrarNotificacion('warning', `Movimiento creado, pero error al registrar deuda: ${deudaResponse.message}`);
                        }
                    } catch (deudaError) {
                        mostrarNotificacion('warning', `Movimiento creado, pero error al registrar deuda automática`);
                    }
                }

                // 4) Si es entrega: actualizar estado del pedido
                if (esEntrega) {
                    const deudaId = null; // Se podría obtener del paso anterior si es necesario
                    let pedidoResponse = null;

                    try {
                        pedidoResponse = await pedidosAlmacenService.updateEstado(pedidoId, 'Entregado', movimientoId, deudaId);
                        if (!pedidoResponse.success) {
                            console.error('Error al actualizar estado del pedido:', pedidoResponse.message);
                        }
                    } catch (error) {
                        console.error('Error al actualizar estado del pedido:', error);
                    }

                    // Limpiar localStorage específico de entregas (excepto pedidoIdEntregando que se mantiene hasta cerrar el almacén)
                    localStorage.removeItem('pedidoDestinoSucursalId');
                    localStorage.removeItem('pedidoDestinoSucursalName');
                    localStorage.removeItem('precioIdEntregando');
                    // NO limpiar pedidoIdEntregando aquí - se limpiará cuando se cierre el almacén manualmente

                    // Notificar al componente padre sobre el cambio de estado del pedido
                    if (onPedidoActualizado && pedidoResponse && pedidoResponse.success) {
                        // Usar la respuesta del servidor que incluye total_pedidos actualizado
                        const pedidoConEstadoActualizado = {
                            ...pedidoResponse.data,
                            movimiento_salida: {
                                id: movimientoId,
                                metodo_pago: metodoPagoSeleccionado
                            }
                        };
                        onPedidoActualizado(pedidoConEstadoActualizado);
                    }
                }

                // Limpiar canasta y cerrar
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setClienteSeleccionado('');
                setMetodoPagoSeleccionado('');
                localStorage.removeItem('canastaSalidas');

                // Limpiar variables específicas de entrega o repetición
                if (esEntrega) {
                    clearEntregaTemporal();
                }
                localStorage.removeItem('precioIdRepitiendo');
                localStorage.removeItem('movimientoAgrupadoRepitiendo');
                localStorage.removeItem('clienteIdRepitiendo');
                localStorage.removeItem('clienteNameRepitiendo');
                localStorage.removeItem('metodoPagoRepitiendo');
                // Claves antiguas (compatibilidad)
                localStorage.removeItem('precioIdEditando');
                localStorage.removeItem('movimientoAgrupadoEditando');
                localStorage.removeItem('clienteIdEditando');
                localStorage.removeItem('clienteNameEditando');
                localStorage.removeItem('metodoPagoEditando');
                localStorage.removeItem('descuentoMovimientoRepitiendo');
                localStorage.removeItem('aumentoMovimientoRepitiendo');
                localStorage.removeItem('descuentoMovimientoEditando');
                localStorage.removeItem('aumentoMovimientoEditando');
                localStorage.removeItem('fechaMovimientoEditando');
                if (isEditandoMovimiento && movimientoIdEditando) {
                    localStorage.removeItem('movimientoIdEditando');
                }
                localStorage.removeItem('productosEdicion');

                // Solo cerrar la canasta en móvil, no en PC (modo carrito)
                // En PC (isCartMode && isLargeScreen), mantener abierto para mostrar modal de descarga
                if (!isCartMode) {
                    setIsOpen(false);
                }

                if (onCerrarCanasta) {
                    onCerrarCanasta(productosStockActualizados, precioSeleccionado, movimientoId, pedidoActualizado);
                }

        if (!isEditandoMovimiento && onMovimientoEditado) {
            onMovimientoEditado(movimientoId, movimientoIdEditando);
        }
            } else {
                mostrarNotificacion('error', 'Error al crear el movimiento');
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
            {!isCartMode && <HeaderView onBack={() => setIsOpen(false)} />}
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                <h1 className={styles.title}>Canasta de Salidas
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
                        onChange={cambiarTipoPrecio}
                        options={preciosTipos}
                        placeholder="Precio"
                        disabled={loadingPrecios}
                        icon='dollar'
                    />

                    {productosCanasta.some(producto => producto.grup) && (
                        <Select
                            value={modoAgrupacion}
                            onChange={cambiarModoAgrupacion}
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
                                                    max={(modoAgrupacion === 'agrupado' && producto.grup)
                                                        ? producto.stock
                                                        : (producto.stockOriginal || producto.stock)}
                                                    onChange={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        if (nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        } else if (nuevaCantidad > ((modoAgrupacion === 'agrupado' && producto.grup)
                                                            ? producto.stock
                                                            : (producto.stockOriginal || producto.stock))) {
                                                            // Si excede el stock, ajustar al stock máximo
                                                            const stockMaximo = (modoAgrupacion === 'agrupado' && producto.grup)
                                                                ? producto.stock
                                                                : (producto.stockOriginal || producto.stock);
                                                            handleActualizarCantidad(producto.id, stockMaximo, false);
                                                        }
                                                    }}
                                                />
                                            </motion.span>
                                            <button
                                                className={styles.btnCantidad}
                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}
                                                disabled={producto.cantidad >= ((modoAgrupacion === 'agrupado' && producto.grup)
                                                    ? producto.stock
                                                    : (producto.stockOriginal || producto.stock))}
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
                            {/* Controles específicos para salidas */}
                            {(
                                <>
                                    {/* Selector de cliente para salidas */}
                                    <Boton
                                        className='btn-gray'
                                        label={esEntrega
                                            ? (clientePedidoData ? `Cliente del Pedido: ${clientePedidoData.name}` : 'Seleccionar Cliente')
                                            : (clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name :
                                                (metodoPagoSeleccionado === 'credito' ? 'Seleccionar Cliente (obligatorio)' : 'Seleccionar Cliente (opcional)'))
                                        }
                                        onClick={() => setIsClientesSeleccionOpen(true)}
                                        style={{
                                            marginTop: 'auto',
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            ...(metodoPagoSeleccionado === 'credito' && !clienteSeleccionadoData && !esEntrega ? { borderColor: '#e74c3c', color: '#e74c3c' } : {})
                                        }}
                                    />

                                    <div className={styles.horizontal}>
                                        <InputNormal
                                            placeholder="Descuento"
                                            tipo="number"
                                            step="0.01" min="0"
                                            value={descuento}
                                            onChange={(e) => setDescuento(e.target.value)}
                                            icon='trending-down'
                                        />
                                        <InputNormal
                                            placeholder="Aumento"
                                            tipo="number"
                                            step="0.01" min="0"
                                            value={aumento}
                                            onChange={(e) => setAumento(e.target.value)}
                                            icon='trending-up'
                                        />
                                    </div>

                                    {/* Selector de método de pago para salidas */}
                                    <SelectorMetodoPago
                                        value={metodoPagoSeleccionado}
                                        onChange={setMetodoPagoSeleccionado}
                                    />


                                </>
                            )}
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                <span className={styles.totalGeneralLabel}>Total:</span>
                                <span className={styles.totalGeneralValue}>Bs. {(() => {
                                    const subtotal = productosCanasta.reduce((total, producto) => {
                                        const valorProducto = (producto.precio || 0) * producto.cantidad;
                                        return total + valorProducto;
                                    }, 0);
                                    const descuentoValue = parseFloat(descuento) || 0;
                                    const aumentoValue = parseFloat(aumento) || 0;
                                    const total = subtotal - descuentoValue + aumentoValue;
                                    return total.toFixed(2);
                                })()}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={esEntrega ? 'Entregar Pedido' : (isEditandoMovimiento ? 'Actualizar Movimiento' : 'Confirmar Salida')}
                                onClick={handleConfirmar}
                                loading={loadingConfirmar}
                                disabled={
                                    // Deshabilitar si es salida a crédito sin cliente (excepto entregas)
                                    metodoPagoSeleccionado === 'credito' &&
                                    !esEntrega &&
                                    !clienteSeleccionado
                                }
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear salidas</p>
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

export default CanastaMovimientos;