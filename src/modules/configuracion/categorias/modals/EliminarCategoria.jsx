import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import categoryAlmacenService from '../../../../services/categoryAlmacenService';
import categoryAcopioService from '../../../../services/categoryAcopioService';

const EliminarCategoria = ({ isOpen, onClose, categoriaSeleccionada, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!categoriaSeleccionada?.id) {
            showDanger(null, 'ID de la categoría no válido');
            return;
        }

        setLoading(true);
        try {
            const serviceToUse = categoriaSeleccionada._tipo_modulo === 'almacen' ? categoryAlmacenService : categoryAcopioService;
            const response = await serviceToUse.delete(categoriaSeleccionada.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(categoriaSeleccionada.id, categoriaSeleccionada._tipo_modulo);
                }

                setLoading(false);
                onClose(true);
                showSuccess(null, response.message || 'Categoría eliminada correctamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || 'Error al eliminar la categoría');
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

    if (!categoriaSeleccionada && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar Categoría"
            mensaje={`¿Estás seguro de que deseas eliminar la categoría "${categoriaSeleccionada?.name || categoriaSeleccionada?.nombre}"?`}
            detalle={`Esta categoría es del tipo ${categoriaSeleccionada?.description}. Esta acción es irreversible.`}
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarCategoria;
