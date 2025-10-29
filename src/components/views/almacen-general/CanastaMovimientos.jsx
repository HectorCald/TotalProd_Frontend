import React, { useState, useEffect, useRef } from 'react';
import styles from './CanastaMovimientos.module.css';
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

function CanastaMovimientos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, esEntrega = false, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false, onPedidoActualizado = null }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [modoAgrupacion, setModoAgrupacion] = useState('agrupado'); // 'agrupado' o 'no_agrupado'

    // Estados para clientes y método de pago (solo para salidas)
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);
    const [descuento, setDescuento] = useState('');
    const [aumento, setAumento] = useState('');
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
            // Verificar si hay un precio específico guardado para entregas
            if (esEntrega) {
                const precioIdEntregando = localStorage.getItem('precioIdEntregando');
                if (precioIdEntregando && preciosTipos.find(p => p.value === precioIdEntregando)) {
                    setPrecioSeleccionado(precioIdEntregando);
                } else if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            } else {
                // Para repeticiones de movimientos, verificar precioIdEditando
                const precioIdEditando = localStorage.getItem('precioIdEditando');
                if (precioIdEditando && preciosTipos.find(p => p.value === precioIdEditando)) {
                    setPrecioSeleccionado(precioIdEditando);
                } else if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            }
        }
    }, [isOpen, preciosTipos, esEntrega, precioSeleccionado]);

    // Inicializar modo de agrupación desde el pedido al abrir en entrega
    useEffect(() => {
        if (isOpen && esEntrega) {
            const modoPedido = localStorage.getItem('pedidoAgrupadoEntregando');
            if (modoPedido === 'agrupado' || modoPedido === 'no_agrupado') {
                setModoAgrupacion(modoPedido);
            }
        }
    }, [isOpen, esEntrega]);

    // Inicializar modo de agrupación desde el movimiento al abrir en repetición
    useEffect(() => {
        if (isOpen) {
            const modoMovimiento = localStorage.getItem('movimientoAgrupadoEditando');
            if (modoMovimiento === 'agrupado' || modoMovimiento === 'no_agrupado') {
                setModoAgrupacion(modoMovimiento);
            }
        }
    }, [isOpen]);

    // Cargar información del cliente del pedido cuando es una entrega
    useEffect(() => {
        if (isOpen && esEntrega) {
            const clienteId = localStorage.getItem('clienteIdEntregando');
            const clienteName = localStorage.getItem('clienteNameEntregando');

            if (clienteId && clienteName) {
                setClientePedidoData({
                    id: clienteId,
                    name: clienteName
                });
            } else {
                setClientePedidoData(null);
            }
        }
    }, [isOpen, esEntrega]);

    // Cargar información del cliente del movimiento cuando es una repetición
    useEffect(() => {
        if (isOpen) {
            const clienteId = localStorage.getItem('clienteIdEditando');
            const clienteName = localStorage.getItem('clienteNameEditando');

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
        }
    }, [isOpen]);

    // Cargar método de pago del movimiento cuando es una repetición
    useEffect(() => {
        if (isOpen) {
            const metodoPago = localStorage.getItem('metodoPagoEditando');
            if (metodoPago) {
                setMetodoPagoSeleccionado(metodoPago);
            }
        }
    }, [isOpen]);

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

    // Guardar en localStorage cuando cambie la canasta (solo salidas)
    useEffect(() => {
        if (productosCanasta.length > 0) {
            localStorage.setItem('canastaSalidas', JSON.stringify(productosCanasta));
        }
        // NO remover del localStorage aquí para evitar que se borre al recargar la página
        // La limpieza se maneja en las funciones específicas
    }, [productosCanasta, esEntrega]);

    // Cargar canasta desde localStorage al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const canastaGuardada = localStorage.getItem('canastaSalidas');
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
                const canastaActualizada = prevCanasta
                    .map(productoCarrito => {
                        const productoActualizado = productosActualizados.find(p => p.id === productoCarrito.id);
                        if (productoActualizado) {
                            let productoModificado = { ...productoCarrito };

                            // Verificar si el stock cambió ANTES de actualizar
                            const stockCambio = productoActualizado.stock !== productoCarrito.stockOriginal;

                            // Actualizar el stockOriginal con el stock del backend (siempre, no solo cuando cambia)
                            productoModificado.stockOriginal = productoActualizado.stock;

                            // Recalcular el stock mostrado según el modo de agrupación actual
                            let stockMostrado = 0;
                            if (modoAgrupacion === 'agrupado' && productoCarrito.grup) {
                                stockMostrado = Math.floor(productoActualizado.stock / productoCarrito.grup);
                            } else {
                                stockMostrado = productoActualizado.stock;
                            }
                            productoModificado.stock = stockMostrado;

                            // Verificar si debe eliminarse (stock 0 o negativo, o cantidad mayor al stock disponible)
                            if (stockMostrado <= 0) {
                                // Si el stock es 0 o menor, eliminar del carrito
                                mostrarNotificacion('warning', `Se eliminaron algunos productos porque no hay stock disponible`);
                                return null; // Retornar null para eliminar
                            } else if (productoCarrito.cantidad > stockMostrado) {
                                // Si la cantidad excede el stock disponible, ajustar
                                if (stockCambio) {
                                    mostrarNotificacion('warning', `Se ajusto la cantidad de algunos productos para que no excedan el stock disponible`);
                                }
                                productoModificado.cantidad = stockMostrado;
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
                    })
                    .filter(producto => producto !== null && producto.cantidad > 0); // Filtrar productos eliminados (null) y productos con cantidad 0

                return canastaActualizada;
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
                    mostrarNotificacion('warning', `Se ajusto la cantidad de algunos productos para que no excedan el stock disponible`);
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
        localStorage.removeItem('canastaSalidas');
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

            let pedidoActualizado = null;
            let pedidoId = null;
            let movimientoId = null;

            // 1) Si es entrega: actualizar pedido primero
            let numeroPedido = null;
            if (esEntrega) {
                pedidoId = localStorage.getItem('pedidoIdEntregando');
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
                productos: prepararProductos()
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
                            fecha_deuda: new Date().toISOString().split('T')[0],
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

                // Limpiar variables específicas de repetición (excepto productosMovimientoEditando que se limpia al cerrar el almacén)
                localStorage.removeItem('precioIdEditando');
                localStorage.removeItem('movimientoAgrupadoEditando');
                localStorage.removeItem('clienteIdEditando');
                localStorage.removeItem('clienteNameEditando');
                localStorage.removeItem('metodoPagoEditando');

                // Solo cerrar la canasta en móvil, no en PC (modo carrito)
                // En PC (isCartMode && isLargeScreen), mantener abierto para mostrar modal de descarga
                if (!isCartMode) {
                    setIsOpen(false);
                }

                if (onCerrarCanasta) {
                    onCerrarCanasta(productosStockActualizados, precioSeleccionado, movimientoId, pedidoActualizado);
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

    // Exponer las funciones para que AlmacenGeneral pueda acceder al precio seleccionado y modo de agrupación
    useEffect(() => {
        // Guardar las referencias a las funciones en el window para acceso global
        window.getPrecioSeleccionadoCanastaMovimientos = () => precioSeleccionado;
        window.getModoAgrupacionCanastaMovimientos = () => modoAgrupacion;
    }, [precioSeleccionado, modoAgrupacion]);

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
                        onChange={handleCambiarTipoPrecio}
                        options={preciosTipos}
                        placeholder="Precio"
                        disabled={loadingPrecios}
                        icon='dollar'
                    />

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
                                label={esEntrega ? 'Entregar Pedido' : 'Confirmar Salida'}
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