import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';

const EliminarCotizacion = ({ isOpen, onClose, cotizacionSeleccionada, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!cotizacionSeleccionada?.id) {
            showDanger('Error', 'ID de la cotización no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await cotizacionesService.eliminar(cotizacionSeleccionada.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(cotizacionSeleccionada.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Cotización eliminada exitosamente');
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

    if (!cotizacionSeleccionada && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar cotización"
            mensaje={`¿Estás seguro de que deseas eliminar la cotización #${cotizacionSeleccionada?.numero_cotizacion || 'Sin número'}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de esta cotización una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default EliminarCotizacion;
