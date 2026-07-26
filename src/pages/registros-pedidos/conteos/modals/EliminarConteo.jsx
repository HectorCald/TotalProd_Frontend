import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import conteosService from '../../../../services/conteosService';
import useHistorialLogger from '../../../../components/ui/HistorialLogger';
import { buildConteoDetallesParaHistorial } from '../../../../utils/logFormatters';
import useFechaLiteral from '../../../../hooks/useFechaLiteral';

const EliminarConteo = ({ isOpen, onClose, conteoSeleccionado, onEliminar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const moduloConteo = conteoSeleccionado?.tipo === 'acopio' ? 'Pesaje' : 'Conteo';
    const { logAccion } = useHistorialLogger({
        modulo: moduloConteo
    });

    const fechaLiteral = useFechaLiteral(conteoSeleccionado?.fecha, false);

    const handleConfirm = async () => {
        if (!conteoSeleccionado?.id) {
            showDanger(null, 'ID del conteo no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await conteosService.delete(conteoSeleccionado.id);

            if (response.success) {
                if (onEliminar) {
                    onEliminar(conteoSeleccionado.id);
                }
                
                const detallesPersonalizados = buildConteoDetallesParaHistorial(conteoSeleccionado, 'ELIMINAR');
                const codigo = conteoSeleccionado?.codigo ?? conteoSeleccionado?.id ?? '';
                if (onEliminar) onEliminar(conteoSeleccionado.id);
                setLoading(false);
                onClose(true);
                showSuccess(null, response.message || 'Conteo eliminado exitosamente');
            } else {
                setLoading(false);
                showDanger(null, response.message || response.error || 'No se pudo eliminar el conteo');
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

    if (!conteoSeleccionado && isOpen) return null;

    const itemConcepto = conteoSeleccionado?.codigo || `del ${fechaLiteral}`;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Eliminar conteo"
            mensaje={`¿Estás seguro de que deseas eliminar el conteo ${itemConcepto}?`}
            detalle="Esta acción es irreversible y no podrás recuperar la información de este conteo una vez eliminado."
            confirmText="Eliminar"
            confirmColorClass="btn-error"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
            contentStyle={{ paddingBlock: 0 }}
        />
    );
};

export default EliminarConteo;
