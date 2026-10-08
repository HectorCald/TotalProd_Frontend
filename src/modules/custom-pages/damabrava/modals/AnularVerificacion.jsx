import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const AnularVerificacion = ({ isOpen, onClose, registro, onAnular }) => {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if ((registro?.cantidad_ingresada || 0) > 0) {
            showWarning('Advertencia', 'No se puede anular la verificación porque ya hay cantidad ingresada al almacén');
            return;
        }

        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.unverify(registro?.id);

            if (response.success) {
                showSuccess('Verificación anulada', 'Verificación anulada correctamente');
                if (onAnular) onAnular({ ...registro, ...response.data });
                onClose(true);
            } else {
                showWarning('Advertencia', response.message || 'Error al anular la verificación');
            }
        } catch (error) {
            console.error('Error anulando verificación:', error);
            if (error.response?.data?.ingredientesConStockInsuficiente) {
                const ingredientes = error.response.data.ingredientesConStockInsuficiente;
                let mensaje = 'Stock insuficiente de ingredientes:\n';
                ingredientes.forEach(ing => {
                    mensaje += `• ${ing.nombre}: Necesitas ${ing.requerido}, tienes ${ing.stockActual} (faltan ${ing.requerido - ing.stockActual})\n`;
                });
                showWarning('Stock insuficiente', mensaje);
            } else {
                showDanger('Error', error.message || 'Error al anular la verificación');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        if (loading) return;
        onClose();
    };

    if (!registro && isOpen) return null;

    const terminados = registro?.terminados || 0;
    const cantidadVerificada = registro?.cantidad_verificada || 0;
    const diferencia = cantidadVerificada - terminados;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Anular Verificación"
            mensaje="¿Estás seguro que deseas anular la verificación de este registro? Esta acción no se puede deshacer."
            confirmText="Sí, Anular"
            confirmColorClass="btn-warning"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        >
            <Mensaje
                type="error"
                title="Atención"
                message={diferencia !== 0 
                    ? `Al anular la verificación se regresará o restará la materia prima de la receta según el monto verificado. Si terminados es ${terminados} y se verificó ${cantidadVerificada}, se ajustará la materia prima por la diferencia de ${Math.abs(diferencia)}.`
                    : `Al anular la verificación, el estado regresará a pendiente.`
                }
            />
        </ModalCentro>
    );
};

export default AnularVerificacion;
