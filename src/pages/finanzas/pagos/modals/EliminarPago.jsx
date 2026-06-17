import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import gastosService from '../../../../services/gastosService';

const EliminarPago = ({ isOpen, onClose, pagoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();

    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!pagoSeleccionado?.id) {
            showDanger('Error', 'ID del pago no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await gastosService.delete(pagoSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(pagoSeleccionado.id);
                }

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Pago eliminado exitosamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message);
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

    if (!pagoSeleccionado && isOpen) return null;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar pago"
            mensaje={`¿Estás seguro de que deseas eliminar el pago por concepto de ${pagoSeleccionado?.concepto}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este pago una vez eliminado."
            confirmText="Eliminar"
            confirmColorClass="btn-red"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        >
            <div style={{ marginTop: '15px' }}>
                <Mensaje 
                    type="warning" 
                    title="Advertencia" 
                    message="Si este pago está vinculado a un movimiento de almacén, el movimiento en el sistema quedará sin pago asociado." 
                />
            </div>
        </ModalCentro>
    );
};

export default EliminarPago;
