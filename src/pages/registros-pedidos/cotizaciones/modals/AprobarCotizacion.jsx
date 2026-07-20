import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';

const AprobarCotizacion = ({ isOpen, onClose, cotizacionSeleccionada, onAprobar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!cotizacionSeleccionada?.id) {
            showDanger(null, 'ID de la cotización no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionSeleccionada.id, 'aprobada');

            if (response.success) {
                if (onAprobar) {
                    onAprobar(cotizacionSeleccionada.id, 'aprobada');
                }

                setLoading(false);
                onClose();
                showSuccess(null, response.message || 'Cotización aprobada exitosamente');
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

    if (!cotizacionSeleccionada && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Aprobar cotización"
            mensaje={`¿Estás seguro de que deseas aprobar la cotización #${cotizacionSeleccionada?.numero_cotizacion || 'Sin número'}?`}
            detalle="Esta cotización pasará a estado aprobada y estará lista para ser completada."
            confirmText="Aprobar"
            confirmColorClass="btn-primary"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default AprobarCotizacion;
