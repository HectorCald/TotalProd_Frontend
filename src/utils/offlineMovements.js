import { OFFLINE_NETWORK_FLAG } from './offlineNetworkInterceptor';
import { guardarRegistro, obtenerLocal, guardarLocal, OFFLINE_DB_NAME, MOVIMIENTOS_SALIDA_STORE, PRODUCTOS_STORE } from './indexedDB';

const getRandomId = () => {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    return `${Date.now()}-${Math.random()}`;
};

export const isOfflineNetworkEnabled = () => {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
        return true;
    }
    try {
        return localStorage.getItem(OFFLINE_NETWORK_FLAG) === 'true';
    } catch {
        return false;
    }
};

export const queueOfflineSalida = async ({
    movimientoData,
    pedidoId = null,
    pedidoData = null,
    pedidoEstadoPayload = null,
    deudaData = null,
    clienteInfo = null,
    metodoPago,
    subtotal,
    descuentoPorcentaje,
    aumentoPorcentaje,
    observaciones,
    productos,
    productosNormalizados,
    numeroPedido = null,
    numeroOrden = null,
    esEntrega = false,
    isEditandoMovimiento = false,
    movimientoIdEditando = null,
    fechaMovimientoEditando = null,
    tipoPrecioNombre = '',
}) => {
    const recordId = getRandomId();
    const actions = [];

    if (isEditandoMovimiento && movimientoIdEditando) {
        actions.push({
            service: 'movimientosAlmacenService',
            method: 'anular',
            args: [movimientoIdEditando, false, true],
        });
        actions.push({
            service: 'movimientosAlmacenService',
            method: 'eliminar',
            args: [movimientoIdEditando, true],
        });
    }

    if (pedidoId && pedidoData) {
        actions.push({
            service: 'pedidosAlmacenService',
            method: 'update',
            args: [pedidoId, pedidoData],
        });
    }

    actions.push({
        service: 'movimientosAlmacenService',
        method: 'create',
        args: [movimientoData],
        resultKey: 'movimientoId',
    });

    if (deudaData) {
        actions.push({
            service: 'deudasService',
            method: 'create',
            args: [deudaData],
            requires: ['movimientoId'],
            resultKey: 'deudaId',
        });
    }

    if (pedidoEstadoPayload && pedidoEstadoPayload.pedidoId) {
        actions.push({
            service: 'pedidosAlmacenService',
            method: 'updateEstado',
            args: [
                pedidoEstadoPayload.pedidoId,
                'Entregado',
                null,
                pedidoEstadoPayload.metodoPago || metodoPago,
            ],
            requires: ['movimientoId'],
        });
    }

    const record = {
        id: recordId,
        createdAt: new Date().toISOString(),
        status: 'pending',
        type: 'salida',
        esEntrega,
        isEditandoMovimiento,
        movimientoIdEditando: movimientoIdEditando || null,
        fechaMovimientoEditando: fechaMovimientoEditando || null,
        actions,
        resumen: {
            metodoPago,
            subtotal,
            descuentoPorcentaje,
            aumentoPorcentaje,
            observaciones,
            numeroPedido,
            numeroOrden,
            cliente: clienteInfo?.name || clienteInfo?.razon_social || null,
            cantidadProductos: Array.isArray(productos) ? productos.length : 0,
            tipoPrecioNombre: tipoPrecioNombre || null,
        },
        datos: {
            movimientoData,
            pedidoId,
            pedidoData,
            pedidoEstadoPayload,
            deudaData,
            clienteInfo,
            productos,
            productosNormalizados,
            tipoPrecioNombre: tipoPrecioNombre || null,
        },
    };

    await guardarRegistro(MOVIMIENTOS_SALIDA_STORE, OFFLINE_DB_NAME, record, recordId);
    return record;
};

export const updateOfflineProductsStock = async (stockUpdates = []) => {
    if (!Array.isArray(stockUpdates) || stockUpdates.length === 0) return;
    try {
        const cachedProducts = await obtenerLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME);
        if (!Array.isArray(cachedProducts) || cachedProducts.length === 0) return;
        const updatesMap = new Map(stockUpdates.map(item => [item.id, item.stock]));
        const updatedProducts = cachedProducts.map(product => {
            if (updatesMap.has(product.id)) {
                return {
                    ...product,
                    stock: updatesMap.get(product.id)
                };
            }
            return product;
        });
        await guardarLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME, updatedProducts);
    } catch (error) {
        console.warn('No se pudo actualizar el stock offline:', error);
    }
};

export const restoreOfflineProductsStock = async (productosNormalizados = []) => {
    if (!Array.isArray(productosNormalizados) || productosNormalizados.length === 0) return;
    try {
        const cachedProducts = await obtenerLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME);
        if (!Array.isArray(cachedProducts) || cachedProducts.length === 0) return;
        const cantidadesMap = new Map(productosNormalizados.map(item => [item.id, item.cantidad || 0]));

        const updatedProducts = cachedProducts.map(producto => {
            if (!cantidadesMap.has(producto.id)) return producto;
            const cantidad = cantidadesMap.get(producto.id);
            return {
                ...producto,
                stock: (producto.stock || 0) + cantidad
            };
        });

        await guardarLocal(PRODUCTOS_STORE, OFFLINE_DB_NAME, updatedProducts);
    } catch (error) {
        console.warn('No se pudo restaurar el stock offline:', error);
    }
};


