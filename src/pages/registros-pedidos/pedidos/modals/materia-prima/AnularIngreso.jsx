import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../../context/ToastContext';
import pedidosAcopioService from '../../../../../services/pedidosAcopioService';
import movimientosAcopioService from '../../../../../services/movimientosAcopioService';
import Text from '../../../../../components/common/old/Text';

const AnularIngreso = ({ isOpen, setIsOpen, pedido, onAnulado }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pedido || !pedido.movimiento_entrada_id) return;

        try {
            setLoading(true);
            
            // 1. Anular el movimiento de acopio (no eliminar, solo anular)
            const anularMovimientoRes = await movimientosAcopioService.anular(pedido.movimiento_entrada_id);
            if (!anularMovimientoRes.success) {
                showDanger(null, anularMovimientoRes.message || 'Error al anular el movimiento de ingreso');
                setLoading(false);
                return;
            }

            // 2. Cambiar estado del pedido a Entregado y quitar movimiento_entrada_id
            const updateEstadoRes = await pedidosAcopioService.updateEstado(pedido.id, 'Entregado', null);
            
            if (updateEstadoRes.success) {
                showSuccess(null, 'Ingreso anulado correctamente. El pedido ha vuelto a estado Entregado.');
                
                // Mantenemos loading en true para que el botón de confirmación siga deshabilitado
                // Esperamos 300ms antes de cerrar para asegurar que el usuario haya soltado el click o tecla Enter
                // evitando que el evento keyup dispare los botones del modal padre al reabrirse.
                setTimeout(() => {
                    setIsOpen(false);
                    if (onAnulado) {
                        onAnulado({ ...pedido, estado: 'Entregado', movimiento_entrada_id: null });
                    }
                    setLoading(false);
                }, 300);
            } else {
                showDanger(null, updateEstadoRes.message || 'Error al actualizar el estado del pedido');
                setLoading(false);
            }
        } catch (error) {
            console.error('Error al anular ingreso:', error);
            showDanger(null, 'Error al anular ingreso');
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
            mensaje="¿Estás seguro que deseas anular el ingreso de este pedido? Esta acción anulará el movimiento en inventario."
            detalle={
                <Text type="warning" align="left">
                    Al anular, el pedido regresará al estado "Entregado" y el movimiento de entrada en almacén quedará anulado, descontando el stock ingresado.
                </Text>
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
