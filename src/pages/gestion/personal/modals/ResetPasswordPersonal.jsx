import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import personalService from '../../../../services/personalService';

const ResetPasswordPersonal = ({ isOpen, onClose, personalSeleccionado }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!personalSeleccionado?.id) {
            showDanger('Error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.resetPassword(personalSeleccionado.id);

            if (response.success) {
                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Contraseña reseteada correctamente. El empleado deberá establecer una nueva contraseña.');
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
            title="Resetear contraseña"
            mensaje={`¿Estás seguro de que deseas resetear la contraseña de ${personalSeleccionado?.first_name} ${personalSeleccionado?.last_name}?`}
            detalle="Se borrará la contraseña actual y el empleado podrá establecer una nueva ingresando con su código."
            confirmText="Resetear"
            confirmColorClass="btn-orange"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default ResetPasswordPersonal;
