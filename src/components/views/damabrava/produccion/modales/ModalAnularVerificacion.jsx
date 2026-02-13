import React, { useState } from 'react';
import styles from '../../../../../styles/view.module.css';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/HeaderModal';
import Boton from '../../../../common/Boton';
import Text from '../../../../common/Text';
import { useToast } from '../../../../../context/ToastContext';
import registrosProduccionDamabravaService from '../../../../../services/registrosProduccionDamabravaService';

function ModalAnularVerificacion({ isOpen, setIsOpen, registro, onAnulado }) {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);

    const terminados = registro?.terminados || 0;
    const cantidadVerificada = registro?.cantidad_verificada || 0;
    const diferencia = Math.max(0, cantidadVerificada - terminados);

    const handleAnular = async () => {
        if ((registro?.cantidad_ingresada || 0) > 0) {
            showWarning('Advertencia', 'No se puede anular la verificación porque ya hay cantidad ingresada al almacén');
            return;
        }

        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.unverify(registro?.id);

            if (response.success) {
                showSuccess('Verificación anulada', 'Verificación anulada correctamente');
                setIsOpen(false);
                if (onAnulado) onAnulado(response.data);
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

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Anular Verificación"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas anular la verificación de este registro? Esta acción no se puede deshacer.
                </p>

                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="error" align="left">
                        Al anular la verificación se regresará la materia prima de la receta del monto verificado. Si terminados es {terminados} y se verificó {cantidadVerificada}, se devolverá la materia prima de la receta pero de la diferencia de {diferencia}.
                    </Text>
                </div>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-orange'
                        label='Si, Anular'
                        style={{ marginTop: 'auto' }}
                        onClick={handleAnular}
                        loading={loading}
                        segundosDisabled={5}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalAnularVerificacion;
