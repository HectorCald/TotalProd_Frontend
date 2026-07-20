import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import pagosDamabravaService from '../../../../services/pagosDamabravaService';

const EliminarPago = ({ isOpen, onClose, pago, onEliminar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pago?.id) {
            showDanger('Error', 'ID de pago no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await pagosDamabravaService.delete(pago.id);

            if (response.success) {
                if (onEliminar) onEliminar(pago.id);
                setLoading(false);
                onClose(true);
                showSuccess('Operación exitosa', response.message || 'Pago eliminado exitosamente.');
            } else {
                setLoading(false);
                showWarning('Operación fallida', response.message || 'Error al eliminar el pago.');
            }
        } catch (error) {
            setLoading(false);
            console.error('Error eliminando pago:', error);
            showDanger('Error de conexión', error.message || 'Error de conexión con el servidor');
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    if (!pago && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar Pago"
            mensaje="¿Estás seguro que deseas eliminar este pago? Esta acción no se puede deshacer y removerá también los registros asociados."
            confirmText="Sí, eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <Mensaje
                type="error"
                title="Atención"
                message="Al eliminar el pago, la información y los registros de producción asociados se perderán."
            />
        </ModalCentro>
    );
};

export default EliminarPago;
