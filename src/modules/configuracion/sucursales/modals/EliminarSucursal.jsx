import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import sucursalesService from '../../../../services/sucursalesService';

const EliminarSucursal = ({ isOpen, onClose, sucursalSeleccionada, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!sucursalSeleccionada?.id) {
            showDanger(null, 'ID de la sucursal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await sucursalesService.delete(sucursalSeleccionada.id);

            if (response.success) {
                if (onEliminar) onEliminar(sucursalSeleccionada.id);
                setLoading(false);
                onClose();
                showSuccess(null, response.message || 'Sucursal eliminada correctamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || 'Error al eliminar la sucursal');
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

    if (!sucursalSeleccionada && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar Sucursal"
            mensaje={`¿Estás seguro de que deseas eliminar la sucursal ${sucursalSeleccionada?.name || sucursalSeleccionada?.nombre}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de esta sucursal una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarSucursal;