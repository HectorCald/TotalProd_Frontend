import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import pagosDamabravaService from '../../../../services/pagosDamabravaService';

const AnularPago = ({ isOpen, onClose, pago, onAnular }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pago?.id) {
            showDanger('Error', 'ID de pago no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await pagosDamabravaService.updateEstado(pago.id, 'pendiente');

            if (response.success) {
                showSuccess('Operación exitosa', 'Pago marcado como pendiente correctamente.');
                if (onAnular) onAnular(response.data || { ...pago, estado: 'pendiente' });
                onClose(true);
            } else {
                showWarning('Operación fallida', response.message || 'Error al actualizar el estado.');
            }
        } catch (error) {
            console.error('Error actualizando pago:', error);
            showDanger('Error de conexión', error.message || 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
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
            title="Anular pago"
            mensaje="¿Estás seguro que deseas anular el estado de este pago y marcarlo como pendiente?"
            confirmText="Sí, anular pagado"
            confirmColorClass="btn-warning"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <Mensaje
                type="warning"
                title="Atención"
                message="El pago volverá a estar pendiente y aparecerá como pendiente en los reportes."
            />
        </ModalCentro>
    );
};

export default AnularPago;
