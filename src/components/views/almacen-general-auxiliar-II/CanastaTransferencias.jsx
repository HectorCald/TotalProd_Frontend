import React, { useState, useEffect, useCallback, useRef } from 'react';
import styles from '../../styles/Canasta.module.css';
import View from '../../ui/View';
import HeaderView from '../../common/HeaderView';
import Boton from '../../common/Boton';
import Select from '../../common/Select';
import { BoxIcon } from 'boxicons-react';
import { motion } from 'framer-motion';
import Notification from '../../common/Notification';
import LimpiarCanasta from '../../mixed/LimpiarCanasta';
import InputNormal from '../../common/InputNormal';
import transferenciasAlmacenService from '../../../services/transferenciasAlmacenService';
import useCanastaProductos from '../almacen-general/hooks/useCanastaProductos';
import calcularStockDisponible from '../almacen-general/hooks/useStockDisponible';
import { useLayout } from '../../../context/LayoutContext';
import Clientes from '../clientes/Clientes';
import SelectorSucursal from '../../mixed/SelectorSucursal';

function CanastaTransferencias({ isOpen, setIsOpen, productosCanasta, setProductosCanasta, onCerrarCanasta, onProductosUpdated, preciosTipos = [], loadingPrecios = false, productosActualizados = [], isCartMode = false }) {
    const { isLargeScreen } = useLayout();
    const [observacionesGenerales, setObservacionesGenerales] = useState('');
    const [isLimpiarModalOpen, setIsLimpiarModalOpen] = useState(false);
    const [loadingConfirmar, setLoadingConfirmar] = useState(false);
    const [sucursalSeleccionada, setSucursalSeleccionada] = useState('');
    const [concepto, setConcepto] = useState('');
    const [clienteSeleccionado, setClienteSeleccionado] = useState('');
    const [isClientesSeleccionOpen, setIsClientesSeleccionOpen] = useState(false);
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

    const resolvePrecioInicial = useCallback((tipos) => {
        if (!tipos || tipos.length === 0) return null;
        const precioIdRepitiendo = localStorage.getItem('precioIdTransferenciaRepitiendo');
        if (precioIdRepitiendo && tipos.find(p => p.value === precioIdRepitiendo)) {
            return precioIdRepitiendo;
        }
        return tipos[0]?.value ?? null;
    }, []);

    const resolveModoInicial = useCallback(() => {
        const modoTransferencia = localStorage.getItem('transferenciaAgrupadoRepitiendo');
        if (modoTransferencia === 'agrupado' || modoTransferencia === 'no_agrupado') {
            return modoTransferencia;
        }
        return null;
    }, []);

    // Ref para almacenar setModoAgrupacion (se actualizará después de obtenerlo del hook)
    const setModoAgrupacionRef = useRef(null);

    const syncProductoTransferencia = useCallback(({
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
        localStorageKey: 'canastaTransferencias',
        shouldPersistLocalStorage: true,
        shouldLoadLocalStorage: true,
        resolveInitialPrecioId: resolvePrecioInicial,
        resolveInitialModoAgrupacion: resolveModoInicial,
        exposeGlobals: {
            precioGetterName: 'getPrecioSeleccionadoCanastaTransferencias',
            modoGetterName: 'getModoAgrupacionCanastaTransferencias'
        },
        isCartMode,
        autoFocusCantidad: true,
        onSyncProducto: syncProductoTransferencia,
        onAfterModoAgrupacionChange: ({ producto, cantidadNueva }) => {
            if (producto?.name && cantidadNueva !== undefined) {
                mostrarNotificacion('warning', `La cantidad de ${producto.name} se ajustó al máximo disponible: ${cantidadNueva} grupos`);
            }
        }
    });

    // Actualizar el ref con setModoAgrupacion
    useEffect(() => {
        setModoAgrupacionRef.current = setModoAgrupacion;
    }, [setModoAgrupacion]);

    const prepararProductosTransferencia = useCallback(() => {
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

        // Validar que no exceda el stock disponible (como en salidas)
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

    const handleCambiarTipoPrecio = (nuevoTipoPrecio) => {
        cambiarTipoPrecio(nuevoTipoPrecio);
    };

    const handleCambiarModoAgrupacion = (nuevoModo) => {
        cambiarModoAgrupacion(nuevoModo);
    };

    // El SelectorSucursal maneja la carga y el valor por defecto internamente

    // Cargar valores guardados cuando se abre (solo si no hay valores ya establecidos)
    useEffect(() => {
        if (isOpen) {
            // Cargar concepto guardado
            const conceptoGuardado = localStorage.getItem('conceptoTransferenciaGuardado');
            if (conceptoGuardado && !concepto) {
                setConcepto(conceptoGuardado);
            }
            
            // Cargar cliente guardado
            const clienteIdGuardado = localStorage.getItem('clienteIdTransferenciaGuardado');
            const clienteNameGuardado = localStorage.getItem('clienteNameTransferenciaGuardado');
            if (clienteIdGuardado && clienteNameGuardado && !clienteSeleccionado) {
                setClienteSeleccionadoData({
                    id: clienteIdGuardado,
                    name: clienteNameGuardado
                });
                setClienteSeleccionado(clienteIdGuardado);
            }
            
            // Cargar sucursal guardada
            const sucursalGuardada = localStorage.getItem('sucursalTransferenciaGuardada');
            if (sucursalGuardada && !sucursalSeleccionada) {
                setSucursalSeleccionada(sucursalGuardada);
            }
        }
    }, [isOpen]);

    // Guardar valores en localStorage cuando cambian
    useEffect(() => {
        if (concepto && concepto.trim() !== '') {
            localStorage.setItem('conceptoTransferenciaGuardado', concepto.trim());
        }
    }, [concepto]);

    useEffect(() => {
        if (clienteSeleccionadoData) {
            localStorage.setItem('clienteIdTransferenciaGuardado', clienteSeleccionadoData.id);
            localStorage.setItem('clienteNameTransferenciaGuardado', clienteSeleccionadoData.name);
        }
    }, [clienteSeleccionadoData]);

    useEffect(() => {
        if (sucursalSeleccionada) {
            localStorage.setItem('sucursalTransferenciaGuardada', sucursalSeleccionada);
        }
    }, [sucursalSeleccionada]);

    const handleClienteSeleccionado = (cliente) => {
        setClienteSeleccionadoData(cliente);
        setClienteSeleccionado(cliente.id);
        setIsClientesSeleccionOpen(false);
    };

    const handleLimpiarCanasta = () => {
        setProductosCanasta([]);
        // Limpiar también el localStorage
        localStorage.removeItem('canastaTransferencias');
        // Limpiar variables de repetición
        localStorage.removeItem('precioIdTransferenciaRepitiendo');
        localStorage.removeItem('transferenciaAgrupadoRepitiendo');
        localStorage.removeItem('conceptoTransferenciaRepitiendo');
        localStorage.removeItem('productosTransferenciaRepitiendo');
        localStorage.removeItem('sucursalDestinoTransferenciaRepitiendo');
        localStorage.removeItem('clienteIdTransferenciaRepitiendo');
        localStorage.removeItem('clienteNameTransferenciaRepitiendo');
        // Limpiar valores guardados
        localStorage.removeItem('conceptoTransferenciaGuardado');
        localStorage.removeItem('clienteIdTransferenciaGuardado');
        localStorage.removeItem('clienteNameTransferenciaGuardado');
        localStorage.removeItem('sucursalTransferenciaGuardada');
        setSucursalSeleccionada('');
        setConcepto('');
        setClienteSeleccionado('');
        setClienteSeleccionadoData(null);
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
    // Validaciones para transferencias (como en salidas)
    const validarTransferencia = () => {
        // VALIDAR STOCK ANTES DE CUALQUIER OTRA VALIDACIÓN
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

        // Validar sucursal seleccionada
        if (!sucursalSeleccionada) {
            mostrarNotificacion('error', 'La sucursal es obligatoria');
            return false;
        }

        // Validar precio seleccionado
        if (!precioSeleccionado) {
            mostrarNotificacion('error', 'El precio es obligatorio');
            return false;
        }

        return true;
    };

    const handleConfirmar = async () => {
        setLoadingConfirmar(true);
        try {
            // Validar transferencia
            if (!validarTransferencia()) {
                setLoadingConfirmar(false);
                return;
            }

            const productosTransferencia = prepararProductosTransferencia();

            // Preparar datos para la transferencia
            const transferenciaData = {
                concepto: concepto && concepto.trim() !== '' ? concepto.trim() : null,
                sucu_destino_id: sucursalSeleccionada,
                agrupado: modoAgrupacion === 'agrupado',
                precio_id: precioSeleccionado, // Requerido según la tabla
                cliente_id: clienteSeleccionado || null,
                productos: productosTransferencia
            };

            // Crear la transferencia
            const result = await transferenciasAlmacenService.create(transferenciaData);

            if (!result.success) {
                mostrarNotificacion('error', result.message || 'Error al crear la transferencia');
                setLoadingConfirmar(false);
                return;
            }

            // Calcular stocks actualizados (restar las cantidades transferidas)
            const productosStockActualizados = productosTransferencia.map(pu => {
                const prodActual = (productosActualizados || []).find(p => p.id === pu.id);
                const stockBase = prodActual ? (prodActual.stock || 0) : 0;
                // Para transferencias, restar la cantidad transferida del stock
                const nuevoStock = Math.max(0, stockBase - pu.cantidad);
                return { id: pu.id, stock: nuevoStock };
            });

            // Actualizar productos en el componente padre
            if (onProductosUpdated) {
                onProductosUpdated(productosStockActualizados);
            }

            // Guardar concepto en localStorage antes de limpiar (para repetición)
            if (concepto && concepto.trim() !== '') {
                localStorage.setItem('conceptoTransferenciaRepitiendo', concepto.trim());
            }

            // Guardar cliente en localStorage antes de limpiar (para repetición)
            if (clienteSeleccionadoData) {
                localStorage.setItem('clienteIdTransferenciaRepitiendo', clienteSeleccionadoData.id);
                localStorage.setItem('clienteNameTransferenciaRepitiendo', clienteSeleccionadoData.name);
            }

            // Limpiar canasta y cerrar
            setProductosCanasta([]);
            setObservacionesGenerales('');
            setSucursalSeleccionada('');
            setConcepto('');
            setClienteSeleccionado('');
            setClienteSeleccionadoData(null);
            localStorage.removeItem('canastaTransferencias');

            // Limpiar variables de repetición
            localStorage.removeItem('precioIdTransferenciaRepitiendo');
            localStorage.removeItem('transferenciaAgrupadoRepitiendo');
            localStorage.removeItem('conceptoTransferenciaRepitiendo');
            localStorage.removeItem('productosTransferenciaRepitiendo');
            localStorage.removeItem('sucursalDestinoTransferenciaRepitiendo');
            localStorage.removeItem('clienteIdTransferenciaRepitiendo');
            localStorage.removeItem('clienteNameTransferenciaRepitiendo');

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
    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen} isCart={isCartMode}>
            <HeaderView
                title="Canasta de Transferencias"
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
                                                    {(() => {
                                                        // Calcular stock disponible restando la cantidad en la canasta
                                                        const stockInfo = calcularStockDisponible({
                                                            producto: {
                                                                ...producto,
                                                                stock: producto.stockOriginal || producto.stock || 0
                                                            },
                                                            tipo: 'transferir',
                                                            cantidadEnCanasta: producto.cantidad,
                                                            cantidadEnCanastaMovimientos: 0,
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
                            {/* Controles específicos para transferencias */}
                            <>
                                <hr className={styles.hr} />
                                {/* Selector de sucursal */}
                                <SelectorSucursal
                                    value={sucursalSeleccionada}
                                    onChange={setSucursalSeleccionada}
                                    placeholder='Sucursal de destino (obligatorio)'
                                    excludeCurrentSucursal={true}
                                    openUpward={true}
                                />

                                {/* Selector de cliente para transferencias */}
                                <Boton
                                    className='btn-gray'
                                    label={clienteSeleccionadoData ? 'Cliente: ' + clienteSeleccionadoData.name : 'Seleccionar Cliente (opcional)'}
                                    onClick={() => setIsClientesSeleccionOpen(true)}
                                    style={{
                                        width: '100%',
                                        justifyContent: 'flex-start'
                                    }}
                                />

                                {/* Campo de concepto */}
                                <InputNormal
                                    placeholder="Concepto (opcional)"
                                    tipo="text"
                                    value={concepto}
                                    onChange={(e) => setConcepto(e.target.value)}
                                    icon='text'
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
                                label='Realizar Transferencia'
                                onClick={handleConfirmar}
                                loading={loadingConfirmar}
                                disabled={!sucursalSeleccionada || !precioSeleccionado}
                            />
                        </div>
                    </>
                ) : (
                    <div className={styles.canastaVacia}>
                        <BoxIcon name='cart' className={styles.iconoVacio} />
                        <p>Tu canasta está vacía</p>
                        <p className={styles.subtexto}>Agrega productos desde la lista para crear transferencias</p>
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

export default CanastaTransferencias;