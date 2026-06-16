import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import Text from '../../../common/old/Text';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildPedidoAcopioDetallesParaHistorial } from '../../../../utils/logFormatters';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import styles from '../../../../styles/view.module.css';

function AnularEntregaAcopio({ 
    isOpen, 
    setIsOpen, 
    pedidoActual,
    setPedidoActual,
    onPedidoActualizado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const { logAccion } = useHistorialLogger({ modulo: 'Pedidos Acopio' });

    const handleAnularEntregaAcopio = async () => {
        if (!pedidoActual) {
            showDanger('Error', 'Solo se pueden anular entregas de pedidos de materia prima');
            return;
        }

        try {
            setLoading(true);
            const pedidoAntes = JSON.parse(JSON.stringify(pedidoActual));

            const response = await pedidosAcopioService.anularEntrega(pedidoActual.id);

            if (response.success) {
                showSuccess('Éxito', 'Entrega anulada correctamente');
                setIsOpen(false);

                const det = buildPedidoAcopioDetallesParaHistorial(pedidoAntes, null, 'ANULAR');
                await logAccion({
                    accion: 'ANULAR',
                    lugarAfectado: `Pedido #${pedidoAntes?.codigo ?? pedidoAntes?.numero_pedido ?? pedidoAntes?.id ?? ''}`,
                    registroId: pedidoAntes?.id || null,
                    detallesPersonalizados: det
                });

                // Actualizar el pedido local: solo cambiar estado a Pendiente y limpiar campos de entrega
                const pedidoActualizado = {
                    ...pedidoActual,
                    estado: 'Pendiente',
                    fecha_entregado: null,
                    entregado_por: null,
                    cantidad_entregada: null,
                    cantidad_entregada_ud: null,
                    estado_entrega: null,
                    observaciones_entrega: null,
                    gasto_id: null,
                    gasto_otros_id: null
                };

                // Actualizar el estado local del pedido
                setPedidoActual(pedidoActualizado);

                if (onPedidoActualizado) {
                    onPedidoActualizado(pedidoActualizado);
                }
            } else {
                showDanger('Error', response.message || 'Error al anular la entrega');
            }
        } catch (error) {
            console.error('Error al anular entrega:', error);
            showDanger('Error', 'Error al anular la entrega');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Anular Entrega"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas anular la entrega de este pedido? Esta acción no se puede deshacer.
                </p>
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="warning" align="left">
                        Al anular se eliminará el gasto del costo del producto y del transporte si hubiera.
                    </Text>
                </div>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-orange'
                        label='Sí, Anular'
                        style={{ marginTop: 'auto' }}
                        onClick={handleAnularEntregaAcopio}
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

export default AnularEntregaAcopio;
