import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildPedidoDetallesParaHistorial } from '../../../../utils/logFormatters';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    pedidoActual,
    onPedidoEliminado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Pedidos'
    });

    const handleEliminarPedido = async () => {
        if (!pedidoActual) return;

        try {
            setLoading(true);
            const pedidoAntes = pedidoActual ? JSON.parse(JSON.stringify(pedidoActual)) : null;
            const response = await pedidosAlmacenService.eliminar(pedidoActual.id);

            if (response.success) {
                showSuccess('Éxito', 'Pedido eliminado correctamente');
                setIsOpen(false);

                const det = buildPedidoDetallesParaHistorial(pedidoAntes, null, 'ELIMINAR');
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `Pedido #${pedidoAntes?.numero_pedido ?? pedidoAntes?.id ?? ''}`,
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

export default ModalEliminar;
