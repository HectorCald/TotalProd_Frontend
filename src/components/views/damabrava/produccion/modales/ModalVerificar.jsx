import React, { useState, useEffect } from 'react';
import styles from '../../../../../styles/view.module.css';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/old/HeaderModal';
import Input from '../../../../common/inputs/Input';
import Boton from '../../../../common/botones/Boton';
import Text from '../../../../common/old/Text';
import { useToast } from '../../../../../context/ToastContext';
import registrosProduccionDamabravaService from '../../../../../services/registrosProduccionDamabravaService';

function ModalVerificar({ isOpen, setIsOpen, registro, onVerificado }) {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const [cantidadVerificada, setCantidadVerificada] = useState('');
    const [observacionesVerificacion, setObservacionesVerificacion] = useState('');

    useEffect(() => {
        if (isOpen) {
            setCantidadVerificada(registro?.terminados?.toString() || '');
            setObservacionesVerificacion('');
        }
    }, [isOpen, registro?.terminados]);

    const handleVerificar = async () => {
        const cantidad = parseFloat(cantidadVerificada);
        if (cantidadVerificada === '' || isNaN(cantidad) || cantidad < 0) {
            showWarning('Advertencia', 'La cantidad verificada debe ser un número válido mayor o igual a 0');
            return;
        }

        setLoading(true);
        try {
            const verificacionData = {
                cantidad_verificada: cantidad,
                observaciones: observacionesVerificacion || null
            };
            const response = await registrosProduccionDamabravaService.verify(registro?.id, verificacionData);

            if (response.success) {
                showSuccess('Verificación correcta', 'Registro verificado correctamente');
                setIsOpen(false);
                if (onVerificado) onVerificado(response.data);
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
            setLoading(false);
        }
    };

    const cantidadVer = parseFloat(cantidadVerificada) || 0;
    const terminados = parseFloat(registro?.terminados) || 0;
    const diferencia = cantidadVer - terminados;

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Verificar Producción"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <Input
                    tipo="number"
                    label="Cantidad Real Verificada"
                    required={true}
                    value={cantidadVerificada}
                    onChange={(e) => setCantidadVerificada(e.target.value)}
                    readOnly={loading}
                />

                <Input
                    type="text"
                    label="Observaciones (Opcional)"
                    value={observacionesVerificacion}
                    onChange={(e) => setObservacionesVerificacion(e.target.value)}
                    readOnly={loading}
                />

                {cantidadVerificada && diferencia !== 0 && (
                    <div style={{ marginTop: '15px', marginBottom: '10px', width: '100%' }}>
                        <Text type="info" align="left">
                            {diferencia > 0
                                ? `Se restará materia prima de la receta del producto. La cantidad verificada (${cantidadVer}) es mayor que los terminados (${terminados}), diferencia de ${diferencia}.`
                                : `Se sumará materia prima de la receta del producto. La cantidad verificada (${cantidadVer}) es menor que los terminados (${terminados}), diferencia de ${Math.abs(diferencia)}.`}
                        </Text>
                    </div>
                )}
                <div className={styles.space}></div>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-original'
                        label='Verificar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleVerificar}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalVerificar;
