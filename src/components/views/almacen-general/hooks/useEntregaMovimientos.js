import { useState, useEffect, useCallback } from 'react';

function useEntregaMovimientos({ esEntrega, isOpen }) {
    const [pedidoIdEntregando, setPedidoIdEntregando] = useState(null);
    const [precioIdEntregando, setPrecioIdEntregando] = useState(null);
    const [clienteEntregando, setClienteEntregando] = useState(null);
    const [metodoPagoEntregando, setMetodoPagoEntregando] = useState(null);
    const [modoAgrupacionEntregando, setModoAgrupacionEntregando] = useState(null);
    const [productosPedidoEntregando, setProductosPedidoEntregando] = useState([]);

    useEffect(() => {
        if (!isOpen || !esEntrega) return;

        const pedidoId = localStorage.getItem('pedidoIdEntregando');
        setPedidoIdEntregando(pedidoId);

        const productosGuardados = localStorage.getItem('productosPedidoEntregando');
        if (productosGuardados) {
            try {
                const productos = JSON.parse(productosGuardados);
                setProductosPedidoEntregando(productos);
            } catch (error) {
                console.error('Error al leer productosPedidoEntregando:', error);
                setProductosPedidoEntregando([]);
            }
        } else {
            setProductosPedidoEntregando([]);
        }

        const precioId = localStorage.getItem('precioIdEntregando');
        setPrecioIdEntregando(precioId);

        const clienteId = localStorage.getItem('clienteIdEntregando');
        const clienteName = localStorage.getItem('clienteNameEntregando');

        if (clienteId && clienteName) {
            setClienteEntregando({
                id: clienteId,
                name: clienteName
            });
        } else {
            setClienteEntregando(null);
        }

        const metodoPago = localStorage.getItem('metodoPagoEntregando');
        setMetodoPagoEntregando(metodoPago || null);

        const modoPedido = localStorage.getItem('pedidoAgrupadoEntregando');
        setModoAgrupacionEntregando(
            modoPedido === 'agrupado' || modoPedido === 'no_agrupado'
                ? modoPedido
                : null
        );
    }, [esEntrega, isOpen]);

    const applyEntregaPrecioInicial = useCallback((tipos = []) => {
        if (!esEntrega || !tipos.length) return null;
        if (precioIdEntregando && tipos.some(precio => precio.value === precioIdEntregando)) {
            return precioIdEntregando;
        }
        return tipos[0]?.value ?? null;
    }, [esEntrega, precioIdEntregando]);

    const clearEntregaTemporal = useCallback(() => {
        localStorage.removeItem('pedidoDestinoSucursalId');
        localStorage.removeItem('pedidoDestinoSucursalName');
        localStorage.removeItem('precioIdEntregando');
        localStorage.removeItem('productosPedidoEntregando');
        localStorage.removeItem('metodoPagoEntregando');
        localStorage.removeItem('pedidoAgrupadoEntregando');
        localStorage.removeItem('clienteIdEntregando');
        localStorage.removeItem('clienteNameEntregando');
    }, []);

    const clearEntregaTotal = useCallback(() => {
        clearEntregaTemporal();
        localStorage.removeItem('pedidoIdEntregando');
    }, [clearEntregaTemporal]);

    return {
        pedidoIdEntregando,
        precioIdEntregando,
        clienteEntregando,
        metodoPagoEntregando,
        modoAgrupacionEntregando,
        applyEntregaPrecioInicial,
        clearEntregaTemporal,
        clearEntregaTotal
    };
}

export default useEntregaMovimientos;

