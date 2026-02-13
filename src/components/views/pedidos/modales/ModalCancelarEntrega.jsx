import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import Text from '../../../common/Text';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildPedidoDetallesParaHistorial } from '../../../../utils/logFormatters';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import deudasService from '../../../../services/deudasService';
import styles from '../../../../styles/view.module.css';

function ModalCancelarEntrega({ 
    isOpen, 
    setIsOpen, 
    pedidoActual,
    setPedidoActual,
    onPedidoActualizado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Pedidos'
    });

    const handleCancelarEntrega = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);
            const pedidoAntes = pedidoActual ? JSON.parse(JSON.stringify(pedidoActual)) : null;

            // Guardar los IDs antes de empezar
            const movimientoId = pedidoActual.movimiento_salida_id;
            const deudaId = pedidoActual.deuda_id;

            console.log('PASO 1: Anulando movimiento...');
            // 1) PRIMERO: Anular el movimiento (desde pedido)
            if (movimientoId) {
                const anularResponse = await movimientosAlmacenService.anular(movimientoId, true);
                if (!anularResponse.success) {
                    // Si el error es porque ya está anulado, continuar con el proceso
                    if (anularResponse.message && anularResponse.message.includes('anulado')) {
                        console.log('⚠️ Movimiento ya estaba anulado, continuando...');
                    } else {
                        showDanger('Error', 'Error al anular el movimiento: ' + anularResponse.message);
                        return;
                    }
                } else {
                    console.log('✅ Movimiento anulado correctamente');
                }
            }

            console.log('PASO 2: Limpiando campos del pedido...');
            // 2) SEGUNDO: Limpiar movimiento_salida_id y deuda_id del pedido (sin cambiar estado)
            const limpiarCamposResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, pedidoActual.estado, null, null);
            if (!limpiarCamposResponse.success) {
                showDanger('Error', 'Error al limpiar campos del pedido: ' + limpiarCamposResponse.message);
                return;
            }
            console.log('✅ Campos del pedido limpiados (movimiento_salida_id y deuda_id)');

            console.log('PASO 3: Eliminando deuda...');
            // 3) TERCERO: Eliminar la deuda
            if (deudaId) {
                const eliminarDeudaResponse = await deudasService.delete(deudaId);
                if (!eliminarDeudaResponse.success) {
                    // Si el error es porque ya no existe, continuar con el proceso
                    if (eliminarDeudaResponse.message && (eliminarDeudaResponse.message.includes('no encontrado') || eliminarDeudaResponse.message.includes('no existe'))) {
                        console.log('⚠️ Deuda ya estaba eliminada, continuando...');
                    } else {
                        showDanger('Error', 'Error al eliminar la deuda: ' + eliminarDeudaResponse.message);
                        return;
                    }
                } else {
                    console.log('✅ Deuda eliminada correctamente');
                }
            }

            console.log('PASO 4: Eliminando movimiento...');
            // 4) CUARTO: Eliminar el movimiento
            if (movimientoId) {
                const eliminarMovimientoResponse = await movimientosAlmacenService.eliminar(movimientoId);
                if (!eliminarMovimientoResponse.success) {
                    // Si el error es porque ya no existe, continuar con el proceso
                    if (eliminarMovimientoResponse.message && (eliminarMovimientoResponse.message.includes('no encontrado') || eliminarMovimientoResponse.message.includes('no existe'))) {
                        console.log('⚠️ Movimiento ya estaba eliminado, continuando...');
                    } else {
                        showDanger('Error', 'Error al eliminar el movimiento: ' + eliminarMovimientoResponse.message);
                        return;
                    }
                } else {
                    console.log('✅ Movimiento eliminado correctamente');
                }
            }

            console.log('PASO 5: Cambiando estado del pedido a Pendiente...');
            // 5) QUINTO: Cambiar estado del pedido a Pendiente
            const cambiarEstadoResponse = await pedidosAlmacenService.updateEstado(pedidoActual.id, 'Pendiente');
            if (!cambiarEstadoResponse.success) {
                showDanger('Error', 'Error al cambiar estado del pedido: ' + cambiarEstadoResponse.message);
                return;
            }
            console.log('✅ Estado del pedido cambiado a Pendiente');

            showSuccess('Éxito', 'Entrega cancelada correctamente');
            setIsOpen(false);

            // Usar la respuesta actualizada del servidor que incluye total_pedidos actualizado
            const pedidoActualizado = cambiarEstadoResponse.data;

            const det = buildPedidoDetallesParaHistorial(pedidoAntes, null, 'ANULAR');
            await logAccion({
                accion: 'ANULAR',
                lugarAfectado: `Pedido #${pedidoAntes?.numero_pedido ?? pedidoAntes?.id ?? ''}`,
                registroId: pedidoActualizado?.id || pedidoAntes?.id || null,
                detallesPersonalizados: det
            });

            // Actualizar el estado local del pedido
            setPedidoActual(pedidoActualizado);

            if (onPedidoActualizado) {
                onPedidoActualizado(pedidoActualizado);
            }

            // No cerrar VerPedido, solo actualizar el estado

        } catch (error) {
            console.error('Error al cancelar entrega:', error);
            showDanger('Error', 'Error al cancelar entrega');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Cancelar Entrega"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas cancelar la entrega de este pedido? Esta acción no se puede deshacer.
                </p>
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="warning" align="left">
                        Al anular se regresarán los productos que se entregaron al almacén general y se eliminará el movimiento de salida.
                    </Text>
                </div>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-orange'
                        label='Sí, cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleCancelarEntrega}
                        loading={loading}
                        segundosDisabled={5}
                    />
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalCancelarEntrega;
