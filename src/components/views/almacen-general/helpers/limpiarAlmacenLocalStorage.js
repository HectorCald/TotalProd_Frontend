const ENTITIES = {
    pedidoEdicion: [
        'pedidoIdEditando',
        'precioIdEditando',
        'precioIdRepitiendo',
        'pedidoAgrupadoEditando',
        'productosPedidoEditando',
        'clienteIdEditando',
        'clienteNameEditando',
        'metodoPagoEditando',
    ],
    entrega: [
        'pedidoAgrupadoEntregando',
        'pedidoDestinoSucursalId',
        'pedidoDestinoSucursalName',
        'clienteIdEntregando',
        'clienteNameEntregando',
        'pedidoIdEntregando',
        'precioIdEntregando',
        'productosPedidoEntregando',
        'metodoPagoEntregando',
    ],
    movimientoRepeticion: [
        'movimientoAgrupadoRepitiendo',
        'metodoPagoRepitiendo',
        'clienteIdRepitiendo',
        'clienteNameRepitiendo',
        'productosMovimientoRepitiendo',
        'productosMovimientoEditando',
        'movimientoAgrupadoEditando',
        'descuentoMovimientoRepitiendo',
        'aumentoMovimientoRepitiendo',
        'conceptoMovimientoRepitiendo',
        'descuentoMovimientoEditando',
        'aumentoMovimientoEditando',
        'fechaMovimientoEditando',
        'movimientoIdEditando',
        'productosEdicion',
        'numeroOrdenEditando',
    ],
    cotizacion: [
        'productosCotizacionVendiendo',
        'precioIdCotizacionVendiendo',
        'cotizacionAgrupadoVendiendo',
        'clienteIdCotizacionVendiendo',
        'clienteNameCotizacionVendiendo',
        'isVentaCotizacion',
    ],
    cotizacionRepeticion: [
        'precioIdCotizacionRepitiendo',
        'cotizacionAgrupadoRepitiendo',
        'clienteIdCotizacionRepitiendo',
        'clienteNameCotizacionRepitiendo',
        'metodoPagoCotizacionRepitiendo',
        'fechaVencimientoCotizacionRepitiendo',
        'productosCotizacionRepitiendo',
    ],
};

function limpiarAlmacenLocalStorage({ includeProductos = true } = {}) {
    Object.values(ENTITIES).forEach(keys => {
        keys.forEach(key => {
            if (!includeProductos && key.startsWith('productos')) return;
            localStorage.removeItem(key);
        });
    });
}

export default limpiarAlmacenLocalStorage;

