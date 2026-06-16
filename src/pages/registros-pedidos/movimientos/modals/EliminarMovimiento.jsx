import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';

const EliminarMovimiento = ({ isOpen, onClose, movimientoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!movimientoSeleccionado?.id) {
            showDanger('Error', 'ID del movimiento no válido');
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
                    onEliminar(movimientoSeleccionado.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Movimiento eliminado exitosamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message || response.error || 'No se pudo eliminar el movimiento');
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
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default EliminarMovimiento;
