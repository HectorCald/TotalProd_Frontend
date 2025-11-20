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
        'precioIdRepitiendo',
        'precioIdEditando',
        'movimientoAgrupadoRepitiendo',
        'metodoPagoRepitiendo',
        'clienteIdRepitiendo',
        'clienteNameRepitiendo',
        'productosMovimientoRepitiendo',
        'movimientoAgrupadoEditando',
        'descuentoMovimientoRepitiendo',
        'aumentoMovimientoRepitiendo',
        'conceptoMovimientoRepitiendo',
        'descuentoAumentoPorcentajeRepitiendo',
        'fechaMovimientoEditando',
        'movimientoIdEditando',
        'productosEdicion',
        'numeroOrdenEditando',
    ],
    cotizacion: [
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

