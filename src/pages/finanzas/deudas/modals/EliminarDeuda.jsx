import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';

const EliminarDeuda = ({ isOpen, onClose, deudaSeleccionada, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!deudaSeleccionada?.id) {
            showDanger('Error', 'ID de la deuda no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await deudasService.delete(deudaSeleccionada.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(deudaSeleccionada.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Deuda eliminada exitosamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message);
            }
        } catch (error) {
            setLoading(false);
            showDanger('Error de conexión', error.message || 'Error de conexión con el servidor');
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
            detalle="Esta acción es irreversible y no podrás recuperar la información de esta deuda una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default EliminarDeuda;