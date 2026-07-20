import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import productsAlmacenService from '../../../../services/productsAlmacenService';

const EliminarProducto = ({ isOpen, onClose, productoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!productoSeleccionado?.id) {
            showDanger(null, 'ID del producto no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await productsAlmacenService.delete(productoSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(productoSeleccionado.id);
                }

                setLoading(false);
                onClose(true);
                showSuccess(null, response.message || 'Producto eliminado exitosamente');
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

    if (!productoSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar producto"
            mensaje={`¿Estás seguro de que deseas eliminar a ${productoSeleccionado?.name}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este producto una vez eliminada."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarProducto;
