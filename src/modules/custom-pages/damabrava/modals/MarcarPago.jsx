import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import pagosDamabravaService from '../../../../services/pagosDamabravaService';

const MarcarPago = ({ isOpen, onClose, pago, onMarcar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pago?.id) {
            showDanger('Error', 'ID de pago no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await pagosDamabravaService.updateEstado(pago.id, 'pagado');

            if (response.success) {
                showSuccess('Operación exitosa', 'Pago marcado como pagado correctamente.');
                if (onMarcar) onMarcar(response.data || { ...pago, estado: 'pagado' });
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
            title="Marcar como pagado"
            mensaje="¿Estás seguro que deseas marcar este pago como pagado?"
            confirmText="Sí, marcar como pagado"
            confirmColorClass="btn-primary"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default MarcarPago;
