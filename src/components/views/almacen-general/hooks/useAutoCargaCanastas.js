import { useEffect } from 'react';

function useAutoCargaCanastas({
    isOpen,
    tipo,
    productos,
    onAgregarProductoPedido,
    onAgregarProductoMovimiento,
}) {
    useEffect(() => {
        if (!isOpen || tipo !== 'salida') return;

        const pedidoId = localStorage.getItem('pedidoIdEntregando');
        if (!pedidoId || productos.length === 0) return;

        const productosPedido = localStorage.getItem('productosPedidoEntregando');
        if (!productosPedido) return;

        try {
            const productosParaEntregar = JSON.parse(productosPedido);
            productosParaEntregar.forEach(productoPedido => {
                const productoCompleto = productos.find(p => p.id === productoPedido.id);
                if (productoCompleto) {
                    onAgregarProductoMovimiento?.(productoCompleto, 'salida', null, productoPedido.cantidad);
                }
            });
            localStorage.removeItem('productosPedidoEntregando');
        } catch (error) {
            console.error('Error al cargar productos del pedido:', error);
        }
    }, [isOpen, productos, tipo, onAgregarProductoMovimiento]);

    useEffect(() => {
        if (!isOpen || tipo !== 'pedido') return;
        if (productos.length === 0) return;
        const pedidoId = localStorage.getItem('pedidoIdEditando');
        if (!pedidoId) return;

        const productosPedido = localStorage.getItem('productosPedidoEditando');
        if (!productosPedido) return;

        try {
            const productosParaEditar = JSON.parse(productosPedido);
            productosParaEditar.forEach(productoPedido => {
                const productoCompleto = productos.find(p => p.id === productoPedido.id);
                if (productoCompleto) {
                    onAgregarProductoPedido?.(productoCompleto, productoPedido.cantidad);
                }
            });
            localStorage.removeItem('productosPedidoEditando');
        } catch (error) {
            console.error('Error al cargar productos del pedido para editar:', error);
        }
    }, [isOpen, productos, tipo, onAgregarProductoPedido]);

    useEffect(() => {
        if (!isOpen || tipo !== 'salida') return;
        if (productos.length === 0) return;

        const productosMovimientoRepitiendo = localStorage.getItem('productosMovimientoRepitiendo');
        const productosMovimientoEditando = localStorage.getItem('productosMovimientoEditando');
        const productosMovimientoStorage = productosMovimientoRepitiendo || productosMovimientoEditando;

        if (!productosMovimientoStorage) return;

        try {
            const productosParaRepetir = JSON.parse(productosMovimientoStorage);
            productosParaRepetir.forEach(productoMovimiento => {
                const productoCompleto = productos.find(p => p.id === productoMovimiento.id);
                if (productoCompleto) {
                    onAgregarProductoMovimiento?.(productoCompleto, 'salida', null, productoMovimiento.cantidad);
                }
            });
        } catch (error) {
            console.error('Error al cargar productos del movimiento para repetir:', error);
        } finally {
            if (productosMovimientoRepitiendo) {
                localStorage.removeItem('productosMovimientoRepitiendo');
            }
            if (productosMovimientoEditando) {
                localStorage.removeItem('productosMovimientoEditando');
            }
        }
    }, [isOpen, productos, tipo, onAgregarProductoMovimiento]);

    useEffect(() => {
        if (!isOpen || tipo !== 'salida') return;
        if (productos.length === 0) return;

        const productosCotizacion = localStorage.getItem('productosCotizacionVendiendo');
        if (!productosCotizacion) return;

        try {
            const productosParaVender = JSON.parse(productosCotizacion);
            productosParaVender.forEach(productoCotizacion => {
                const productoCompleto = productos.find(p => p.id === productoCotizacion.id);
                if (productoCompleto) {
                    const productoConPrecio = {
                        ...productoCompleto,
                        precio: productoCotizacion.precio || productoCompleto.precio
                    };
                    onAgregarProductoMovimiento?.(productoConPrecio, 'salida', null, productoCotizacion.cantidad);
                }
            });
        } catch (error) {
            console.error('Error al cargar productos de la cotización para vender:', error);
        }
    }, [isOpen, productos, tipo, onAgregarProductoMovimiento]);
}

export default useAutoCargaCanastas;

