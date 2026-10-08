import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const EliminarRegistro = ({ isOpen, onClose, registro, onEliminar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!registro?.id) {
            showDanger('Error', 'ID de registro no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.delete(registro.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(registro.id);
                }

                setLoading(false);
                onClose(true);
                showSuccess('Operación exitosa', response.message || 'Registro eliminado exitosamente');
            } else {
                setLoading(false);
                showWarning('Operación fallida', response.message || 'Error al eliminar el registro');
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

    if (!registro && isOpen) return null;

    const terminados = registro?.terminados || 0;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar Registro"
            mensaje={`¿Estás seguro que deseas eliminar el registro de producción del lote ${registro?.lote}? Esta acción no se puede deshacer.`}
            confirmText="Sí, eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <Mensaje
                type="error"
                title="Atención"
                message={`Al eliminar el registro de producción se devolverá el peso total de la materia prima de la receta del producto según terminados hayan (${terminados}).`}
            />
        </ModalCentro>
    );
};

export default EliminarRegistro;
