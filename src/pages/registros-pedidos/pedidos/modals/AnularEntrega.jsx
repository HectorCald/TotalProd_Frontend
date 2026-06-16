import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../../components/ui/HistorialLogger';
import { buildPedidoDetallesParaHistorial } from '../../../../utils/logFormatters';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import deudasService from '../../../../services/deudasService';
import Text from '../../../../components/common/old/Text';

const AnularEntrega = ({ isOpen, setIsOpen, pedido, isAcopio, onAnulado }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Pedidos'
    });

    const handleConfirm = async () => {
        if (!pedido) return;

        try {
            setLoading(true);
            const pedidoAntes = pedido ? JSON.parse(JSON.stringify(pedido)) : null;

            if (isAcopio) {
                // Lógica simple para Acopio
                const response = await pedidosAcopioService.anularEntrega(pedido.id);
                if (response.success) {
                    showSuccess('Éxito', 'Entrega anulada correctamente');
                    setIsOpen(false);
                    
                    if (onAnulado && response.data) {
                        onAnulado(response.data);
                    }
                } else {
                    showDanger('Error', response.message || 'Error al anular entrega');
                }
            } else {
                // Lógica de 5 pasos para Almacén
                const movimientoId = pedido.movimiento_salida_id;
                const deudaId = pedido.deuda_id;

                // 1) PRIMERO: Anular el movimiento
                if (movimientoId) {
                    const anularResponse = await movimientosAlmacenService.anular(movimientoId, true);
                    if (!anularResponse.success && !(anularResponse.message && anularResponse.message.includes('anulado'))) {
                        showDanger('Error', 'Error al anular el movimiento: ' + anularResponse.message);
                        setLoading(false);
                        return;
                    }
                }

                // 2) SEGUNDO: Limpiar movimiento_salida_id y deuda_id del pedido
                const limpiarCamposResponse = await pedidosAlmacenService.updateEstado(pedido.id, pedido.estado, null, null);
                if (!limpiarCamposResponse.success) {
                    showDanger('Error', 'Error al limpiar campos del pedido: ' + limpiarCamposResponse.message);
                    setLoading(false);
                    return;
                }

                // 3) TERCERO: Eliminar la deuda
                if (deudaId) {
                    const eliminarDeudaResponse = await deudasService.delete(deudaId);
                    if (!eliminarDeudaResponse.success && !(eliminarDeudaResponse.message && (eliminarDeudaResponse.message.includes('no encontrado') || eliminarDeudaResponse.message.includes('no existe')))) {
                        showDanger('Error', 'Error al eliminar la deuda: ' + eliminarDeudaResponse.message);
                        setLoading(false);
                        return;
                    }
                }

                // 4) CUARTO: Eliminar el movimiento
                if (movimientoId) {
                    const eliminarMovimientoResponse = await movimientosAlmacenService.eliminar(movimientoId);
                    if (!eliminarMovimientoResponse.success && !(eliminarMovimientoResponse.message && (eliminarMovimientoResponse.message.includes('no encontrado') || eliminarMovimientoResponse.message.includes('no existe')))) {
                        showDanger('Error', 'Error al eliminar el movimiento: ' + eliminarMovimientoResponse.message);
                        setLoading(false);
                        return;
                    }
                }

                // 5) QUINTO: Cambiar estado del pedido a Pendiente
                const cambiarEstadoResponse = await pedidosAlmacenService.updateEstado(pedido.id, 'Pendiente');
                if (!cambiarEstadoResponse.success) {
                    showDanger('Error', 'Error al cambiar estado del pedido: ' + cambiarEstadoResponse.message);
                    setLoading(false);
                    return;
                }

                showSuccess('Éxito', 'Entrega cancelada correctamente');
                setIsOpen(false);

                const pedidoActualizado = cambiarEstadoResponse.data;

                const det = buildPedidoDetallesParaHistorial(pedidoAntes, null, 'ANULAR');
                await logAccion({
                    accion: 'ANULAR',
                    lugarAfectado: `Pedido #${pedidoAntes?.numero_pedido ?? pedidoAntes?.id ?? ''}`,
                    registroId: pedidoActualizado?.id || pedidoAntes?.id || null,
                    detallesPersonalizados: det
                });

                if (onAnulado) {
                    onAnulado(pedidoActualizado);
                }
            }
        } catch (error) {
            console.error('Error al cancelar entrega:', error);
            showDanger('Error', 'Error al cancelar entrega');
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        setIsOpen(false);
    };

    if (!pedido && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Cancelar Entrega"
            mensaje="¿Estás seguro que deseas cancelar la entrega de este pedido? Esta acción no se puede deshacer."
            detalle={
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="warning" align="left">
                        Al anular se regresarán los productos que se entregaron al almacén general y se eliminará el movimiento de salida.
                    </Text>
                </div>
            }
            confirmText="Sí, cancelar"
            confirmColorClass="btn-orange"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            segundosDisabled={5}
        />
    );
};

export default AnularEntrega;
