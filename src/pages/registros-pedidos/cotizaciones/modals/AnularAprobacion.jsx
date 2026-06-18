import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';

const AnularAprobacion = ({ isOpen, onClose, cotizacionSeleccionada, onAnular }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!cotizacionSeleccionada?.id) {
            showDanger('Error', 'ID de la cotización no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionSeleccionada.id, 'pendiente');

            if (response.success) {
                if (onAnular) {
                    onAnular(cotizacionSeleccionada.id, 'pendiente');
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Aprobación anulada exitosamente');
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
            title="Anular aprobación"
            mensaje={`¿Estás seguro de que deseas anular la aprobación de la cotización #${cotizacionSeleccionada?.numero_cotizacion || 'Sin número'}?`}
            detalle="Esta cotización volverá a estado pendiente."
            confirmText="Anular Aprobación"
            confirmColorClass="btn-orange"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default AnularAprobacion;
