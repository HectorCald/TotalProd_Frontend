import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';

const EliminarMovimiento = ({ isOpen, onClose, movimientoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const movimiento = movimientoSeleccionado;

    const handleConfirm = async () => {
        if (!movimiento?.id) {
            showDanger(null, 'ID del movimiento no válido');
            return;
        }

        setLoading(true);
        try {
            const isAcopio = !!movimientoSeleccionado.product;
            const response = isAcopio
                ? await movimientosAcopioService.eliminar(movimientoSeleccionado.id)
                : await movimientosAlmacenService.eliminar(movimientoSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(movimiento.id);
                }

                setLoading(false);
                onClose(true);
                showSuccess(null, response.message || 'Movimiento eliminado exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || response.error || 'No se pudo eliminar el movimiento');
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

    if (!movimientoSeleccionado && isOpen) return null;

    const isAcopio = !!movimientoSeleccionado?.product;
    const itemConcepto = isAcopio 
        ? (movimientoSeleccionado?.product?.name || 'Materia Prima') 
        : (movimientoSeleccionado?.concepto || movimientoSeleccionado?.codigo || 'Almacén');

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar movimiento"
            mensaje={`¿Estás seguro de que deseas eliminar el movimiento de ${itemConcepto}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este movimiento una vez eliminado."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarMovimiento;
