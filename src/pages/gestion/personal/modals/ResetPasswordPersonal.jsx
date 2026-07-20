import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import personalService from '../../../../services/personalService';

const ResetPasswordPersonal = ({ isOpen, onClose, personalSeleccionado }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!personalSeleccionado?.id) {
            showDanger(null, 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.resetPassword(personalSeleccionado.id);

            if (response.success) {
                setLoading(false);
                onClose(true);
                showSuccess(null, response.message || 'Contraseña reseteada correctamente');
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

    if (!personalSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Resetear contraseña"
            mensaje={`¿Estás seguro de que deseas resetear la contraseña de ${personalSeleccionado?.first_name} ${personalSeleccionado?.last_name}?`}
            detalle="Se borrará la contraseña actual y el empleado podrá establecer una nueva ingresando con su código."
            confirmText="Resetear"
            confirmColorClass="btn-warning"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default ResetPasswordPersonal;
