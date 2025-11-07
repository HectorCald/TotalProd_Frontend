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
            const productoExistente = prev.find(p => p.id === producto.id);

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
                    return prev.map(p =>
                        p.id === producto.id
                            ? { ...p, cantidad: cantidadEspecifica }
                            : p
                    );
                }

                return prev.map(p =>
                    p.id === producto.id
                        ? { ...p, cantidad: p.cantidad + 1 }
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
                ...prev,
                {
                    ...producto,
                    cantidad: cantidadInicial,
                    precio: precioFinal,
                    stock: stockMostrado,
                    stockOriginal: producto.stock,
                    ...pedidosExtraItemFields(producto),
                }
            ];
        });
    }, [pedidosExtraItemFields, pedidosModoGetterName, pedidosPrecioGetterName, setProductosCanasta]);

    const handleAgregarACanastaMovimientos = useCallback((producto, tipoMovimiento, precioSeleccionado = null, cantidadEspecifica = null) => {
        if (tipoMovimiento === 'salida' && (!producto.stock || producto.stock <= 0)) {
            mostrarNotificacion?.('error', 'Stock insuficiente');
            return;
        }

        const esEntrada = tipoMovimiento === 'entrada';
        const setCanastaActual = esEntrada ? setProductosCanastaEntradas : setProductosCanastaSalidas;
        const canastaActual = esEntrada ? productosCanastaEntradas : productosCanastaSalidas;

        setCanastaActual(prev => {
            const productoExistente = prev.find(p => p.id === producto.id);

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
                    return prev.map(p =>
                        p.id === producto.id
                            ? { ...p, cantidad: cantidadEspecifica }
                            : p
                    );
                }

                let stockParaValidar = producto.stock;
                let modoAgrupacionActual = null;

                if (tipoMovimiento === 'entrada' && entradaModoGetterName && typeof window[entradaModoGetterName] === 'function') {
                    modoAgrupacionActual = window[entradaModoGetterName]();
                } else if (tipoMovimiento === 'salida' && salidaModoGetterName && typeof window[salidaModoGetterName] === 'function') {
                    modoAgrupacionActual = window[salidaModoGetterName]();
                } else if (localStorage.getItem('pedidoAgrupadoEntregando')) {
                    modoAgrupacionActual = localStorage.getItem('pedidoAgrupadoEntregando');
                }

                if (modoAgrupacionActual === 'agrupado' && producto.grup) {
                    stockParaValidar = Math.floor(producto.stock / producto.grup);
                }

                if (tipoMovimiento === 'salida' && productoExistente.cantidad >= stockParaValidar) {
                    mostrarNotificacion?.('error', 'Stock insuficiente');
                    return prev;
                }

                return prev.map(p =>
                    p.id === producto.id
                        ? { ...p, cantidad: p.cantidad + 1 }
                        : p
                );
            }

            let cantidadInicial = cantidadEspecifica !== null ? cantidadEspecifica : 1;
            let precioFinal = precioProducto;
            let stockMostrado = producto.stock;

            let modoAgrupacionActual = null;
            if (tipoMovimiento === 'entrada' && entradaModoGetterName && typeof window[entradaModoGetterName] === 'function') {
                modoAgrupacionActual = window[entradaModoGetterName]();
            } else if (tipoMovimiento === 'salida' && salidaModoGetterName && typeof window[salidaModoGetterName] === 'function') {
                modoAgrupacionActual = window[salidaModoGetterName]();
            } else if (localStorage.getItem('pedidoAgrupadoEntregando')) {
                modoAgrupacionActual = localStorage.getItem('pedidoAgrupadoEntregando');
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
                ...prev,
                {
                    ...producto,
                    cantidad: cantidadInicial,
                    precio: precioFinal,
                    stock: stockMostrado,
                    stockOriginal: producto.stock,
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

