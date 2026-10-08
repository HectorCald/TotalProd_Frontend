import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import gastosService from '../../../../services/gastosService';

const EliminarPago = ({ isOpen, onClose, pagoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pagoSeleccionado?.id) {
            showDanger(null, 'ID del pago no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await gastosService.delete(pagoSeleccionado.id);

            if (response.success) {
                if (onEliminar) onEliminar(pagoSeleccionado.id);
                setLoading(false);
                onClose();
                showSuccess(null, response.message || 'Pago eliminado exitosamente');
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

    if (!pagoSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar pago"
            mensaje={`¿Estás seguro de que deseas eliminar el pago por concepto de ${pagoSeleccionado?.concepto}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este pago una vez eliminado"
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
                message="Los pagos generados automáticamente por compras, ingresos o movimientos de almacén no pueden eliminarse por esta vía, para ello debe anular el movimiento correspondiente."
            />

        </ModalCentro>
    );
};

export default EliminarPago;
