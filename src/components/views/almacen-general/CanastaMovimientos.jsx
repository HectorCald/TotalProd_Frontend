import React, { useState, useEffect, useRef } from 'react';
import styles from './CanastaMovimientos.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import movimientosAlmacenService from '../../../services/movimientosAlmacenService';
import pedidosAlmacenService from '../../../services/pedidosAlmacenService';
import Switch from '../../common/Switch';
import Proveedores from '../proveedores/Proveedores';
import Clientes from '../clientes/Clientes';
import Notification from '../../common/Notification';
import SelectorMetodoPago from '../../mixed/SelectorMetodoPago';
import deudasService from '../../../services/deudasService';

function CanastaMovimientos({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, tipoMovimiento, onCerrarCanasta, onProductosUpdated, esEntrega = false, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false, onPedidoActualizado = null }) {
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    // const [isConfirmarModalOpen, setIsConfirmarModalOpen] = useState(false); // Ya no se usa
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [animarCantidad, setAnimarCantidad] = useState({});
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [modoAgrupacion, setModoAgrupacion] = useState('agrupado'); // 'agrupado' o 'no_agrupado'

    // Estados para proveedores y clientes
    const [proveedorSeleccionado, setProveedorSeleccionado] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [metodoPagoSeleccionado, setMetodoPagoSeleccionado] = useState('');
    const [isProveedoresSeleccionOpen, setIsProveedoresSeleccionOpen] = useState(false);
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
    const [proveedorSeleccionadoData, setProveedorSeleccionadoData] = useState(null);
    const [clienteSeleccionadoData, setClienteSeleccionadoData] = useState(null);
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
    const [restarIngredientes, setRestarIngredientes] = useState(() => {
        const saved = localStorage.getItem('restarIngredientes');
        return saved !== null ? JSON.parse(saved) : true;
    });

    // Referencias para el auto-focus en inputs de cantidad
    const cantidadInputRefs = useRef({});

    // Auto-focus en input de cantidad cuando se agrega un producto nuevo (solo en pantallas grandes)
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
            // Verificar si hay un precio específico guardado para entregas
            if (esEntrega) {
                const precioIdEntregando = localStorage.getItem('precioIdEntregando');
                if (precioIdEntregando && preciosTipos.find(p => p.value === precioIdEntregando)) {
                    setPrecioSeleccionado(precioIdEntregando);
                } else if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            } else {
                // Para otros casos, seleccionar el primer precio por defecto
                if (preciosTipos.length > 0) {
                    setPrecioSeleccionado(preciosTipos[0].value);
                }
            }
        }
    }, [isOpen, preciosTipos, esEntrega, precioSeleccionado]);


    // Guardar en localStorage cuando cambie la canasta (separado por tipo)
    useEffect(() => {
        const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
        if (productosCanasta.length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(productosCanasta));
        }
        // NO remover del localStorage aquí para evitar que se borre al recargar la página
        // La limpieza se maneja en las funciones específicas
    }, [productosCanasta, tipoMovimiento, esEntrega]);

    // Cargar canasta desde localStorage al abrir el modal
    useEffect(() => {
        if (isOpen) {
            const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
            const canastaGuardada = localStorage.getItem(localStorageKey);
            if (canastaGuardada) {
                try {
                    const productosGuardados = JSON.parse(canastaGuardada);

                    // Si es una entrega (salida), actualizar el stock de los productos
                    if (tipoMovimiento === 'salida' && esEntrega) {
                        // Los productos ya vienen con el stock actualizado desde VerPedido.jsx
                        setProductosCanasta(productosGuardados);
                    } else {
                        setProductosCanasta(productosGuardados);
                    }
                } catch (error) {
                    console.error('Error al cargar canasta desde localStorage:', error);
                }
            }
        }
    }, [isOpen, tipoMovimiento, esEntrega]);

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
                            // Si es una salida y la cantidad en el carrito excede el nuevo stock, ajustar
                            if (tipoMovimiento === 'salida' && productoCarrito.cantidad > productoActualizado.stock) {
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
                            if (precioTipo && precioTipo.valor !== productoCarrito.precio) {
                                productoModificado.precio = precioTipo.valor;
                                productoModificado.price_product = productoActualizado.price_product; // Actualizar también la estructura de precios
                            }
                        }

                        return productoModificado;
                    }
                    return productoCarrito;
                });
            });
        }
    }, [productosActualizados, tipoMovimiento, precioSeleccionado]);





    const handleActualizarCantidad = (productoId, nuevaCantidad, animar = false) => {
        if (nuevaCantidad <= 0) {
            handleEliminarProducto(productoId);
            return;
        }

        // Obtener el producto actual para validar el stock
        const productoActual = productosCanasta.find(p => p.id === productoId);
        if (!productoActual) return;

        // Validar que no exceda el stock disponible SOLO para salidas
        const stockParaValidar = getStockParaValidacion(productoActual);
        if (tipoMovimiento === 'salida' && nuevaCantidad > stockParaValidar) {
            console.warn(`No se puede exceder el stock disponible: ${stockParaValidar}`);
            mostrarNotificacion('error', 'No se puede exceder el stock disponible');
            return; // No actualizar si excede el stock (solo para salidas)
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

    const handleCambiarModoAgrupacion = (nuevoModo) => {
        setModoAgrupacion(nuevoModo);
        
        // Actualizar productos según el nuevo modo
        setProductosCanasta(prev => prev.map(producto => {
            // Usar stockOriginal si existe, sino usar stock
            const stockOriginalEnUnidades = producto.stockOriginal || producto.stock;
            
            if (nuevoModo === 'agrupado' && producto.grup) {
                // Cambiar a modo agrupado
                const stockEnGrupos = Math.floor(stockOriginalEnUnidades / producto.grup);
                const precioPorGrupo = (producto.precio || 0) * producto.grup;
                const cantidadEnGrupos = Math.floor(producto.cantidad / producto.grup);
                
                return {
                    ...producto,
                    cantidad: cantidadEnGrupos || 1, // Mínimo 1 grupo
                    precio: precioPorGrupo,
                    stock: stockEnGrupos,
                    stockOriginal: stockOriginalEnUnidades // Mantener el stock original
                };
            } else {
                // Cambiar a modo no agrupado
                const precioUnitario = producto.grup ? (producto.precio || 0) / producto.grup : (producto.precio || 0);
                const cantidadEnUnidades = producto.cantidad * (producto.grup || 1);
                
                return {
                    ...producto,
                    cantidad: cantidadEnUnidades,
                    precio: precioUnitario,
                    stock: stockOriginalEnUnidades, // Stock original en unidades
                    stockOriginal: stockOriginalEnUnidades // Mantener el stock original
                };
            }
        }));
    };


    // Función para manejar cuando se selecciona un proveedor
    const handleProveedorSeleccionado = (proveedor) => {
        setProveedorSeleccionadoData(proveedor);
        setProveedorSeleccionado(proveedor.id);
        setIsProveedoresSeleccionOpen(false);
    };

    // Función para manejar cuando se selecciona un cliente
    const handleClienteSeleccionado = (cliente) => {
        setClienteSeleccionadoData(cliente);
        setClienteSeleccionado(cliente.id);
        setIsClientesSeleccionOpen(false);
    };


    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        // Limpiar también el localStorage
        const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
        localStorage.removeItem(localStorageKey);
        setIsLimpiarModalOpen(false);
        setIsOpen(false);
    };

    


    // Función común para preparar productos
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

    // Función común para validaciones
    const validarMovimiento = () => {
        if (tipoMovimiento === 'salida' && !metodoPagoSeleccionado) {
            mostrarNotificacion('error', 'El método de pago es obligatorio');
            return false;
        }

        if (tipoMovimiento === 'salida' && metodoPagoSeleccionado === 'credito' && !esEntrega && !clienteSeleccionado) {
            mostrarNotificacion('error', 'El cliente es obligatorio para ventas a crédito');
            return false;
        }

        return true;
    };




    const handleConfirmarEntrega = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar movimiento
            if (!validarMovimiento()) {
                setLoadingConfirmar(false);
                return;
            }

            // Obtener pedidoId
            const pedidoId = localStorage.getItem('pedidoIdEntregando');
            if (!pedidoId) {
                mostrarNotificacion('error', 'No se encontró el ID del pedido');
                setLoadingConfirmar(false);
                return;
            }

            // 1) Actualizar pedido con productos de la canasta
            const pedidoData = {
                productos: prepararProductos(),
                observaciones: observacionesGenerales || null,
                precio_id: precioSeleccionado
            };
            const pedidoActualizado = await pedidosAlmacenService.update(pedidoId, pedidoData);

            // Notificar al componente padre sobre la actualización del pedido (solo productos, precio, observaciones)
            if (onPedidoActualizado && pedidoActualizado?.data) {
                onPedidoActualizado(pedidoActualizado.data);
            }

            // Cerrar la canasta después de notificar al componente padre (igual que CanastaPedidos.jsx)
            setProductosCanasta([]);
            setObservacionesGenerales('');
            setMetodoPagoSeleccionado('');
            localStorage.removeItem('canastaSalidas');
            localStorage.removeItem('pedidoIdEntregando');
            localStorage.removeItem('precioIdEntregando');
            setIsOpen(false);

            // 2) Crear movimiento de salida
            const observacionesFinales = observacionesGenerales
                ? `Entrega del pedido #${pedidoId.slice(-8)} - ${observacionesGenerales}`
                : `Entrega del pedido #${pedidoId.slice(-8)}`;

            const movimientoData = {
                type: 'salida',
                observaciones: observacionesFinales,
                precio_id: precioSeleccionado,
                metodo_pago: metodoPagoSeleccionado,
                cliente_id: null,
                proveedor_id: null,
                restar_ingredientes: false,
                productos: prepararProductos()
            };

            const movimientoRespEntrega = await movimientosAlmacenService.create(movimientoData);
            const movimientoId = (movimientoRespEntrega && movimientoRespEntrega.success) ? movimientoRespEntrega.data?.id : null;

            if (movimientoId) {
                // Actualizar stock EN FRONT usando lo que había en la canasta
                const productosEnUnidades = prepararProductos();
                const productosStockActualizados = productosEnUnidades.map(pu => {
                    const prodActual = (productosActualizados || []).find(p => p.id === pu.id);
                    const stockBase = prodActual ? (prodActual.stock || 0) : 0;
                    const nuevoStock = Math.max(0, stockBase - pu.cantidad); // entrega es salida
                    return { id: pu.id, stock: nuevoStock };
                });
                if (onProductosUpdated) {
                    onProductosUpdated(productosStockActualizados);
                }
                let deudaId = null;
                
                // 3) Si es crédito, crear deuda
                if (metodoPagoSeleccionado === 'credito') {
                    const totalMovimiento = getTotalValor();
                    // Para entregas de pedido, el destino_sucursal_id debe ser el sucursal_id del pedido (sucursal origen)
                    const sucursalOrigenId = localStorage.getItem('pedidoDestinoSucursalId'); // Este es el sucursal_id del pedido
                    const sucursalOrigenName = localStorage.getItem('pedidoDestinoSucursalName'); // Este es el nombre de la sucursal origen
                    
                    const concepto = sucursalOrigenName ? `Pedido - ${sucursalOrigenName}` : 'Pedido';

                    const deudaData = {
                        fecha_deuda: new Date().toISOString().split('T')[0],
                        fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        monto_total: totalMovimiento,
                        saldo_pendiente: totalMovimiento,
                        concepto: concepto,
                        estado: 'pendiente',
                        cliente_id: null,
                        movimiento_salida_id: movimientoId,
                        destino_sucursal_id: sucursalOrigenId // Sucursal origen del pedido
                    };
                    
                    const deudaResponse = await deudasService.create(deudaData);
                    if (deudaResponse.success) {
                        deudaId = deudaResponse.data.id;
                    }
                }

                // 4) Actualizar estado del pedido con el ID del movimiento y deuda_id (si existe)
                await actualizarEstadoPedido(pedidoId, 'Entregado', movimientoId, deudaId);

                // Limpiar localStorage específico de entregas
                localStorage.removeItem('pedidoDestinoSucursalId');
                localStorage.removeItem('pedidoDestinoSucursalName');

                // Notificar al componente padre sobre el cambio de estado del pedido
                if (onPedidoActualizado) {
                    const pedidoConEstadoActualizado = {
                        ...pedidoActualizado.data,
                        estado: 'Entregado',
                        movimiento_salida_id: movimientoId,
                        deuda_id: deudaId // Incluir deuda_id en la notificación
                    };
                    onPedidoActualizado(pedidoConEstadoActualizado);
                }

                if (onCerrarCanasta) {
                    onCerrarCanasta(productosStockActualizados, precioSeleccionado, movimientoId);
                }
                mostrarNotificacion('success', 'Pedido entregado correctamente');
            } else {
                mostrarNotificacion('error', 'Error al crear el movimiento');
            }

        } catch (error) {
            console.error('Error al confirmar entrega:', error);
            mostrarNotificacion('error', error.message || 'Error al confirmar la entrega');
        } finally {
            setLoadingConfirmar(false);
        }
    };

    
    const handleConfirmarMovimientos = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar movimiento
            if (!validarMovimiento()) {
                setLoadingConfirmar(false);
                return;
            }

            // Preparar datos para enviar al backend
            const movimientoData = {
                type: tipoMovimiento,
                observaciones: (observacionesGenerales || null),
                precio_id: precioSeleccionado,
                metodo_pago: tipoMovimiento === 'salida' ? metodoPagoSeleccionado : null,
                cliente_id: tipoMovimiento === 'salida' ? (clienteSeleccionado || null) : null,
                proveedor_id: tipoMovimiento === 'entrada' ? (proveedorSeleccionado || null) : null,
                restar_ingredientes: tipoMovimiento === 'entrada' && restarIngredientes && tieneProductosConRecetas(),
                productos: prepararProductos()
            };

            // 1) Crear movimiento
            const movimientoResponse = await movimientosAlmacenService.create(movimientoData);
            const movimientoId = (movimientoResponse && movimientoResponse.success) ? movimientoResponse.data?.id : null;

            if (movimientoId) {
                // Actualizar stock EN FRONT usando lo que había en la canasta
                const productosEnUnidades = prepararProductos();
                const productosStockActualizados = productosEnUnidades.map(pu => {
                    const prodActual = (productosActualizados || []).find(p => p.id === pu.id);
                    const stockBase = prodActual ? (prodActual.stock || 0) : 0;
                    const delta = tipoMovimiento === 'entrada' ? pu.cantidad : -pu.cantidad;
                    const nuevoStock = Math.max(0, stockBase + delta);
                    return { id: pu.id, stock: nuevoStock };
                });
                if (onProductosUpdated) {
                    onProductosUpdated(productosStockActualizados);
                }

                // 2) Si es salida con método de pago "credito", registrar deuda automáticamente
                if (tipoMovimiento === 'salida' && metodoPagoSeleccionado === 'credito') {
                    try {
                        const totalMovimiento = getTotalValor();
                        const deudaData = {
                            fecha_deuda: new Date().toISOString().split('T')[0],
                            fecha_vencimiento: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                            monto_total: totalMovimiento,
                            saldo_pendiente: totalMovimiento,
                            concepto: 'Venta a crédito',
                            estado: 'pendiente',
                            cliente_id: (clienteSeleccionado || null),
                            movimiento_salida_id: movimientoId,
                            destino_sucursal_id: null
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
                        mostrarNotificacion('warning', 'Movimiento creado, pero error al registrar deuda automática');
                    }
                }

                // Actualizar stock de productos
                // Ya no tenemos productos en la respuesta directa; refresco se maneja fuera si es necesario

                // Limpiar canasta y cerrar
                setProductosCanasta([]);
                setObservacionesGenerales('');
                setProveedorSeleccionado('');
                setClienteSeleccionado('');
                setMetodoPagoSeleccionado('');

                const localStorageKey = tipoMovimiento === 'entrada' ? 'canastaEntradas' : 'canastaSalidas';
                localStorage.removeItem(localStorageKey);

                setIsOpen(false);
                if (onCerrarCanasta) {
                    onCerrarCanasta(productosStockActualizados, precioSeleccionado, movimientoId);
                }
            } else {
                mostrarNotificacion('error', 'Error al crear el movimiento');
            }

        } catch (error) {
            mostrarNotificacion('error', error.message || 'Error al confirmar movimientos');
        } finally {
            setLoadingConfirmar(false);
        }
    };


    // Método para actualizar estado del pedido
    const actualizarEstadoPedido = async (pedidoId, nuevoEstado, movimientoSalidaId = null, deudaId = null) => {
        try {
            const response = await pedidosAlmacenService.updateEstado(pedidoId, nuevoEstado, movimientoSalidaId, deudaId);
            if (response.success) {
                return response.data;
            } else {
                console.error('Error al actualizar estado del pedido:', response.message);
                return null;
            }
        } catch (error) {
            console.error('Error al actualizar estado del pedido:', error);
            return null;
        }
    };


    const getTotalValor = () => {
        return productosCanasta.reduce((total, producto) => {
            const valorProducto = (producto.precio || 0) * producto.cantidad;
            return total + valorProducto;
        }, 0);
    };

    // Verificar si algún producto en la canasta tiene recetas
    const tieneProductosConRecetas = () => {
        return productosCanasta.some(producto =>
            producto.recetas && producto.recetas.length > 0
        );
    };

    // Función para obtener el precio actual seleccionado
    const getPrecioActualSeleccionado = () => {
        return precioSeleccionado;
    };

    // Función para obtener el modo de agrupación actual
    const getModoAgrupacionActual = () => {
        return modoAgrupacion;
    };

    // Función helper para obtener el stock correcto para validación
    const getStockParaValidacion = (producto) => {
        if (modoAgrupacion === 'agrupado' && producto.grup) {
            return producto.stock; // Stock ya convertido a grupos
        } else {
            return producto.stockOriginal || producto.stock; // Stock original en unidades
        }
    };

    // Exponer las funciones para que AlmacenGeneral pueda acceder al precio seleccionado y modo de agrupación
    useEffect(() => {
        if (isCartMode) {
            // Guardar las referencias a las funciones en el window para acceso global
            window.getPrecioSeleccionadoCanastaMovimientos = getPrecioActualSeleccionado;
            window.getModoAgrupacionCanastaMovimientos = getModoAgrupacionActual;
        }
    }, [isCartMode, precioSeleccionado, modoAgrupacion]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            {!isCartMode && <HeaderView onBack={() => setIsOpen(false)} />}
            <div className={`${styles.container} ${isCartMode ? styles.cartPanel : ''}`}>
                <h1 className={styles.title}>Canasta de {tipoMovimiento === 'entrada' ? 'Entradas' : 'Salidas'}
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsLimpiarModalOpen(true)}>
                            <BoxIcon name='trash' className={styles.iconTrash} />
                        </button>
                    </div>
                </h1>

                {/* Selectores de precio y agrupación */}
                {productosCanasta.length > 0 && (
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
                                                    Stock: {modoAgrupacion === 'agrupado' && producto.grup 
                                                        ? `${producto.stock || 0} grupos (${(producto.stock || 0) * (producto.grup || 1)} unidades)`
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
                                                    max={tipoMovimiento === 'salida' ? getStockParaValidacion(producto) : undefined}
                                                    onChange={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        handleActualizarCantidad(producto.id, nuevaCantidad, false);
                                                    }}
                                                    onBlur={(e) => {
                                                        const nuevaCantidad = parseInt(e.target.value) || 1;
                                                        if (nuevaCantidad < 1) {
                                                            handleActualizarCantidad(producto.id, 1, false);
                                                        } else if (tipoMovimiento === 'salida' && nuevaCantidad > getStockParaValidacion(producto)) {
                                                            // Si excede el stock, ajustar al stock máximo (solo para salidas)
                                                            const stockMaximo = getStockParaValidacion(producto);
                                                            handleActualizarCantidad(producto.id, stockMaximo, false);
                                                        }
                                                    }}
                                                />
                                            </motion.span>
                                            <button
                                                className={styles.btnCantidad}
                                                onClick={() => handleActualizarCantidad(producto.id, producto.cantidad + 1, true)}
                                                disabled={tipoMovimiento === 'salida' && producto.cantidad >= getStockParaValidacion(producto)}
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
                             {/* Controles específicos por tipo de movimiento */}
                        {tipoMovimiento === 'entrada' && (
                            <>
                                {/* Selector de proveedor para entradas */}
                                <div className={styles.content} style={{ padding: '5px 15px', marginTop: 'auto' }}>
                                    <Boton
                                        className='btn-transparent'
                                        label={proveedorSeleccionadoData ? 'Proveedor: ' + proveedorSeleccionadoData.name : 'Seleccionar Proveedor (opcional)'}
                                        onClick={() => setIsProveedoresSeleccionOpen(true)}
                                        style={{ width: '100%', justifyContent: 'flex-start' }}
                                    />
                                </div>

                                {/* Switch para restar ingredientes (solo si hay productos con recetas) */}
                                {tieneProductosConRecetas() && (
                                    <div className={styles.content} style={{ padding: '10px 15px' }}>
                                        <Switch
                                            title="Restar ingredientes"
                                            subtitle="Restar automáticamente los ingredientes de las recetas del stock"
                                            checked={restarIngredientes}
                                            onChange={(value) => {
                                                setRestarIngredientes(value);
                                                localStorage.setItem('restarIngredientes', JSON.stringify(value));
                                            }}
                                            icon="minus-circle"
                                        />
                                    </div>
                                )}
                            </>
                        )}

                        {tipoMovimiento === 'salida' && (
                            <>
                                {/* Selector de cliente para salidas (oculto en entregas) */}
                                {!esEntrega && (
                                    <div className={styles.content} style={{ padding: '5px 15px', marginTop: 'auto' }}>
                                        <Boton
                                            className='btn-transparent'
                                            label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : 
                                                (metodoPagoSeleccionado === 'credito' ? 'Seleccionar Cliente (obligatorio)' : 'Seleccionar Cliente (opcional)')}
                                            onClick={() => setIsClientesSeleccionOpen(true)}
                                            style={{ 
                                                width: '100%', 
                                                justifyContent: 'flex-start',
                                                ...(metodoPagoSeleccionado === 'credito' && !clienteSeleccionadoData ? { borderColor: '#e74c3c', color: '#e74c3c' } : {})
                                            }}
                                        />
                                    </div>
                                )}

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
                                <span className={styles.totalGeneralValue}>Bs. {getTotalValor().toFixed(2)}</span>
                            </div>
                        </div>

                        <div className={styles.buttons}>
                            <Boton
                                className='btn-original'
                                label={esEntrega ? 'Entregar Pedido' : `Confirmar ${tipoMovimiento === 'entrada' ? 'Entrada' : 'Salida'}`}
                                onClick={esEntrega ? handleConfirmarEntrega : handleConfirmarMovimientos}
                                loading={loadingConfirmar}
                                disabled={
                                    // Deshabilitar si es salida a crédito sin cliente (excepto entregas)
                                    tipoMovimiento === 'salida' && 
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
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear {tipoMovimiento === 'entrada' ? 'entradas' : 'salidas'}</p>
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

            {/* Input de observaciones (oculto) */}
            {/* <div className={styles.observacionesGenerales}>
                <InputNormal
                    tipo="text"
                    value={observacionesGenerales}
                    placeholder="Observaciones generales"
                    onChange={(e) => setObservacionesGenerales(e.target.value)}
                />
            </div> */}

            {/* View de selección de proveedores */}
            <Proveedores
                isOpen={isProveedoresSeleccionOpen}
                setIsOpen={setIsProveedoresSeleccionOpen}
                modoSeleccion={true}
                onProveedorSeleccionado={handleProveedorSeleccionado}
            />

            {/* View de selección de clientes */}
            <Clientes
                isOpen={isClientesSeleccionOpen}
                setIsOpen={setIsClientesSeleccionOpen}
                modoSeleccion={true}
                onClienteSeleccionado={handleClienteSeleccionado}
            />

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default CanastaMovimientos;