import { useCallback, useEffect } from 'react';

function usePedidoEdicion({
    pedidoId,
    isOpen,
    setClienteSeleccionado,
    setClienteSeleccionadoData
} = {}) {
    const isEditing = Boolean(pedidoId);

    const resolvePrecioInicial = useCallback((preciosTipos = []) => {
        if (!preciosTipos.length) return null;
        if (!isEditing) {
            return preciosTipos[0].value ?? null;
        }

        const storedPrecio = localStorage.getItem('precioIdEditando');
        if (storedPrecio && preciosTipos.some(precio => precio.value === storedPrecio)) {
            return storedPrecio;
        }

        return preciosTipos[0].value ?? null;
    }, [isEditing]);

    const resolveModoInicial = useCallback(() => {
        if (!isEditing) return null;
        const storedModo = localStorage.getItem('pedidoAgrupadoEditando');
        return storedModo === 'agrupado' || storedModo === 'no_agrupado' ? storedModo : null;
    }, [isEditing]);

    useEffect(() => {
        if (!isOpen || !isEditing) return;
        if (!setClienteSeleccionado || !setClienteSeleccionadoData) return;

        const clienteId = localStorage.getItem('clienteIdEditando');
        const clienteName = localStorage.getItem('clienteNameEditando');

        if (clienteId) {
            setClienteSeleccionado(clienteId);
            setClienteSeleccionadoData({
                id: clienteId,
                name: clienteName || ''
            });
        }
    }, [isOpen, isEditing, setClienteSeleccionado, setClienteSeleccionadoData]);

    const clearEdicionStorage = useCallback(() => {
        localStorage.removeItem('pedidoIdEditando');
        localStorage.removeItem('precioIdEditando');
        localStorage.removeItem('pedidoAgrupadoEditando');
        localStorage.removeItem('productosPedidoEditando');
        localStorage.removeItem('clienteIdEditando');
        localStorage.removeItem('clienteNameEditando');
    }, []);

    return {
        isEditing,
        resolvePrecioInicial,
        resolveModoInicial,
        clearEdicionStorage
    };
}

export default usePedidoEdicion;

