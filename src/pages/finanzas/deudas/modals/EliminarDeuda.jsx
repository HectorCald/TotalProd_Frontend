import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';

const EliminarDeuda = ({ isOpen, onClose, deudaSeleccionada, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!deudaSeleccionada?.id) {
            showDanger(null, 'ID de la deuda no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await deudasService.delete(deudaSeleccionada.id);

            if (response.success) {
                if (onEliminar) onEliminar(deudaSeleccionada.id);
                setLoading(false);
                onClose();
                showSuccess(null, response.message || 'Deuda eliminada exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message);
            }
        } catch (error) {
            setLoading(false);
            showDanger(null, 'Revisa tu conexión a internet');
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    if (!deudaSeleccionada && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar deuda"
            mensaje={`¿Estás seguro de que deseas eliminar la deuda por concepto de ${deudaSeleccionada?.concepto}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de esta deuda una vez eliminada"
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <Mensaje
                type="warning"
                title="Advertencia"
                message="Al eliminar esta deuda se borrarán también todos los pagos parciales registrados. (Nota: Las deudas generadas automáticamente por ventas no pueden eliminarse por esta vía, debe anular el movimiento de almacén correspondiente)."
            />
        </ModalCentro>
    );
};

export default EliminarDeuda;