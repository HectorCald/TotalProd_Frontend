import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../../components/ui/HistorialLogger';
import { buildPedidoDetallesParaHistorial } from '../../../../utils/logFormatters';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import Text from '../../../../components/common/old/Text';

const AnularIngreso = ({ isOpen, setIsOpen, pedido, onAnulado }) => {
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

            const movimientoEntradaId = pedido.movimiento_entrada_id;

            // 1) PRIMERO: Cambiar estado del pedido a Entregado y limpiar movimiento_entrada_id
            const cambiarEstadoResponse = await pedidosAlmacenService.updateEstado(pedido.id, 'Entregado', undefined, undefined, null);
            if (!cambiarEstadoResponse.success) {
                showDanger('Error', 'Error al cambiar estado del pedido: ' + cambiarEstadoResponse.message);
                setLoading(false);
                return;
            }

            // 2) SEGUNDO: Anular el movimiento usando anularFast
            if (movimientoEntradaId) {
                const anularResponse = await movimientosAlmacenService.anularFast(movimientoEntradaId);
                if (!anularResponse.success && !(anularResponse.message && anularResponse.message.includes('anulado'))) {
                    showDanger('Error', 'Error al anular el ingreso: ' + anularResponse.message);
                    setLoading(false);
                    return;
                }
            }

            // 3) TERCERO: Eliminar el movimiento completamente
            if (movimientoEntradaId) {
                const eliminarMovimientoResponse = await movimientosAlmacenService.eliminar(movimientoEntradaId);
                if (!eliminarMovimientoResponse.success && !(eliminarMovimientoResponse.message && (eliminarMovimientoResponse.message.includes('no encontrado') || eliminarMovimientoResponse.message.includes('no existe')))) {
                    showDanger('Error', 'Error al eliminar el ingreso: ' + eliminarMovimientoResponse.message);
                    setLoading(false);
                    return;
                }
            }

            showSuccess('Éxito', 'Ingreso anulado correctamente');
            setIsOpen(false);

            const pedidoActualizado = cambiarEstadoResponse.data || { ...pedido, estado: 'Entregado', movimiento_entrada_id: null };

            const det = buildPedidoDetallesParaHistorial(pedidoAntes, null, 'ANULAR_INGRESO');
            await logAccion({
                accion: 'ANULAR_INGRESO',
                lugarAfectado: `Pedido #${pedidoAntes?.numero_pedido ?? pedidoAntes?.id ?? ''}`,
                registroId: pedidoActualizado?.id || pedidoAntes?.id || null,
                detallesPersonalizados: det
            });

            if (onAnulado) {
                onAnulado(pedidoActualizado);
            }

        } catch (error) {
            console.error('Error al anular ingreso:', error);
            showDanger('Error', 'Error al anular ingreso');
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
            title="Anular Ingreso"
            mensaje="¿Estás seguro que deseas anular el ingreso de este pedido? Esta acción no se puede deshacer."
            detalle={
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="warning" align="left">
                        Al anular, se descontarán de tu stock actual los productos que ingresaste por este pedido y se eliminará el movimiento de entrada.
                    </Text>
                </div>
            }
            confirmText="Sí, anular ingreso"
            confirmColorClass="btn-warning"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            segundosDisabled={5}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default AnularIngreso;
