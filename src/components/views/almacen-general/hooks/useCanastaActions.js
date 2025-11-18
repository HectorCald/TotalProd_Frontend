import { useCallback } from 'react';

const redondearPrecio = (precio) => {
    const decimal = precio % 1;
    if (decimal >= 0.5) {
        return Math.ceil(precio);
    }
    return Math.floor(precio);
};

function useCanastaActions({
    setProductosCanasta = () => {},
    setProductosCanastaEntradas = () => {},
    setProductosCanastaSalidas = () => {},
    productosCanasta = [],
    productosCanastaEntradas = [],
    productosCanastaSalidas = [],
    mostrarNotificacion,
    pedidosConfig = {},
    movimientosEntradaConfig = {},
    movimientosSalidaConfig = {},
}) {
    const {
        precioGetterName: pedidosPrecioGetterName = 'getPrecioSeleccionadoCanastaPedidos',
        modoGetterName: pedidosModoGetterName = 'getModoAgrupacionCanastaPedidos',
        extraItemFields: pedidosExtraItemFields = () => ({
            medidaPedido: 'kg',
            observacionesPedido: '',
        }),
    } = pedidosConfig || {};

    const {
        precioGetterName: entradaPrecioGetterName = 'getPrecioSeleccionadoCanastaMovimientosEntrada',
        modoGetterName: entradaModoGetterName = 'getModoAgrupacionCanastaMovimientosEntrada',
    } = movimientosEntradaConfig || {};

    const {
        precioGetterName: salidaPrecioGetterName = 'getPrecioSeleccionadoCanastaMovimientos',
        modoGetterName: salidaModoGetterName = 'getModoAgrupacionCanastaMovimientos',
    } = movimientosSalidaConfig || {};

    const handleAgregarACanasta = useCallback((producto, cantidadEspecifica = null) => {
        setProductosCanasta(prev => {
            const prevSanitizados = prev.map(p => {
                if (p.__shouldFocus) {
                    const { __shouldFocus, ...rest } = p;
                    return rest;
                }
                return p;
            });

            // Validar compatibilidad de productos asociados/no asociados
            if (prevSanitizados.length > 0) {
                const productoNuevoEsAsociado = producto.es_asociado === true;
                const primerProductoEnCanasta = prevSanitizados[0];
                const primerProductoEsAsociado = primerProductoEnCanasta.es_asociado === true;

                // Si hay un producto no asociado en la canasta, no se puede agregar uno asociado
                if (!primerProductoEsAsociado && productoNuevoEsAsociado) {
                    if (mostrarNotificacion) {
                        mostrarNotificacion('error', 'No se pueden mezclar productos asociados con productos propios en el mismo pedido');
                    }
                    return prevSanitizados; // No agregar el producto
                }

                // Si hay un producto asociado en la canasta, no se puede agregar uno no asociado
                if (primerProductoEsAsociado && !productoNuevoEsAsociado) {
                    if (mostrarNotificacion) {
                        mostrarNotificacion('error', 'No se pueden mezclar productos propios con productos asociados en el mismo pedido');
                    }
                    return prevSanitizados; // No agregar el producto
                }
            }

            const productoExistente = prevSanitizados.find(p => p.id === producto.id);

            let precioProducto = 0;
            let precioActual = null;

            if (pedidosPrecioGetterName && typeof window[pedidosPrecioGetterName] === 'function') {
                precioActual = window[pedidosPrecioGetterName]();
            }

            if (precioActual && producto.price_product && producto.price_product.length > 0) {
                const precioTipo = producto.price_product.find(pp => pp.prices_types?.id === precioActual);
                precioProducto = precioTipo ? precioTipo.valor : (producto.price_product[0]?.valor || 0);
            } else {
                precioProducto = producto.price_product && producto.price_product.length > 0
                    ? producto.price_product[0].valor
                    : 0;
            }

            if (productoExistente) {
                if (cantidadEspecifica !== null) {
                    return prevSanitizados.map(p =>
                        p.id === producto.id
                            ? { ...p, cantidad: cantidadEspecifica, __shouldFocus: true }
                            : p
                    );
                }

                return prevSanitizados.map(p =>
                    p.id === producto.id
                        ? { ...p, cantidad: p.cantidad + 1, __shouldFocus: true }
                        : p
                );
            }

            let cantidadInicial = cantidadEspecifica !== null ? cantidadEspecifica : 1;
            let precioFinal = precioProducto;
            let stockMostrado = producto.stock;

            let modoAgrupacionActual = null;
            if (pedidosModoGetterName && typeof window[pedidosModoGetterName] === 'function') {
                modoAgrupacionActual = window[pedidosModoGetterName]();
            }

            if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                if (cantidadEspecifica === null) {
                    cantidadInicial = 1;
                }
                precioFinal = precioProducto * (producto.grup || 1);
                precioFinal = redondearPrecio(precioFinal);
                stockMostrado = Math.floor((producto.stock || 0) / (producto.grup || 1));
            }

            return [
                ...prevSanitizados,
                {
                    ...producto,
                    cantidad: cantidadInicial,
                    precio: precioFinal,
                    stock: stockMostrado,
                    stockOriginal: producto.stock,
                    __shouldFocus: true,
                    ...pedidosExtraItemFields(producto),
                }
            ];
        });
    }, [pedidosExtraItemFields, pedidosModoGetterName, pedidosPrecioGetterName, setProductosCanasta, mostrarNotificacion]);

    const handleAgregarACanastaMovimientos = useCallback((producto, tipoMovimiento, precioSeleccionado = null, cantidadEspecifica = null) => {
        const esEntrada = tipoMovimiento === 'entrada';
        const setCanastaActual = esEntrada ? setProductosCanastaEntradas : setProductosCanastaSalidas;
        const canastaActual = esEntrada ? productosCanastaEntradas : productosCanastaSalidas;

        // Obtener modo de agrupación actual para validar stock
        let modoAgrupacionActual = null;
        if (tipoMovimiento === 'entrada' && entradaModoGetterName && typeof window[entradaModoGetterName] === 'function') {
            modoAgrupacionActual = window[entradaModoGetterName]();
        } else if (tipoMovimiento === 'salida' && salidaModoGetterName && typeof window[salidaModoGetterName] === 'function') {
            modoAgrupacionActual = window[salidaModoGetterName]();
        } else if (localStorage.getItem('pedidoAgrupadoEntregando')) {
            modoAgrupacionActual = localStorage.getItem('pedidoAgrupadoEntregando');
        }

        // Validar stock ANTES de agregar (solo para salidas)
        if (!esEntrada) {
            const stockDisponible = producto.stock || 0;
            let stockNecesario = cantidadEspecifica !== null ? cantidadEspecifica : 1;
            
            // Si está en modo agrupado, validar en grupos
            if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                const gruposDisponibles = Math.floor(stockDisponible / (producto.grup || 1));
                if (gruposDisponibles < stockNecesario) {
                    return; // No agregar el producto
                }
            } else {
                // Validar en unidades
                if (stockDisponible < stockNecesario) {
                    return; // No agregar el producto
                }
            }

            // Si el producto ya existe, validar que al incrementar no exceda el stock
            const productoExistente = canastaActual.find(p => p.id === producto.id);
            if (productoExistente) {
                const cantidadActual = productoExistente.cantidad;
                const cantidadNueva = cantidadEspecifica !== null ? cantidadEspecifica : cantidadActual + 1;
                
                if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                    const gruposDisponibles = Math.floor(stockDisponible / (producto.grup || 1));
                    if (cantidadNueva > gruposDisponibles) {
                        return; // No incrementar
                    }
                } else {
                    if (cantidadNueva > stockDisponible) {
                        return; // No incrementar
                    }
                }
            }
        }

        setCanastaActual(prev => {
            const prevSanitizados = prev.map(p => {
                if (p.__shouldFocus) {
                    const { __shouldFocus, ...rest } = p;
                    return rest;
                }
                return p;
            });

            const productoExistente = prevSanitizados.find(p => p.id === producto.id);

            let precioProducto = 0;
            let precioActual = precioSeleccionado;

            if (!precioActual) {
                if (tipoMovimiento === 'entrada' && entradaPrecioGetterName && typeof window[entradaPrecioGetterName] === 'function') {
                    precioActual = window[entradaPrecioGetterName]();
                } else if (tipoMovimiento === 'salida' && salidaPrecioGetterName && typeof window[salidaPrecioGetterName] === 'function') {
                    precioActual = window[salidaPrecioGetterName]();
                }
            }

            if (precioActual && producto.price_product && producto.price_product.length > 0) {
                const precioTipo = producto.price_product.find(pp => pp.prices_types?.id === precioActual);
                precioProducto = precioTipo ? precioTipo.valor : (producto.price_product[0]?.valor || 0);
            } else {
                precioProducto = producto.price_product && producto.price_product.length > 0
                    ? producto.price_product[0].valor
                    : 0;
            }

            if (productoExistente) {
                if (cantidadEspecifica !== null) {
                    return prevSanitizados.map(p =>
                        p.id === producto.id
                            ? { ...p, cantidad: cantidadEspecifica, __shouldFocus: true }
                            : p
                    );
                }


                return prevSanitizados.map(p =>
                    p.id === producto.id
                        ? { ...p, cantidad: p.cantidad + 1, __shouldFocus: true }
                        : p
                );
            }

            let cantidadInicial = cantidadEspecifica !== null ? cantidadEspecifica : 1;
            let precioFinal = precioProducto;
            let stockMostrado = producto.stock;

            if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                if (cantidadEspecifica === null) {
                    cantidadInicial = 1;
                }
                precioFinal = precioProducto * (producto.grup || 1);
                precioFinal = redondearPrecio(precioFinal);
                stockMostrado = Math.floor((producto.stock || 0) / (producto.grup || 1));
            }

            return [
                ...prevSanitizados,
                {
                    ...producto,
                    cantidad: cantidadInicial,
                    precio: precioFinal,
                    stock: stockMostrado,
                    stockOriginal: producto.stock,
                    __shouldFocus: true,
                }
            ];
        });
    }, [
        productosCanastaEntradas,
        productosCanastaSalidas,
        setProductosCanastaEntradas,
        setProductosCanastaSalidas,
        mostrarNotificacion,
        entradaModoGetterName,
        entradaPrecioGetterName,
        salidaModoGetterName,
        salidaPrecioGetterName,
    ]);

    const getCantidadEnCanasta = useCallback((productoId) => {
        const producto = productosCanasta.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    }, [productosCanasta]);

    const getCantidadEnCanastaMovimientos = useCallback((productoId, tipoMovimiento) => {
        const esEntrada = tipoMovimiento === 'entrada';
        const canastaActual = esEntrada ? productosCanastaEntradas : productosCanastaSalidas;
        const producto = canastaActual.find(p => p.id === productoId);
        return producto ? producto.cantidad : 0;
    }, [productosCanastaEntradas, productosCanastaSalidas]);

    return {
        handleAgregarACanasta,
        handleAgregarACanastaMovimientos,
        getCantidadEnCanasta,
        getCantidadEnCanastaMovimientos,
    };
}

export default useCanastaActions;

