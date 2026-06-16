import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildPedidoAcopioDetallesParaHistorial } from '../../../../utils/logFormatters';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';
import styles from '../../../../styles/view.module.css';

function EliminarPedidoAcopio({ 
    isOpen, 
    setIsOpen, 
    pedidoActual,
    onPedidoEliminado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const { logAccion } = useHistorialLogger({ modulo: 'Pedidos Acopio' });

    const handleEliminarPedido = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);
            const pedidoAntes = JSON.parse(JSON.stringify(pedidoActual));
            const response = await pedidosAcopioService.eliminar(pedidoActual.id);

            if (response.success) {
                showSuccess('Éxito', 'Pedido eliminado correctamente');
                setIsOpen(false);

                const det = buildPedidoAcopioDetallesParaHistorial(pedidoAntes, null, 'ELIMINAR');
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `Pedido #${pedidoAntes?.codigo ?? pedidoAntes?.numero_pedido ?? pedidoAntes?.id ?? ''}`,
                    registroId: pedidoAntes?.id || null,
                    detallesPersonalizados: det
                });

                // Llamar a la función para actualizar la lista en el padre
                if (onPedidoEliminado) {
                    onPedidoEliminado(pedidoActual.id);
                }
            } else {
                showDanger('Error', response.message || 'Error al eliminar el pedido');
            }
        } catch (error) {
            console.error('Error al eliminar pedido:', error);
            showDanger('Error', 'Error al eliminar el pedido');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Pedido"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar permanentemente este pedido? Esta acción no se puede deshacer.
                </p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-red'
                        label='Sí, eliminar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleEliminarPedido}
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

export default EliminarPedidoAcopio;
