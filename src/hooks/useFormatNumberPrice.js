import { useCallback } from 'react';

const useFormatNumberPrice = () => {
    // Redondeo seguro a 1 decimal, con compensación de punto flotante
    const roundTo1Decimal = useCallback((value) => {
        return Math.round((value + Number.EPSILON) * 10) / 10;
    }, []);

    // Lógica especial de redondeo para precios (especialmente agrupados)
    // En modo unidades: precio se devuelve tal cual, sin redondear
    // En modo agrupado: se redondea (entero para venta, 1 decimal para compra)
    const calculateSpecialPrice = useCallback((precioBase, grup, esAgrupado, esVenta) => {
        const isActuallyGrouped = esAgrupado && Number(grup) > 0;
        if (!isActuallyGrouped) {
            // Modo unidades: devolver precio sin redondear
            return Number(precioBase);
        }
        const precioCrudo = Number(precioBase) * Number(grup);
        return esVenta 
            ? Math.round(precioCrudo + Number.EPSILON) 
            : roundTo1Decimal(precioCrudo);
    }, [roundTo1Decimal]);

    // calculateSubtotal para la vista de ProductosMovimiento y ViewInfo
    // donde la 'cantidad' ya está en unidades base, y 'precio_unitario' es el precio base unitario
    const calculateSubtotal = useCallback((cantidad, precioBase, grup, esAgrupado, esVenta, precioCustom) => {
        const precio = (precioCustom !== undefined && precioCustom !== '' && precioCustom !== null)
            ? roundTo1Decimal(Number(precioCustom))
            : calculateSpecialPrice(precioBase, grup, esAgrupado, esVenta);

        // Si es agrupado, derivamos el precio unitario exacto del grupo para multiplicar por la cantidad de unidades
        const isActuallyGrouped = esAgrupado && Number(grup) > 0;
        if (isActuallyGrouped) {
            const precioUnitarioFinal = precio / Number(grup);
            return roundTo1Decimal(precioUnitarioFinal * Number(cantidad || 0));
        } else {
            // En unidades: el subtotal se saca a partir del unitario ya redondeado
            return roundTo1Decimal(precio * Number(cantidad || 0));
        }
    }, [calculateSpecialPrice, roundTo1Decimal]);

    const calculateTotalCanasta = useCallback((canastaItems, modoAgrupacion, esVenta, precioSeleccionado, getProductPrice) => {
        const total = canastaItems.reduce((acc, producto) => {
            const esAgrupado = modoAgrupacion === 'grupo' && producto.grup && producto.grup > 0;
            const precioBase = getProductPrice ? getProductPrice(producto, precioSeleccionado) : (producto.precio_unitario || producto.precio || 0);

            // Note: En la canasta "producto.cantidad" es la cantidad en grupos (si esAgrupado)
            // Por lo que el precio a multiplicar es directamente el precio agrupado (calculateSpecialPrice)
            const precio = (producto.precioCustom !== undefined && producto.precioCustom !== '' && producto.precioCustom !== null)
                ? Number(producto.precioCustom)
                : calculateSpecialPrice(precioBase, producto.grup, esAgrupado, esVenta);

            return acc + (precio * Number(producto.cantidad || 0));
        }, 0);

        return roundTo1Decimal(total);
    }, [calculateSpecialPrice, roundTo1Decimal]);

    return { calculateSpecialPrice, calculateSubtotal, calculateTotalCanasta };
};

export default useFormatNumberPrice;

