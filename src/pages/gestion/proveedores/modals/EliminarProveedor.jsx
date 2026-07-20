import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import proveedorService from '../../../../services/proveedorService';

const EliminarProveedor = ({ isOpen, onClose, proveedorSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!proveedorSeleccionado?.id) {
            showDanger(null, 'ID del proveedor no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await proveedorService.delete(proveedorSeleccionado.id);

            if (response.success) {
                if (onEliminar) onEliminar(proveedorSeleccionado.id);
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

    if (!proveedorSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar proveedor"
            mensaje={`¿Estás seguro de que deseas eliminar a ${proveedorSeleccionado?.name}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este proveedor una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarProveedor;
