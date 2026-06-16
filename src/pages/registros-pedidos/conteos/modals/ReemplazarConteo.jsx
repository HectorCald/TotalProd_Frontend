import React, { useState } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import { useToast } from '../../../../context/ToastContext';
import conteosService from '../../../../services/conteosService';
import useHistorialLogger from '../../../../components/ui/HistorialLogger';
import { buildConteoDetallesParaHistorial } from '../../../../utils/logFormatters';

const ReemplazarConteo = ({ isOpen, onClose, conteoSeleccionado, onReemplazar }) => {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const moduloConteo = conteoSeleccionado?.tipo === 'acopio' ? 'Pesaje' : 'Conteo';
    const { logAccion } = useHistorialLogger({
        modulo: moduloConteo
    });

    const handleConfirm = async () => {
        if (!conteoSeleccionado?.id) {
            showDanger('Error', 'ID del conteo no válido');
            return;
        }

        setLoading(true);
        try {
            let response;
            if (conteoSeleccionado.tipo === 'acopio') {
                response = await conteosService.replaceAcopio(conteoSeleccionado.id);
            } else {
                response = await conteosService.replace(conteoSeleccionado.id);
            }

            if (response.success) {
                if (onReemplazar) {
                    onReemplazar(conteoSeleccionado.id);
                }

                const detallesPersonalizados = buildConteoDetallesParaHistorial(conteoSeleccionado, 'REMPLAZO');
                const codigo = conteoSeleccionado?.codigo ?? conteoSeleccionado?.id ?? '';

                await logAccion({
                    accion: 'REMPLAZO',
                    lugarAfectado: `Conteo ${codigo ? '#' + codigo : ''}`.trim() || 'Conteo',
                    registroId: conteoSeleccionado.id,
                    comentario: 'Reemplazo de stock con conteo',
                    detallesPersonalizados
                });

                setLoading(false);
                onClose();
                showSuccess('Operación exitosa', response.message || 'Stock reemplazado exitosamente');
            } else {
                setLoading(false);
                showDanger('Operación fallida', response.message || response.error || 'No se pudo reemplazar el stock');
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

    if (!conteoSeleccionado && isOpen) return null;

    const itemConcepto = conteoSeleccionado?.codigo || `del ${new Date(conteoSeleccionado?.fecha).toLocaleDateString()}`;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title={conteoSeleccionado?.tipo === 'acopio' ? "Reemplazar Stock Acopio" : "Reemplazar Stock Almacén"}
            mensaje={`¿Estás seguro de continuar con el reemplazo de stock del conteo ${itemConcepto}?`}
            detalle="Al reemplazar stock este va a tomar las cantidades físicas de este conteo y las va a reemplazar en el stock principal de los productos."
            confirmText="Reemplazar"
            confirmColorClass="btn-orange"
            onConfirm={handleConfirm}
            loading={loading}
            disableClose={loading}
        />
    );
};

export default ReemplazarConteo;
