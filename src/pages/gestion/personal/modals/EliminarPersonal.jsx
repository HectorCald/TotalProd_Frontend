import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import personalService from '../../../../services/personalService';

const EliminarPersonal = ({ isOpen, onClose, personalSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!personalSeleccionado?.id) {
            showDanger('Error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.delete(personalSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(personalSeleccionado.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Personal eliminado correctamente');
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

    if (!personalSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar personal"
            mensaje={`¿Estás seguro de que deseas eliminar a ${personalSeleccionado?.first_name} ${personalSeleccionado?.last_name}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este personal una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default EliminarPersonal;
