import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import pricesTypesService from '../../../../services/pricesTypesService';

const EliminarPrecio = ({ isOpen, onClose, precioSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!precioSeleccionado?.id) {
            showDanger('Error', 'ID del tipo de precio no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await pricesTypesService.delete(precioSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(precioSeleccionado.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Tipo de precio eliminado correctamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message || 'Error al eliminar el tipo de precio');
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

    if (!precioSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar Tipo de Precio"
            mensaje={`¿Estás seguro de que deseas eliminar el tipo de precio ${precioSeleccionado?.name || precioSeleccionado?.nombre}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este tipo de precio una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default EliminarPrecio;
