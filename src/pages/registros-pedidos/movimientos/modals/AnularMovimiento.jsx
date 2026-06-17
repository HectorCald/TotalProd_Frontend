import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import movimientosAcopioService from '../../../../services/movimientosAcopioService';

const AnularMovimiento = ({ isOpen, onClose, movimientoSeleccionado, onAnular }) => {
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
                ? await movimientosAcopioService.anular(movimientoSeleccionado.id)
                : await movimientosAlmacenService.anularFast(movimientoSeleccionado.id);

            if (response.success) {
                if (onAnular) {
                    onAnular(response.data || movimientoSeleccionado);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Movimiento anulado exitosamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message || 'No se pudo anular el movimiento');
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
            title="Anular movimiento"
            mensaje={`¿Estás seguro de que deseas anular el movimiento de ${itemConcepto}?`}
            detalle="Esta acción es irreversible y revertirá los cambios en el stock de inventario."
            confirmText="Anular"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default AnularMovimiento;
