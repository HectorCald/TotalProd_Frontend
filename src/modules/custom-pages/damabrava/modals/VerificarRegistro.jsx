import React, { useState, useEffect } from 'react';
import ModalCentro from '../../../../components/common/modals/ModalCentro';
import Input from '../../../../components/common/inputs/Input';
import Mensaje from '../../../../components/common/outputs/Mensaje';
import { useToast } from '../../../../context/ToastContext';
import registrosProduccionDamabravaService from '../../../../services/registrosProduccionDamabravaService';

const VerificarRegistro = ({ isOpen, onClose, registro, onVerificar }) => {
    const { showSuccess, showDanger, showWarning } = useToast();

    const [cantidadVerificada, setCantidadVerificada] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});

    useEffect(() => {
        if (isOpen) {
            setCantidadVerificada(registro?.terminados?.toString() || '');
            setObservaciones('');
            setErrors({});
            setIsSubmitting(false);
        }
    }, [isOpen, registro?.terminados]);

    const handleConfirm = async () => {
        const cantidad = parseFloat(cantidadVerificada);
        
        if (cantidadVerificada === '' || isNaN(cantidad) || cantidad < 0) {
            setErrors({ cantidad: 'La cantidad debe ser un número válido mayor o igual a 0' });
            return;
        }

        setErrors({});
        setIsSubmitting(true);

        try {
            const verificacionData = {
                cantidad_verificada: cantidad,
                observaciones: observaciones || null
            };
            const response = await registrosProduccionDamabravaService.verify(registro?.id, verificacionData);

            if (response.success) {
                showSuccess('Verificación exitosa', 'Registro verificado correctamente');
                if (onVerificar) {
                    onVerificar({ ...registro, ...response.data });
                }
                onClose(true);
            } else {
                showWarning('Advertencia', response.message || 'Error al verificar el registro');
            }
        } catch (error) {
            console.error('Error verificando registro:', error);
            if (error.response?.data?.ingredientesConStockInsuficiente) {
                const ingredientes = error.response.data.ingredientesConStockInsuficiente;
                let mensaje = 'Stock insuficiente de ingredientes:\n';
                ingredientes.forEach(ing => {
                    mensaje += `• ${ing.nombre}: Necesitas ${ing.requerido}, tienes ${ing.stockActual} (faltan ${ing.requerido - ing.stockActual})\n`;
                });
                showWarning('Stock insuficiente', mensaje);
            } else {
                showDanger('Error', error.message || 'Error al verificar el registro');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return;
        onClose();
    };

    if (!registro && isOpen) return null;

    const cantidadVer = parseFloat(cantidadVerificada) || 0;
    const terminados = parseFloat(registro?.terminados) || 0;
    const diferencia = cantidadVer - terminados;

    return (
        <ModalCentro
            isOpen={isOpen}
            onClose={handleClose}
            title="Verificar Producción"
            confirmText="Verificar"
            onConfirm={handleConfirm}
            loading={isSubmitting}
            disableClose={isSubmitting}
            contentStyle={{ paddingBlock: 0 }}
        >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', pointerEvents: isSubmitting ? 'none' : 'auto', opacity: isSubmitting ? 0.7 : 1 }}>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--quaternary-color)' }}>
                    <span style={{ fontSize: '14px', color: 'var(--secondary-color)' }}>Cantidad registrada inicialmente:</span>
                    <span style={{ fontSize: '15px', fontWeight: 'bold' }}>{terminados} ud.</span>
                </div>

                <Input
                    tipo="number"
                    label="Cantidad Real Verificada"
                    value={cantidadVerificada}
                    onChange={(e) => {
                        setCantidadVerificada(e.target.value);
                        setErrors(prev => ({ ...prev, cantidad: null }));
                    }}
                    error={errors.cantidad}
                />

                <Input
                    tipo="text"
                    label="Observaciones (Opcional)"
                    value={observaciones}
                    onChange={(e) => setObservaciones(e.target.value)}
                    placeholder="Detalle de la verificación..."
                />

                {cantidadVerificada !== '' && diferencia !== 0 && (
                    <Mensaje
                        type="info"
                        title="Atención"
                        message={diferencia > 0
                            ? `Se restará materia prima de la receta del producto. La cantidad verificada (${cantidadVer}) es mayor que los terminados registrados (${terminados}), diferencia de ${diferencia}.`
                            : `Se sumará materia prima de la receta al almacén. La cantidad verificada (${cantidadVer}) es menor que los terminados registrados (${terminados}), devolviendo ${Math.abs(diferencia)} a inventario.`
                        }
                    />
                )}
            </div>
        </ModalCentro>
    );
};

export default VerificarRegistro;
