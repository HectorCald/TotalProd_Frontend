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
                    // Si el stock es 0, no agregar a la canasta
                    const stockDisponible = productoCompleto.stock || 0;
                    if (stockDisponible > 0) {
                        onAgregarProductoMovimiento?.(productoCompleto, 'salida', null, productoPedido.cantidad);
                    }
                }
            });
            setTimeout(() => {
                localStorage.removeItem('productosPedidoEntregando');
            }, 1000);
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
                    // Para pedidos, no validar stock (pueden tener stock 0)
                    // Solo verificar que el producto exista
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
                    // Si el stock es 0, no agregar a la canasta
                    const stockDisponible = productoCompleto.stock || 0;
                    if (stockDisponible > 0) {
                        onAgregarProductoMovimiento?.(productoCompleto, 'salida', null, productoMovimiento.cantidad);
                    }
                }
            });
            setTimeout(() => {
                if (productosMovimientoRepitiendo) {
                    localStorage.removeItem('productosMovimientoRepitiendo');
                }
                if (productosMovimientoEditando) {
                    localStorage.removeItem('productosMovimientoEditando');
                }
            }, 1000);
        } catch (error) {
            console.error('Error al cargar productos del movimiento para repetir/editar:', error);
        }
    }, [isOpen, productos, tipo, onAgregarProductoMovimiento]);
}

export default useAutoCargaCanastas;

