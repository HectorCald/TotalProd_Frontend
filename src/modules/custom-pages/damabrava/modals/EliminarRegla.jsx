import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import reglasProduccionDamabravaService from '../../../../services/reglasProduccionDamabravaService';
import { useToast } from '../../../../context/ToastContext';

const EliminarRegla = ({ isOpen, onClose, regla, onReglaEliminada }) => {
    const { showSuccess, showDanger } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleConfirm = async () => {
        if (!regla || !regla.id || isDeleting) return;

        setIsDeleting(true);
        try {
            const response = await reglasProduccionDamabravaService.delete(regla.id);
            if (response.success) {
                showSuccess('Regla eliminada correctamente.');
                if (onReglaEliminada) {
                    onReglaEliminada(regla.id);
                }
                onClose();
            } else {
                showDanger(response.message || 'No se pudo eliminar la regla.');
            }
        } catch (error) {
            showDanger(error.message || 'No se pudo eliminar la regla.');
        } finally {
            setIsDeleting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={onClose}
            title="Eliminar Regla"
            confirmText="Sí, eliminar"
            cancelText="Cancelar"
            onConfirm={handleConfirm}
            onCancel={onClose}
            width="400px"
            isDestructive={true}
            isLoading={isDeleting}
        >
            <div style={{ padding: '20px', textAlign: 'center' }}>
                <p style={{ margin: 0, fontSize: '15px', color: 'var(--text-color)' }}>
                    ¿Estás seguro que deseas eliminar esta regla? Esta acción es irreversible.
                </p>
            </div>
        </ModalCentro>
    );
};

export default EliminarRegla;
