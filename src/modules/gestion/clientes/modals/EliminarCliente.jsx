import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import clientService from '../../../../services/clientService';

const EliminarCliente = ({ isOpen, onClose, clienteSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!clienteSeleccionado?.id) {
            showDanger(null, 'ID del cliente no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await clientService.delete(clienteSeleccionado.id);

            if (response.success) {
                if (onEliminar) onEliminar(clienteSeleccionado.id);
                setLoading(false);
                onClose(true);
                showSuccess(null, response.message);
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

    if (!clienteSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar cliente"
            mensaje={`¿Estás seguro de que deseas eliminar a ${clienteSeleccionado?.name}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este cliente una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarCliente;