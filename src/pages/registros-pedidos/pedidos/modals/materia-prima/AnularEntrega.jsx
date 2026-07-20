import React, { useState } from 'react';
import ModalCentro from '../../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../../context/ToastContext';
import pedidosAcopioService from '../../../../../services/pedidosAcopioService';
import Text from '../../../../../components/common/old/Text';

const AnularEntrega = ({ isOpen, setIsOpen, pedido, onAnulado }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pedido) return;

        try {
            setLoading(true);
            const response = await pedidosAcopioService.anularEntrega(pedido.id);
            
            if (response.success) {
                showSuccess(null, 'Entrega anulada correctamente y pagos eliminados.');
                setIsOpen(false);
                
                if (onAnulado && response.data) {
                    onAnulado(response.data);
                }
            } else {
                showDanger(null, response.message || 'Error al anular entrega');
            }
        } catch (error) {
            console.error('Error al cancelar entrega:', error);
            showDanger(null, 'Error al cancelar entrega');
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
            title="Anular Entrega"
            mensaje="¿Estás seguro que deseas anular la entrega de este pedido? Esta acción no se puede deshacer."
            detalle={
               
                    <Text type="warning" align="left">
                        Al anular se limpiarán todos los datos de entrega y se eliminarán los registros de pago (gastos) vinculados. El pedido regresará a estado Pendiente.
                    </Text>
                
            }
            confirmText="Sí, anular"
            confirmColorClass="btn-warning"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            segundosDisabled={5}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default AnularEntrega;
