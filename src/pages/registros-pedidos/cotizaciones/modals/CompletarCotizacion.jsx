import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';

const CompletarCotizacion = ({ isOpen, onClose, cotizacionSeleccionada, onCompletar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!cotizacionSeleccionada?.id) {
            showDanger('Error', 'ID de la cotización no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionSeleccionada.id, 'completado');

            if (response.success) {
                if (onCompletar) {
                    onCompletar(cotizacionSeleccionada.id, 'completado');
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Cotización completada exitosamente');
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
            title="Completar cotización"
            mensaje={`¿Estás seguro de que deseas completar la cotización #${cotizacionSeleccionada?.numero_cotizacion || 'Sin número'}?`}
            detalle="Esta cotización pasará a estado completado y se considerará finalizada."
            confirmText="Completar"
            confirmColorClass="btn-primary"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default CompletarCotizacion;
