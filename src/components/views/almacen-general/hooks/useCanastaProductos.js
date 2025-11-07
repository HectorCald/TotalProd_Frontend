import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Hook reutilizable para centralizar la lógica compartida entre las canastas (pedidos, entradas, salidas).
 *
 * Maneja:
 * - Selección y recalculo de precios según el tipo de precio y la modalidad (agrupado/unidades)
 * - Cambio de modalidad agrupada con ajuste de stock/cantidad cuando corresponde
 * - Sincronización de los productos con los datos más recientes del backend
 * - Persistencia opcional en localStorage
 * - Auto-focus en el último input de cantidad (modo carrito)
 * - Exposición opcional de helpers globales (window.*) para otros componentes
 */
function useCanastaProductos({
    isOpen,
    productosCanasta,
    setProductosCanasta,
    preciosTipos = [],
    productosActualizados = [],
    localStorageKey = null,
    shouldPersistLocalStorage = true,
    persistWhenEmpty = false,
    shouldLoadLocalStorage = true,
    resolveInitialPrecioId,
    resolveInitialModoAgrupacion,
    onLocalStorageLoad,
    exposeGlobals,
    isCartMode = false,
    onSyncProducto,
    onAfterModoAgrupacionChange,
    onPrecioChangeApplied,
}) {
    const [precioSeleccionado, setPrecioSeleccionado] = useState('');
    const [modoAgrupacion, setModoAgrupacion] = useState('agrupado');
    const [animarCantidad, setAnimarCantidad] = useState({});
    const cantidadInputRefs = useRef({});
    const animationTimeoutsRef = useRef({});

    const redondearPrecio = useCallback((precio) => {
        if (Number.isNaN(precio)) return 0;
        const decimal = precio % 1;
        if (decimal >= 0.5) {
            return Math.ceil(precio);
        }
        return Math.floor(precio);
    }, []);

    const obtenerPrecioPorTipo = useCallback((producto, tipoPrecioId, modo = modoAgrupacion) => {
        if (!producto) return 0;
        if (!tipoPrecioId) {
            return producto.precio || 0;
        }
        const precioTipo = producto.price_product?.find(pp => pp.prices_types?.id === tipoPrecioId);
        const precioUnitario = precioTipo?.valor ?? 0;

        if (modo === 'agrupado' && producto.grup) {
            const precioAgrupado = precioUnitario * (producto.grup || 1);
            return redondearPrecio(precioAgrupado);
        }
        return precioUnitario;
    }, [modoAgrupacion, redondearPrecio]);

    const handleCambiarTipoPrecio = useCallback((nuevoTipoPrecio) => {
        setPrecioSeleccionado(nuevoTipoPrecio);
        if (!nuevoTipoPrecio) return;

        setProductosCanasta(prev => {
            if (!prev || prev.length === 0) return prev;

            let huboCambios = false;
            const actualizados = prev.map(producto => {
                const nuevoPrecio = obtenerPrecioPorTipo(producto, nuevoTipoPrecio);
                if (nuevoPrecio !== producto.precio) {
                    huboCambios = true;
                    return {
                        ...producto,
                        precio: nuevoPrecio
                    };
                }
                return producto;
            });

            return huboCambios ? actualizados : prev;
        });

        if (typeof onPrecioChangeApplied === 'function') {
            onPrecioChangeApplied(nuevoTipoPrecio);
        }
    }, [obtenerPrecioPorTipo, onPrecioChangeApplied, setProductosCanasta]);

    const handleCambiarModoAgrupacion = useCallback((nuevoModo) => {
        if (!nuevoModo || nuevoModo === modoAgrupacion) return;

        setModoAgrupacion(nuevoModo);

        setProductosCanasta(prev => {
            if (!prev || prev.length === 0) return prev;

            let huboCambios = false;
            const actualizados = prev.map(producto => {
                const stockOriginalEnUnidades = producto.stockOriginal ?? producto.stock;
                const productoActualizado = {
                    ...producto,
                    stockOriginal: stockOriginalEnUnidades
                };

                if (nuevoModo === 'agrupado' && producto.grup) {
                    const stockEnGrupos = Math.floor((stockOriginalEnUnidades || 0) / (producto.grup || 1));
                    productoActualizado.stock = stockEnGrupos;
                    productoActualizado.precio = obtenerPrecioPorTipo(producto, precioSeleccionado, 'agrupado');

                    if (producto.cantidad > stockEnGrupos) {
                        const cantidadAnterior = producto.cantidad;
                        productoActualizado.cantidad = stockEnGrupos;
                        if (stockEnGrupos < cantidadAnterior) {
                            huboCambios = true;
                            if (typeof onAfterModoAgrupacionChange === 'function') {
                                onAfterModoAgrupacionChange({
                                    producto,
                                    cantidadAnterior,
                                    cantidadNueva: stockEnGrupos
                                });
                            }
                        }
                    }
                } else {
                    productoActualizado.stock = stockOriginalEnUnidades;
                    productoActualizado.precio = obtenerPrecioPorTipo(producto, precioSeleccionado, 'no_agrupado');
                }

                // Detectar si hubo cambios significativos (precio/stock/cantidad)
                if (
                    productoActualizado.stock !== producto.stock ||
                    productoActualizado.precio !== producto.precio ||
                    productoActualizado.cantidad !== producto.cantidad ||
                    productoActualizado.stockOriginal !== producto.stockOriginal
                ) {
                    huboCambios = true;
                    return productoActualizado;
                }

                return producto;
            });

            return huboCambios ? actualizados : prev;
        });
    }, [
        modoAgrupacion,
        obtenerPrecioPorTipo,
        onAfterModoAgrupacionChange,
        precioSeleccionado,
        setProductosCanasta
    ]);

    const handleActualizarPrecioManual = useCallback((productoId, nuevoPrecio) => {
        const precioNormalizado = parseFloat(nuevoPrecio);
        setProductosCanasta(prev => prev.map(producto =>
            producto.id === productoId
                ? { ...producto, precio: Number.isNaN(precioNormalizado) ? 0 : precioNormalizado }
                : producto
        ));
    }, [setProductosCanasta]);

    const triggerAnimacionCantidad = useCallback((productoId) => {
        if (!productoId) return;

        setAnimarCantidad(prev => ({
            ...prev,
            [productoId]: true
        }));

        if (animationTimeoutsRef.current[productoId]) {
            clearTimeout(animationTimeoutsRef.current[productoId]);
        }

        animationTimeoutsRef.current[productoId] = setTimeout(() => {
            setAnimarCantidad(prev => ({
                ...prev,
                [productoId]: false
            }));
        }, 300);
    }, []);

    const registerCantidadInputRef = useCallback((productoId) => (elemento) => {
        if (elemento) {
            cantidadInputRefs.current[productoId] = elemento;
        } else {
            delete cantidadInputRefs.current[productoId];
        }
    }, []);

    const prepararProductos = useCallback(() => {
        return (productosCanasta || []).map(producto => {
            let cantidadEnUnidades = producto.cantidad;
            let precioPorUnidad = producto.precio || 0;

            if (modoAgrupacion === 'agrupado' && producto.grup) {
                cantidadEnUnidades = (producto.cantidad || 0) * producto.grup;
                precioPorUnidad = (producto.precio || 0) / (producto.grup || 1);
            }

            return {
                id: producto.id,
                cantidad: cantidadEnUnidades,
                precio: precioPorUnidad
            };
        });
    }, [modoAgrupacion, productosCanasta]);

    useEffect(() => {
        if (!isOpen) return;
        if (!preciosTipos || preciosTipos.length === 0) return;

        setPrecioSeleccionado(prev => {
            const existePrevio = prev && preciosTipos.some(pt => pt.value === prev);
            if (existePrevio) {
                return prev;
            }

            let precioInicial = null;
            if (typeof resolveInitialPrecioId === 'function') {
                precioInicial = resolveInitialPrecioId(preciosTipos);
            }

            if (!precioInicial && preciosTipos[0]) {
                precioInicial = preciosTipos[0].value;
            }

            return precioInicial || '';
        });
    }, [isOpen, preciosTipos, resolveInitialPrecioId]);

    useEffect(() => {
        if (!isOpen) return;
        if (typeof resolveInitialModoAgrupacion !== 'function') return;

        const modoInicial = resolveInitialModoAgrupacion();
        if (modoInicial === 'agrupado' || modoInicial === 'no_agrupado') {
            setModoAgrupacion(modoInicial);
        }
    }, [isOpen, resolveInitialModoAgrupacion]);

    useEffect(() => {
        if (!isOpen) return;
        if (!localStorageKey || !shouldLoadLocalStorage) return;

        const dataGuardada = localStorage.getItem(localStorageKey);
        if (!dataGuardada) return;

        try {
            const parsed = JSON.parse(dataGuardada);
            const productosNormalizados = typeof onLocalStorageLoad === 'function'
                ? onLocalStorageLoad(parsed)
                : parsed;

            if (Array.isArray(productosNormalizados)) {
                setProductosCanasta(productosNormalizados);
            }
        } catch (error) {
            console.error('Error al cargar canasta desde localStorage:', error);
        }
    }, [
        isOpen,
        localStorageKey,
        onLocalStorageLoad,
        setProductosCanasta,
        shouldLoadLocalStorage
    ]);

    useEffect(() => {
        if (!shouldPersistLocalStorage || !localStorageKey) return;
        if (!productosCanasta) return;

        if (productosCanasta.length === 0 && !persistWhenEmpty) {
            return;
        }

        try {
            localStorage.setItem(localStorageKey, JSON.stringify(productosCanasta));
        } catch (error) {
            console.error('Error al guardar canasta en localStorage:', error);
        }
    }, [localStorageKey, persistWhenEmpty, productosCanasta, shouldPersistLocalStorage]);

    useEffect(() => {
        if (!productosActualizados || productosActualizados.length === 0) return;
        if (!productosCanasta || productosCanasta.length === 0) return;

        setProductosCanasta(prev => {
            if (!prev || prev.length === 0) return prev;

            let huboCambios = false;
            const actualizados = prev.map(productoCarrito => {
                const productoActualizado = productosActualizados.find(p => p.id === productoCarrito.id);
                if (!productoActualizado) {
                    return productoCarrito;
                }

                if (typeof onSyncProducto === 'function') {
                    const resultado = onSyncProducto({
                        productoCarrito,
                        productoActualizado,
                        modoAgrupacion,
                        precioSeleccionado,
                        obtenerPrecioPorTipo,
                        redondearPrecio
                    });

                    if (resultado === null) {
                        huboCambios = true;
                        return null;
                    }

                    if (resultado) {
                        const cambioDetectado = (
                            resultado.stock !== productoCarrito.stock ||
                            resultado.precio !== productoCarrito.precio ||
                            resultado.cantidad !== productoCarrito.cantidad ||
                            resultado.stockOriginal !== productoCarrito.stockOriginal ||
                            resultado.price_product !== productoCarrito.price_product
                        );

                        if (cambioDetectado) {
                            huboCambios = true;
                        }

                        return resultado;
                    }

                    return productoCarrito;
                }

                const productoModificado = {
                    ...productoCarrito,
                    stock: productoActualizado.stock,
                    price_product: productoActualizado.price_product
                };
                const precioRecalculado = obtenerPrecioPorTipo(productoModificado, precioSeleccionado);
                if (precioRecalculado !== productoModificado.precio) {
                    productoModificado.precio = precioRecalculado;
                }

                if (
                    productoModificado.stock !== productoCarrito.stock ||
                    productoModificado.precio !== productoCarrito.precio
                ) {
                    huboCambios = true;
                    return productoModificado;
                }

                return productoCarrito;
            }).filter(producto => producto !== null);

            return huboCambios ? actualizados : prev;
        });
    }, [
        modoAgrupacion,
        obtenerPrecioPorTipo,
        onSyncProducto,
        precioSeleccionado,
        productosActualizados,
        productosCanasta,
        redondearPrecio,
        setProductosCanasta
    ]);

    useEffect(() => {
        if (!isCartMode) return;
        if (!productosCanasta || productosCanasta.length === 0) return;

        const ultimoProducto = productosCanasta[productosCanasta.length - 1];
        if (!ultimoProducto) return;

        const inputRef = cantidadInputRefs.current[ultimoProducto.id];
        if (!inputRef) return;

        const timeoutId = setTimeout(() => {
            inputRef.focus();
            if (typeof inputRef.select === 'function') {
                inputRef.select();
            }
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [isCartMode, productosCanasta]);

    useEffect(() => {
        if (!exposeGlobals) return;

        const { precioGetterName, modoGetterName } = exposeGlobals;

        if (precioGetterName) {
            window[precioGetterName] = () => precioSeleccionado;
        }
        if (modoGetterName) {
            window[modoGetterName] = () => modoAgrupacion;
        }

        return () => {
            if (precioGetterName && window[precioGetterName]) {
                delete window[precioGetterName];
            }
            if (modoGetterName && window[modoGetterName]) {
                delete window[modoGetterName];
            }
        };
    }, [exposeGlobals, modoAgrupacion, precioSeleccionado]);

    useEffect(() => {
        const timeouts = animationTimeoutsRef.current;
        return () => {
            Object.values(timeouts).forEach(clearTimeout);
        };
    }, []);

    return {
        precioSeleccionado,
        setPrecioSeleccionado,
        modoAgrupacion,
        setModoAgrupacion,
        animarCantidad,
        cantidadInputRefs,
        registerCantidadInputRef,
        redondearPrecio,
        handleCambiarTipoPrecio,
        handleCambiarModoAgrupacion,
        handleActualizarPrecioManual,
        triggerAnimacionCantidad,
        prepararProductos,
    };
}

export default useCanastaProductos;

