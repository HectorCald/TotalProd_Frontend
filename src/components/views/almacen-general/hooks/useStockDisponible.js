/**
 * Función helper para calcular el stock disponible de un producto
 * Considera la cantidad en la canasta y el modo de agrupación
 */
function calcularStockDisponible({
    producto,
    tipo,
    cantidadEnCanasta = 0,
    cantidadEnCanastaMovimientos = 0,
    modoAgrupacion = null // Parámetro opcional para pasar el modo de agrupación directamente
}) {
    const stockOriginal = producto.stock || 0;
    let stockDisponible = stockOriginal;
    let stockParaMostrar = stockOriginal;
    let maxCantidad = undefined;
    let modoAgrupacionActual = modoAgrupacion; // Usar el parámetro si se proporciona

    // Si no se proporciona modoAgrupacion, obtenerlo desde window/localStorage
    if (!modoAgrupacionActual) {
        if (tipo === 'salida') {
            if (window.getModoAgrupacionCanastaMovimientos && typeof window.getModoAgrupacionCanastaMovimientos === 'function') {
                modoAgrupacionActual = window.getModoAgrupacionCanastaMovimientos();
            } else {
                modoAgrupacionActual = localStorage.getItem('movimientoAgrupadoRepitiendo') || localStorage.getItem('movimientoAgrupadoEditando');
            }
        } else if (tipo === 'transferir') {
            if (window.getModoAgrupacionCanastaTransferencias && typeof window.getModoAgrupacionCanastaTransferencias === 'function') {
                modoAgrupacionActual = window.getModoAgrupacionCanastaTransferencias();
            } else {
                modoAgrupacionActual = localStorage.getItem('transferenciaAgrupadoRepitiendo') || localStorage.getItem('transferenciaAgrupadoEditando');
            }
        } else if (tipo === 'pedido') {
            if (window.getModoAgrupacionCanastaPedidos && typeof window.getModoAgrupacionCanastaPedidos === 'function') {
                modoAgrupacionActual = window.getModoAgrupacionCanastaPedidos();
            } else {
                modoAgrupacionActual = localStorage.getItem('pedidoAgrupadoRepitiendo') || localStorage.getItem('pedidoAgrupadoEditando');
            }
        } else if (tipo === 'entrada') {
            if (window.getModoAgrupacionCanastaMovimientosEntrada && typeof window.getModoAgrupacionCanastaMovimientosEntrada === 'function') {
                modoAgrupacionActual = window.getModoAgrupacionCanastaMovimientosEntrada();
            } else {
                modoAgrupacionActual = localStorage.getItem('movimientoAgrupadoRepitiendo') || localStorage.getItem('movimientoAgrupadoEditando');
            }
        } else if (tipo === 'cotizar') {
            if (window.getModoAgrupacionCanastaCotizaciones && typeof window.getModoAgrupacionCanastaCotizaciones === 'function') {
                modoAgrupacionActual = window.getModoAgrupacionCanastaCotizaciones();
            } else {
                modoAgrupacionActual = localStorage.getItem('cotizacionAgrupadoRepitiendo') || localStorage.getItem('cotizacionAgrupadoEditando');
            }
        }
    }

    // Calcular stock disponible para salidas y transferencias
    if (tipo === 'salida' || tipo === 'transferir') {
        const cantidadEnCanastaActual = tipo === 'transferir' ? cantidadEnCanasta : cantidadEnCanastaMovimientos;

        if (modoAgrupacionActual === 'agrupado' && producto.grup && producto.grup > 0) {
            // En modo agrupado, calcular en grupos
            const gruposDisponibles = Math.floor(stockOriginal / producto.grup);
            const gruposEnCanasta = cantidadEnCanastaActual; // Ya está en grupos
            stockDisponible = Math.max(0, gruposDisponibles - gruposEnCanasta);
            stockParaMostrar = stockDisponible; // Ya está en grupos
            maxCantidad = gruposDisponibles; // Límite en grupos (stock original, no disponible)
        } else {
            // En modo unidades, calcular en unidades
            stockDisponible = Math.max(0, stockOriginal - cantidadEnCanastaActual);
            stockParaMostrar = stockDisponible; // Ya está en unidades
            maxCantidad = stockOriginal; // Límite en unidades (stock original, no disponible)
        }
    } else if (tipo === 'entrada' || tipo === 'pedido' || tipo === 'cotizar') {
        // Para entradas, pedidos y cotizaciones, no hay límite máximo
        maxCantidad = undefined;
        
        // Calcular stockParaMostrar según el modo de agrupación (solo para mostrar, no para validar)
        if (modoAgrupacionActual === 'agrupado' && producto.grup && producto.grup > 0) {
            // Mostrar en grupos
            stockParaMostrar = Math.floor(stockOriginal / producto.grup);
        } else {
            // Mostrar en unidades
            stockParaMostrar = stockOriginal;
        }
    }

    // Determinar el color del badge según el stock disponible (para salidas) o stock original (para otros tipos)
    let badgeColor = 'default';
    const stockParaColor = (tipo === 'salida') ? stockDisponible : stockOriginal;
    
    if (producto.stock_minimo !== null && producto.stock_minimo !== undefined) {
        const diferencia = stockParaColor - producto.stock_minimo;
        if (diferencia >= 20) {
            badgeColor = 'info';
        } else if (diferencia >= 5) {
            badgeColor = 'warning';
        } else {
            badgeColor = 'error';
        }
    }
    
    // Si el stock disponible es 0 para salidas, usar color error
    if (tipo === 'salida' && stockDisponible === 0) {
        badgeColor = 'error';
    }

    // Obtener modo de agrupación para mostrar correctamente (para todos los tipos que lo soportan)
    let modoAgrupacionParaMostrar = null;
    if (tipo === 'salida') {
        if (window.getModoAgrupacionCanastaMovimientos && typeof window.getModoAgrupacionCanastaMovimientos === 'function') {
            modoAgrupacionParaMostrar = window.getModoAgrupacionCanastaMovimientos();
        } else {
            modoAgrupacionParaMostrar = localStorage.getItem('movimientoAgrupadoRepitiendo') || localStorage.getItem('movimientoAgrupadoEditando');
        }
    } else if (tipo === 'transferir') {
        if (window.getModoAgrupacionCanastaTransferencias && typeof window.getModoAgrupacionCanastaTransferencias === 'function') {
            modoAgrupacionParaMostrar = window.getModoAgrupacionCanastaTransferencias();
        } else {
            modoAgrupacionParaMostrar = localStorage.getItem('transferenciaAgrupadoRepitiendo') || localStorage.getItem('transferenciaAgrupadoEditando');
        }
    } else if (tipo === 'pedido') {
        if (window.getModoAgrupacionCanastaPedidos && typeof window.getModoAgrupacionCanastaPedidos === 'function') {
            modoAgrupacionParaMostrar = window.getModoAgrupacionCanastaPedidos();
        } else {
            modoAgrupacionParaMostrar = localStorage.getItem('pedidoAgrupadoRepitiendo') || localStorage.getItem('pedidoAgrupadoEditando');
        }
    } else if (tipo === 'entrada') {
        if (window.getModoAgrupacionCanastaMovimientosEntrada && typeof window.getModoAgrupacionCanastaMovimientosEntrada === 'function') {
            modoAgrupacionParaMostrar = window.getModoAgrupacionCanastaMovimientosEntrada();
        } else {
            modoAgrupacionParaMostrar = localStorage.getItem('movimientoAgrupadoRepitiendo') || localStorage.getItem('movimientoAgrupadoEditando');
        }
    } else if (tipo === 'cotizar') {
        if (window.getModoAgrupacionCanastaCotizaciones && typeof window.getModoAgrupacionCanastaCotizaciones === 'function') {
            modoAgrupacionParaMostrar = window.getModoAgrupacionCanastaCotizaciones();
        } else {
            modoAgrupacionParaMostrar = localStorage.getItem('cotizacionAgrupadoRepitiendo') || localStorage.getItem('cotizacionAgrupadoEditando');
        }
    }

    // Formatear el stock para mostrar según el modo de agrupación
    // Si está en modo agrupado y el producto tiene grupo, mostrar en grupos
    // Si no está en modo agrupado o el producto no tiene grupo, mostrar en unidades
    let stockDisplay = '';
    if (stockParaMostrar === 0) {
        // Si el stock es 0, mostrar "Agotado"
        stockDisplay = 'Agotado';
    } else if (modoAgrupacionParaMostrar === 'agrupado' && producto.grup && producto.grup > 0) {
        // Mostrar en grupos
        stockDisplay = `${stockParaMostrar} grupos`;
    } else {
        // Mostrar en unidades
        stockDisplay = `${stockParaMostrar} unidades`;
    }

    return {
        stockOriginal,
        stockDisponible,
        stockParaMostrar,
        stockDisplay,
        maxCantidad,
        badgeColor,
        modoAgrupacionActual
    };
}

export default calcularStockDisponible;

