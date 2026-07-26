import { useCallback } from 'react';

const useFormatNumberPrice = () => {
    // Lógica especial de redondeo para precios (especialmente agrupados)
    // Coincide con la lógica matemática utilizada originalmente en la canasta
    const calculateSpecialPrice = useCallback((precioBase, grup, esAgrupado, esVenta) => {
        const precioCrudo = esAgrupado ? (Number(precioBase) * Number(grup || 1)) : Number(precioBase);
        // Si es venta y está agrupado, se aplica el redondeo de la canasta
        const precioRedondeado = (esVenta && esAgrupado) ? Math.round(precioCrudo) : precioCrudo;
        return precioRedondeado;
    }, []);

    // calculateSubtotal para la vista de ProductosMovimiento y ViewInfo
    // donde la 'cantidad' ya está en unidades base, y 'precio_unitario' es el precio base unitario
    const calculateSubtotal = useCallback((cantidad, precioBase, grup, esAgrupado, esVenta, precioCustom) => {
        const precio = (precioCustom !== undefined && precioCustom !== '' && precioCustom !== null)
            ? Number(precioCustom)
            : calculateSpecialPrice(precioBase, grup, esAgrupado, esVenta);
            
        // Si es agrupado, derivamos el precio unitario exacto del grupo para multiplicar por la cantidad de unidades
        const precioUnitarioFinal = esAgrupado ? (precio / Number(grup || 1)) : precio;
        
        return precioUnitarioFinal * Number(cantidad || 0);
    }, [calculateSpecialPrice]);

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
        
        return Math.round(total * 10) / 10;
    }, [calculateSpecialPrice]);

    return { calculateSpecialPrice, calculateSubtotal, calculateTotalCanasta };
};

export default useFormatNumberPrice;
