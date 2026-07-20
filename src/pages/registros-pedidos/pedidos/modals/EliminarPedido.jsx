import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import pedidosAlmacenService from '../../../../services/pedidosAlmacenService';
import pedidosAcopioService from '../../../../services/pedidosAcopioService';

const EliminarPedido = ({ isOpen, setIsOpen, pedido, isAcopio, onDeleted }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pedido?.id) {
            showDanger(null, 'ID del pedido no válido');
            return;
        }

        setLoading(true);
        try {
            const response = isAcopio
                ? await pedidosAcopioService.eliminar(pedido.id)
                : await pedidosAlmacenService.eliminar(pedido.id);

            if (response.success) {
                if (onDeleted) {
                    onDeleted(pedido.id);
                }

                setLoading(false);
                setIsOpen(false);
                showSuccess(null, response.message || 'Pedido eliminado exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || response.error || 'No se pudo eliminar el pedido');
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet');
        }
    };

    const handleClose = () => {
        if (loading) return;
        setIsOpen(false);
    };

    if (!pedido && isOpen) return null;

    const itemConcepto = isAcopio 
        ? (pedido?.producto_acopio?.name || 'Materia Prima') 
        : (`Nº ${pedido?.numero_pedido || 'Desconocido'}`);

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar pedido"
            mensaje={`¿Estás seguro de que deseas eliminar el pedido ${itemConcepto}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este pedido una vez eliminado."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarPedido;
