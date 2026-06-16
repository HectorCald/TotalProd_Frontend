import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import cargosService from '../../../../services/cargosService';

const EliminarCargo = ({ isOpen, onClose, cargoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!cargoSeleccionado?.id) {
            showDanger('Error', 'ID del cargo no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await cargosService.delete(cargoSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(cargoSeleccionado.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Cargo eliminado correctamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message || 'Error al eliminar el cargo');
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

    if (!cargoSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar Cargo"
            mensaje={`¿Estás seguro de que deseas eliminar el cargo ${cargoSeleccionado?.name || cargoSeleccionado?.nombre}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este cargo una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default EliminarCargo;
