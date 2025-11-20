import React, { useState, useEffect, useCallback, useRef } from 'react';
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
import calcularStockDisponible from './hooks/useStockDisponible';
import useEntregaMovimientos from './hooks/useEntregaMovimientos';
import usePrecioCanasta from './hooks/usePrecioCanasta';
import { useLayout } from '../../../context/LayoutContext';
import OpcionDesplegable from '../../common/OpcionDesplegable';
import { isOfflineNetworkEnabled, queueOfflineSalida, updateOfflineProductsStock } from '../../../utils/offlineMovements';
import Checkbox from '../../common/Checkbox';

function CanastaMovimientos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, esEntrega = false, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false, onPedidoActualizado = null, isEditandoMovimiento = false, movimientoIdEditando = null, numeroOrdenEditando: numeroOrdenEditandoProp = null, onMovimientoEditado = null }) {
    const { isLargeScreen } = useLayout();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [descuento, setDescuento] = useState('');
    const [aumento, setAumento] = useState('');
    const [concepto, setConcepto] = useState('');
    const [pagoParcial, setPagoParcial] = useState('');
    const [descuentoAumentoPorcentaje, setDescuentoAumentoPorcentaje] = useState(true);

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
    // Hook para manejar la lógica de precios de salidas
    // Se inicializa antes de useCanastaProductos para obtener resolvePrecioInicial y resolveModoInicial
    const { 
        resolvePrecioInicial, 
        resolveModoInicial,
        precioIdEntregando,
        modoAgrupacionEntregando
    } = usePrecioCanasta({
        tipoCanasta: 'salida',
        esEntrega,
        isOpen,
        precioSeleccionado: null, // Se actualizará después cuando se obtenga de useCanastaProductos
        isEditing: isEditandoMovimiento,
    });

    const {
        pedidoIdEntregando,
        clienteEntregando,
        metodoPagoEntregando,
        clearEntregaTemporal
    } = useEntregaMovimientos({
        esEntrega,
        isOpen
    });

    // Ref para almacenar setModoAgrupacion (se actualizará después de obtenerlo del hook)
    const setModoAgrupacionRef = useRef(null);

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
            stockOriginal,
            precioManual: productoCarrito.precioManual === true
        };

        // Si el modo es agrupado pero el stock disponible es menor que un grupo, cambiar a unidades
        if (modoAgrupacion === 'agrupado' && productoCarrito.grup && stockOriginal > 0 && stockOriginal < productoCarrito.grup) {
            // Cambiar automáticamente a modo unidades
            if (setModoAgrupacionRef.current) {
                setModoAgrupacionRef.current('no_agrupado');
            }
            mostrarNotificacion('info', `El producto ${productoCarrito.name} tiene menos de un grupo disponible. Cambiado a modo unidades.`);
        }

        let stockMostrado = stockOriginal;
        if (modoAgrupacion === 'agrupado' && productoCarrito.grup) {
            stockMostrado = Math.floor(stockOriginal / (productoCarrito.grup || 1));
        }
        productoModificado.stock = stockMostrado;

        if (stockMostrado <= 0) {
            return null;
        }

        if (productoCarrito.cantidad > stockMostrado) {
            if (stockCambio) {
                mostrarNotificacion('warning', `Se ajustó la cantidad de algunos productos para que no excedan el stock disponible`);
            }
            productoModificado.cantidad = stockMostrado;
        }

        if (productoActualizado.price_product) {
            productoModificado.price_product = productoActualizado.price_product;
        }

        // Usar el modo actualizado (puede haber cambiado a no_agrupado)
        const modoFinal = modoAgrupacion === 'agrupado' && productoCarrito.grup && stockOriginal > 0 && stockOriginal < productoCarrito.grup
            ? 'no_agrupado'
            : modoAgrupacion;

        if (productoActualizado.price_product && precioSeleccionado && productoCarrito.precioManual !== true) {
            const precioFinal = obtenerPrecioPorTipo(
                { ...productoCarrito, price_product: productoActualizado.price_product },
                precioSeleccionado,
                modoFinal
            );
            productoModificado.precio = precioFinal;
        }

        return productoModificado;
    }, [mostrarNotificacion]);

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
        autoFocusCantidad: true,
        onSyncProducto: syncProductoSalida,
        onAfterModoAgrupacionChange: ({ producto, cantidadNueva }) => {
            if (producto && producto.name && cantidadNueva !== undefined) {
                mostrarNotificacion('warning', `Se ajustó la cantidad de ${producto.name} para que no exceda el stock disponible`);
            } else {
                mostrarNotificacion('warning', `Se ajustó la cantidad de algunos productos para que no excedan el stock disponible`);
            }
        }
    });

    // Guardar el precio seleccionado en localStorage cuando cambia
    // Solo si NO es un precio temporal (repetir/editar/entrega)
    useEffect(() => {
        if (!precioSeleccionado) return;
        if (esEntrega) return; // No guardar en entregas

        // Verificar si hay un precio temporal activo
        const precioIdRepitiendo = localStorage.getItem('precioIdRepitiendo');
        const precioIdEditando = localStorage.getItem('precioIdEditando');
        const precioIdEntregando = localStorage.getItem('precioIdEntregando');

        // Solo guardar como permanente si NO hay ningún precio temporal activo
        // y el precio seleccionado NO coincide con los temporales
        const hayPrecioTemporal = precioIdRepitiendo || precioIdEditando || precioIdEntregando;
        const esPrecioTemporal = precioSeleccionado === precioIdRepitiendo ||
            precioSeleccionado === precioIdEditando ||
            precioSeleccionado === precioIdEntregando;

        if (!hayPrecioTemporal && !esPrecioTemporal) {
            localStorage.setItem('precioIdMovimientoGuardado', precioSeleccionado);
        }
    }, [precioSeleccionado, esEntrega]);

    // Actualizar el ref con setModoAgrupacion
    useEffect(() => {
        setModoAgrupacionRef.current = setModoAgrupacion;
    }, [setModoAgrupacion]);

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

    // Cargar valores guardados cuando se abre (solo si no hay valores ya establecidos)
    useEffect(() => {
        if (isOpen && !esEntrega) {
            // Cargar descuento guardado
            const descuentoGuardado = localStorage.getItem('descuentoMovimientoGuardado');
            if (descuentoGuardado && !descuento) {
                setDescuento(descuentoGuardado);
            }
            
            // Cargar aumento guardado
            const aumentoGuardado = localStorage.getItem('aumentoMovimientoGuardado');
            if (aumentoGuardado && !aumento) {
                setAumento(aumentoGuardado);
            }
            
            // Cargar concepto guardado
            const conceptoGuardado = localStorage.getItem('conceptoMovimientoGuardado');
            if (conceptoGuardado && !concepto) {
                setConcepto(conceptoGuardado);
            }
            
            // Cargar cliente guardado
            const clienteIdGuardado = localStorage.getItem('clienteIdMovimientoGuardado');
            const clienteNameGuardado = localStorage.getItem('clienteNameMovimientoGuardado');
            if (clienteIdGuardado && clienteNameGuardado && !clienteSeleccionado) {
                setClienteSeleccionadoData({
                    id: clienteIdGuardado,
                    name: clienteNameGuardado
                });
                setClienteSeleccionado(clienteIdGuardado);
            }
            
            // Cargar método de pago guardado
            const metodoPagoGuardado = localStorage.getItem('metodoPagoMovimientoGuardado');
            if (metodoPagoGuardado && !metodoPagoSeleccionado) {
                setMetodoPagoSeleccionado(metodoPagoGuardado);
            }
        }
    }, [isOpen, esEntrega]);

    // Guardar valores en localStorage cuando cambian
    useEffect(() => {
        if (descuento && descuento.trim() !== '') {
            localStorage.setItem('descuentoMovimientoGuardado', descuento.trim());
        }
    }, [descuento]);

    useEffect(() => {
        if (aumento && aumento.trim() !== '') {
            localStorage.setItem('aumentoMovimientoGuardado', aumento.trim());
        }
    }, [aumento]);

    useEffect(() => {
        if (concepto && concepto.trim() !== '') {
            localStorage.setItem('conceptoMovimientoGuardado', concepto.trim());
        }
    }, [concepto]);

    useEffect(() => {
        if (clienteSeleccionadoData) {
            localStorage.setItem('clienteIdMovimientoGuardado', clienteSeleccionadoData.id);
            localStorage.setItem('clienteNameMovimientoGuardado', clienteSeleccionadoData.name);
        }
    }, [clienteSeleccionadoData]);

    useEffect(() => {
        if (metodoPagoSeleccionado) {
            localStorage.setItem('metodoPagoMovimientoGuardado', metodoPagoSeleccionado);
        }
    }, [metodoPagoSeleccionado]);

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
        localStorage.removeItem('conceptoMovimientoRepitiendo');
        localStorage.removeItem('descuentoMovimientoEditando');
        localStorage.removeItem('aumentoMovimientoEditando');
        // Limpiar valores guardados
        localStorage.removeItem('descuentoMovimientoGuardado');
        localStorage.removeItem('aumentoMovimientoGuardado');
        localStorage.removeItem('conceptoMovimientoGuardado');
        localStorage.removeItem('clienteIdMovimientoGuardado');
        localStorage.removeItem('clienteNameMovimientoGuardado');
        localStorage.removeItem('metodoPagoMovimientoGuardado');
        setDescuento('');
        setAumento('');
        setConcepto('');
        setPagoParcial('');
        setDescuentoAumentoPorcentaje(true);
        setClienteSeleccionado('');
        setClienteSeleccionadoData(null);
        setMetodoPagoSeleccionado('');
        if (isEditandoMovimiento && movimientoIdEditando) {
            localStorage.removeItem('movimientoIdEditando');
        }
        localStorage.removeItem('productosEdicion');
        if (isEditandoMovimiento) {
            localStorage.removeItem('numeroOrdenEditando');
        }
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

    const handleConfirmar = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar movimiento
            if (!validarMovimiento()) {
                setLoadingConfirmar(false);
                return;
            }

            // Obtener ubicación GPS (opcional) - si no se puede obtener, se guarda null
            const ubicacion = await obtenerUbicacion();

            const offlineEnabled = isOfflineNetworkEnabled();
            const fechaMovimientoEditando = isEditandoMovimiento ? localStorage.getItem('fechaMovimientoEditando') : null;
            const numeroOrdenEditandoStorage = isEditandoMovimiento ? localStorage.getItem('numeroOrdenEditando') : null;
            const numeroOrdenFinal = numeroOrdenEditandoStorage ?? numeroOrdenEditandoProp;
            const numeroOrdenPayload = (() => {
                if (numeroOrdenFinal === null || numeroOrdenFinal === undefined || numeroOrdenFinal === '') return null;
                const numeroParseado = Number(numeroOrdenFinal);
                return Number.isNaN(numeroParseado) ? null : numeroParseado;
            })();

            if (!offlineEnabled && isEditandoMovimiento && movimientoIdEditando) {
                // Anular el movimiento anterior pasando esEdicion: true para omitir validación de permisos
                const anulacionResp = await movimientosAlmacenService.anular(movimientoIdEditando, false, true);
                if (!anulacionResp?.success) {
                    const mensajeError = anulacionResp?.message || 'Error al anular el movimiento anterior';
                    mostrarNotificacion('error', mensajeError);
                    setLoadingConfirmar(false);
                    return;
                }

                // Eliminar el movimiento anterior pasando esEdicion: true para omitir validación de permisos
                const eliminacionResp = await movimientosAlmacenService.eliminar(movimientoIdEditando, true);
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
            let pedidoData = null;
            let numeroPedido = null;

            // 1) Si es entrega: actualizar pedido primero
            if (esEntrega) {
                pedidoId = pedidoIdEntregando || localStorage.getItem('pedidoIdEntregando');
                if (!pedidoId) {
                    mostrarNotificacion('error', 'No se encontró el ID del pedido');
                    setLoadingConfirmar(false);
                    return;
                }

                pedidoData = {
                    productos: prepararProductos(),
                    observaciones: observacionesGenerales || null,
                    precio_id: precioSeleccionado,
                    agrupado: modoAgrupacion === 'agrupado'
                };
                if (!offlineEnabled) {
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
            }


            // 2) Crear o actualizar movimiento de salida
            const observacionesFinales = esEntrega
                ? (observacionesGenerales
                    ? `Entrega del pedido Nº ${numeroPedido || 'N/A'} - ${observacionesGenerales}`
                    : `Entrega del pedido Nº ${numeroPedido || 'N/A'}`)
                : (observacionesGenerales || null);

            // Crear nuevo movimiento
            // Calcular el subtotal para convertir porcentajes a montos
            const productosParaCalcular = prepararProductos();
            const subtotalParaDescuentoAumento = productosCanasta.reduce((total, producto) => {
                const valorProducto = (producto.precio || 0) * producto.cantidad;
                return total + valorProducto;
            }, 0);
            
            // Calcular descuento y aumento según el modo seleccionado
            const descuentoValor = parseFloat(descuento) || 0;
            const aumentoValor = parseFloat(aumento) || 0;
            
            let descuentoMonto, aumentoMonto;
            if (descuentoAumentoPorcentaje) {
                // Si es porcentaje, convertir a monto
                descuentoMonto = (subtotalParaDescuentoAumento * descuentoValor) / 100;
                aumentoMonto = (subtotalParaDescuentoAumento * aumentoValor) / 100;
            } else {
                // Si es monto directo, usar directamente
                descuentoMonto = descuentoValor;
                aumentoMonto = aumentoValor;
            }
            
            const movimientoData = {
                type: 'salida',
                observaciones: observacionesFinales,
                precio_id: precioSeleccionado,
                metodo_pago: metodoPagoSeleccionado,
                cliente_id: esEntrega ? (clienteSeleccionadoData?.id || clientePedidoData?.id || null) : (clienteSeleccionado || null),
                proveedor_id: null,
                restar_ingredientes: false,
                agrupado: modoAgrupacion === 'agrupado',
                descuento: descuentoMonto,
                aumento: aumentoMonto,
                concepto: concepto && concepto.trim() !== '' ? concepto.trim() : null,
                porcentaje: (descuentoMonto > 0 || aumentoMonto > 0) ? descuentoAumentoPorcentaje : null,
                productos: productosParaCalcular,
                ...(fechaMovimientoEditando ? { fecha: fechaMovimientoEditando } : {}),
                ...(numeroOrdenPayload !== null ? { numero_orden: numeroOrdenPayload } : {}),
                ...(ubicacion ? { ubicacion: `${ubicacion.longitud},${ubicacion.latitud}` } : {})
            };
            const clienteOfflineInfo = esEntrega
                ? (clienteSeleccionadoData || clientePedidoData || null)
                : (clienteSeleccionadoData || (clienteSeleccionado ? { id: clienteSeleccionado } : null));

            const pedidoEstadoPayload = esEntrega ? { pedidoId, metodoPago: metodoPagoSeleccionado } : null;

            const construirDeudaPayload = (movimientoIdReferencia) => {
                if (metodoPagoSeleccionado !== 'credito') return null;
                const subtotalMovimiento = subtotalParaDescuentoAumento;
                        const totalMovimiento = subtotalMovimiento - descuentoMonto + aumentoMonto;
                        const fechaDeudaBase = (() => {
                            if (fechaMovimientoEditando) {
                                const fechaParsed = new Date(fechaMovimientoEditando);
                                if (!isNaN(fechaParsed.getTime())) {
                                    return fechaParsed.toISOString().split('T')[0];
                                }
                            }
                            return new Date().toISOString().split('T')[0];
                        })();
                let conceptoDeuda = 'Venta a crédito';
                        let destinoSucursalId = null;

                        if (esEntrega) {
                            const sucursalOrigenName = localStorage.getItem('pedidoDestinoSucursalName');
                    conceptoDeuda = sucursalOrigenName ? `Pedido Nº ${numeroPedido || 'N/A'} - ${sucursalOrigenName}` : `Pedido Nº ${numeroPedido || 'N/A'}`;
                            destinoSucursalId = localStorage.getItem('pedidoDestinoSucursalId');
                        }

                const clienteIdCredito = esEntrega
                    ? (clienteSeleccionadoData?.id || clientePedidoData?.id || null)
                    : (clienteSeleccionado || clienteSeleccionadoData?.id || null);

                return {
                            fecha_deuda: fechaDeudaBase,
                            fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            monto_total: totalMovimiento,
                            saldo_pendiente: totalMovimiento,
                    concepto: conceptoDeuda,
                            estado: 'pendiente',
                    cliente_id: clienteIdCredito,
                    movimiento_salida_id: movimientoIdReferencia,
                            destino_sucursal_id: destinoSucursalId
                        };
            };

            const deudaPayloadBase = construirDeudaPayload(null);

            const productosStockActualizados = productosParaCalcular.map(pu => {
                const prodActual = (productosActualizados || []).find(p => p.id === pu.id);
                const stockBase = prodActual ? (prodActual.stock || 0) : 0;
                const nuevoStock = Math.max(0, stockBase - pu.cantidad);
                return { id: pu.id, stock: nuevoStock };
            });

            const ejecutarPostOperacion = ({ movimientoIdParam = null, pedidoActualizadoParam = null } = {}) => {
                if (onProductosUpdated) {
                    onProductosUpdated(productosStockActualizados);
                    }

                setProductosCanasta([]);
                setObservacionesGenerales('');
                setDescuento('');
                setAumento('');
                setConcepto('');
                setPagoParcial('');
                setDescuentoAumentoPorcentaje(true);
                setClienteSeleccionado('');
                setClienteSeleccionadoData(null);
                setMetodoPagoSeleccionado('');
                localStorage.removeItem('canastaSalidas');

                if (esEntrega) {
                    clearEntregaTemporal();
                    localStorage.removeItem('pedidoDestinoSucursalId');
                    localStorage.removeItem('pedidoDestinoSucursalName');
                    localStorage.removeItem('precioIdEntregando');
                }

                localStorage.removeItem('precioIdRepitiendo');
                localStorage.removeItem('movimientoAgrupadoRepitiendo');
                localStorage.removeItem('clienteIdRepitiendo');
                localStorage.removeItem('clienteNameRepitiendo');
                localStorage.removeItem('metodoPagoRepitiendo');
                localStorage.removeItem('precioIdEditando');
                localStorage.removeItem('movimientoAgrupadoEditando');
                localStorage.removeItem('clienteIdEditando');
                localStorage.removeItem('clienteNameEditando');
                localStorage.removeItem('metodoPagoEditando');
                localStorage.removeItem('descuentoMovimientoRepitiendo');
                localStorage.removeItem('aumentoMovimientoRepitiendo');
                localStorage.removeItem('conceptoMovimientoRepitiendo');
                localStorage.removeItem('descuentoMovimientoEditando');
                localStorage.removeItem('aumentoMovimientoEditando');
                localStorage.removeItem('conceptoMovimientoEditando');
                localStorage.removeItem('fechaMovimientoEditando');
                localStorage.removeItem('productosEdicion');
                
                // Limpiar valores guardados (igual que en handleLimpiarCanasta)
                localStorage.removeItem('descuentoMovimientoGuardado');
                localStorage.removeItem('aumentoMovimientoGuardado');
                localStorage.removeItem('conceptoMovimientoGuardado');
                localStorage.removeItem('clienteIdMovimientoGuardado');
                localStorage.removeItem('clienteNameMovimientoGuardado');
                localStorage.removeItem('metodoPagoMovimientoGuardado');

                if (isEditandoMovimiento) {
                    localStorage.removeItem('movimientoIdEditando');
                    localStorage.removeItem('numeroOrdenEditando');
                }

                if (!isCartMode) {
                    setIsOpen(false);
                }

                if (onCerrarCanasta) {
                    onCerrarCanasta(productosStockActualizados, precioSeleccionado, movimientoIdParam, pedidoActualizadoParam);
                }

                if (isEditandoMovimiento && onMovimientoEditado) {
                    onMovimientoEditado(movimientoIdParam, movimientoIdEditando);
                }
            };

            if (offlineEnabled) {
                const precioSeleccionadoInfo = preciosTipos?.find((precio) => {
                    const value = precio?.value ?? precio?.id;
                    return value === precioSeleccionado;
                });
                const precioNombreSeleccionado =
                    precioSeleccionadoInfo?.label ||
                    precioSeleccionadoInfo?.name ||
                    precioSeleccionadoInfo?.nombre ||
                    '';
                // Calcular pago parcial para offline
                const pagoParcialValue = parseFloat(pagoParcial);
                const pagoParcialData = pagoParcial && !Number.isNaN(pagoParcialValue) && pagoParcialValue > 0
                    ? { monto: pagoParcialValue, fecha: fechaMovimientoEditando || null }
                    : null;

                await queueOfflineSalida({
                    movimientoData,
                    pedidoId,
                    pedidoData,
                    pedidoEstadoPayload,
                    deudaData: deudaPayloadBase,
                    pagoParcialData,
                    clienteInfo: clienteOfflineInfo,
                    metodoPago: metodoPagoSeleccionado,
                    subtotal: subtotalParaDescuentoAumento,
                    descuentoPorcentaje: descuentoAumentoPorcentaje ? descuentoValor : (subtotalParaDescuentoAumento > 0 ? (descuentoMonto / subtotalParaDescuentoAumento) * 100 : 0),
                    aumentoPorcentaje: descuentoAumentoPorcentaje ? aumentoValor : (subtotalParaDescuentoAumento > 0 ? (aumentoMonto / subtotalParaDescuentoAumento) * 100 : 0),
                    observaciones: observacionesFinales,
                    productos: productosCanasta,
                    productosNormalizados: productosParaCalcular,
                    numeroPedido,
                    numeroOrden: numeroOrdenPayload,
                    esEntrega,
                    isEditandoMovimiento,
                    movimientoIdEditando,
                    fechaMovimientoEditando,
                    tipoPrecioNombre: precioNombreSeleccionado,
                });

                await updateOfflineProductsStock(productosStockActualizados);

                ejecutarPostOperacion({ movimientoIdParam: null, pedidoActualizadoParam: null });
                mostrarNotificacion('success', 'Movimiento guardado para sincronización offline.');
                return;
            }

            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);
            movimientoId = (movimientoResponse && movimientoResponse.success) ? movimientoResponse.data?.id : null;

            if (movimientoId) {
                if (metodoPagoSeleccionado === 'credito') {
                    try {
                        const deudaPayloadOnline = deudaPayloadBase
                            ? { ...deudaPayloadBase, movimiento_salida_id: movimientoId }
                            : null;

                        if (deudaPayloadOnline) {
                            const deudaResponse = await deudasService.create(deudaPayloadOnline);
                            if (deudaResponse.success) {
                                const deudaId = deudaResponse.data.id;
                                try {
                                    await movimientosAlmacenService.update(movimientoId, { deuda_id: deudaId });
                                } catch (updateError) {
                                    console.warn('Error al actualizar movimiento con deuda_id:', updateError);
                                }

                                // Crear pago parcial si existe un valor
                                const pagoParcialValue = parseFloat(pagoParcial);
                                if (pagoParcial && !Number.isNaN(pagoParcialValue) && pagoParcialValue > 0) {
                                    try {
                                        const pagoParcialResponse = await deudasService.createPagoParcial(deudaId, { 
                                            monto: pagoParcialValue,
                                            fecha: fechaMovimientoEditando || null
                                        });
                                        if (!pagoParcialResponse.success) {
                                            console.warn('Error al crear pago parcial:', pagoParcialResponse.message);
                                            mostrarNotificacion('warning', `Deuda creada, pero error al registrar pago parcial: ${pagoParcialResponse.message}`);
                                        }
                                    } catch (pagoParcialError) {
                                        console.error('Error creando pago parcial:', pagoParcialError);
                                        mostrarNotificacion('warning', `Deuda creada, pero error al registrar pago parcial automático`);
                                    }
                                }
                            } else {
                                mostrarNotificacion('warning', `Movimiento creado, pero error al registrar deuda: ${deudaResponse.message}`);
                            }
                        }
                    } catch (deudaError) {
                        mostrarNotificacion('warning', `Movimiento creado, pero error al registrar deuda automática`);
                    }
                }

                if (esEntrega) {
                    const deudaId = null;
                    let pedidoResponse = null;

                    try {
                        pedidoResponse = await pedidosAlmacenService.updateEstado(pedidoId, 'Entregado', movimientoId, deudaId);
                        if (!pedidoResponse.success) {
                            console.error('Error al actualizar estado del pedido:', pedidoResponse.message);
                        }
                    } catch (error) {
                        console.error('Error al actualizar estado del pedido:', error);
                    }

                    localStorage.removeItem('pedidoDestinoSucursalId');
                    localStorage.removeItem('pedidoDestinoSucursalName');
                    localStorage.removeItem('precioIdEntregando');

                    if (onPedidoActualizado && pedidoResponse && pedidoResponse.success) {
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

                ejecutarPostOperacion({ movimientoIdParam: movimientoId, pedidoActualizadoParam: pedidoActualizado });
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
            <HeaderView
                title="Canasta de Salidas"
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
                                                    {(() => {
                                                        // Calcular stock disponible restando la cantidad total de este producto en la canasta
                                                        // La cantidad ya está en grupos si está en modo agrupado, o en unidades si no
                                                        const stockInfo = calcularStockDisponible({
                                                            producto: {
                                                                ...producto,
                                                                stock: producto.stockOriginal || producto.stock || 0
                                                            },
                                                            tipo: 'salida',
                                                            cantidadEnCanasta: 0,
                                                            cantidadEnCanastaMovimientos: producto.cantidad,
                                                            modoAgrupacion: modoAgrupacion // Pasar modoAgrupacion para que sea reactivo
                                                        });
                                                        // Aplicar color dinámico según el badgeColor
                                                        const colorMap = {
                                                            'info': 'var(--info-color, #3498db)',
                                                            'warning': 'var(--warning-color, #f39c12)',
                                                            'error': 'var(--error-color, #e74c3c)',
                                                            'success': 'var(--success-color, #2ecc71)',
                                                            'default': 'inherit'
                                                        };
                                                        const color = colorMap[stockInfo.badgeColor] || colorMap['default'];
                                                        return (
                                                            <span style={{ color }}>
                                                                {stockInfo.stockDisplay}
                                                            </span>
                                                        );
                                                    })()}
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
                                                    max={(modoAgrupacion === 'agrupado' && producto.grup)
                                                        ? producto.stock
                                                        : (producto.stockOriginal || producto.stock)}
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
                                                        } else if (nuevaCantidad > ((modoAgrupacion === 'agrupado' && producto.grup)
                                                            ? producto.stock
                                                            : (producto.stockOriginal || producto.stock))) {
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
                                    <hr className={styles.hr} />
                                    {/* Selector de cliente para salidas */}
                                    <Boton
                                        className='btn-gray'
                                        label={esEntrega
                                            ? (clienteSeleccionadoData 
                                                ? `Cliente: ${clienteSeleccionadoData.name}` 
                                                : (clientePedidoData 
                                                    ? `Cliente del Pedido: ${clientePedidoData.name}` 
                                                    : (metodoPagoSeleccionado === 'credito' 
                                                        ? 'Seleccionar Cliente (obligatorio)' 
                                                        : 'Seleccionar Cliente')))
                                            : (clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name :
                                                (metodoPagoSeleccionado === 'credito' ? 'Seleccionar Cliente (obligatorio)' : 'Seleccionar Cliente (opcional)'))
                                        }
                                        onClick={() => setIsClientesSeleccionOpen(true)}
                                        style={{
                                            width: '100%',
                                            justifyContent: 'flex-start',
                                            ...(metodoPagoSeleccionado === 'credito' && !clienteSeleccionadoData && !clientePedidoData ? { borderColor: '#e74c3c', color: '#e74c3c' } : {})
                                        }}
                                    />

                                    {/* Selector de método de pago para salidas */}
                                    <SelectorMetodoPago
                                        value={metodoPagoSeleccionado}
                                        onChange={setMetodoPagoSeleccionado}
                                    />

                                    {/* Otras opciones */}
                                    <OpcionDesplegable titulo="Otras opciones">
                                        <div className={styles.horizontal}>
                                            <InputNormal
                                                placeholder={descuentoAumentoPorcentaje ? "Descuento %" : "Descuento (Bs.)"}
                                                tipo="number"
                                                step="0.01" min="0"
                                                max={descuentoAumentoPorcentaje ? "100" : undefined}
                                                value={descuento}
                                                onChange={(e) => setDescuento(e.target.value)}
                                                icon='trending-down'
                                            />
                                            <InputNormal
                                                placeholder={descuentoAumentoPorcentaje ? "Aumento %" : "Aumento (Bs.)"}
                                                tipo="number"
                                                step="0.01" min="0"
                                                max={descuentoAumentoPorcentaje ? "100" : undefined}
                                                value={aumento}
                                                onChange={(e) => setAumento(e.target.value)}
                                                icon='trending-up'
                                            />
                                        </div>
                                        <Checkbox
                                            title="Aplicar como porcentaje"
                                            checked={descuentoAumentoPorcentaje}
                                            onChange={setDescuentoAumentoPorcentaje}
                                            icon="calculator"
                                        />
                                        <InputNormal
                                            placeholder="Concepto (opcional)"
                                            tipo="text"
                                            value={concepto}
                                            onChange={(e) => setConcepto(e.target.value)}
                                            icon='text'
                                        />
                                        {metodoPagoSeleccionado === 'credito' && (
                                            <InputNormal
                                                placeholder="Pago parcial (Bs.)"
                                                tipo="number"
                                                step="0.01" min="0"
                                                value={pagoParcial}
                                                onChange={(e) => setPagoParcial(e.target.value)}
                                                icon='money'
                                            />
                                        )}
                                    </OpcionDesplegable>


                                </>
                            )}
                        </div>

                        {/* Total general */}
                        <div className={styles.totalGeneral}>
                            <div className={styles.totalGeneralContent}>
                                {(() => {
                                    const subtotal = productosCanasta.reduce((total, producto) => {
                                        const valorProducto = (producto.precio || 0) * producto.cantidad;
                                        return total + valorProducto;
                                    }, 0);
                                    
                                    // Calcular descuento y aumento según el modo seleccionado
                                    const descuentoValor = parseFloat(descuento) || 0;
                                    const aumentoValor = parseFloat(aumento) || 0;
                                    
                                    let descuentoMonto, aumentoMonto;
                                    if (descuentoAumentoPorcentaje) {
                                        // Si es porcentaje, convertir a monto
                                        descuentoMonto = (subtotal * descuentoValor) / 100;
                                        aumentoMonto = (subtotal * aumentoValor) / 100;
                                    } else {
                                        // Si es monto directo, usar directamente
                                        descuentoMonto = descuentoValor;
                                        aumentoMonto = aumentoValor;
                                    }
                                    
                                    const total = subtotal - descuentoMonto + aumentoMonto;
                                    
                                    // Determinar el color y formato del total
                                    const tieneDescuento = descuentoMonto > 0;
                                    const tieneAumento = aumentoMonto > 0;
                                    
                                    let totalTexto = `Bs. ${total.toFixed(2)}`;
                                    let claseColor = '';
                                    
                                    // Agregar porcentaje o monto de descuento o aumento si existe
                                    if (tieneDescuento) {
                                        if (descuentoAumentoPorcentaje) {
                                            totalTexto = `Bs. ${total.toFixed(2)} (-${descuentoValor.toFixed(2)}%)`;
                                        } else {
                                            totalTexto = `Bs. ${total.toFixed(2)} (-Bs. ${descuentoMonto.toFixed(2)})`;
                                        }
                                        claseColor = styles.totalRojo;
                                    } else if (tieneAumento) {
                                        if (descuentoAumentoPorcentaje) {
                                            totalTexto = `Bs. ${total.toFixed(2)} (+${aumentoValor.toFixed(2)}%)`;
                                        } else {
                                            totalTexto = `Bs. ${total.toFixed(2)} (+Bs. ${aumentoMonto.toFixed(2)})`;
                                        }
                                        claseColor = styles.totalVerde;
                                    }
                                    
                                    return (
                                        <>
                                            <span className={styles.totalGeneralLabel}>Total:</span>
                                            <span className={`${styles.totalGeneralValue} ${claseColor}`}>
                                                {totalTexto}
                                            </span>
                                        </>
                                    );
                                })()}
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