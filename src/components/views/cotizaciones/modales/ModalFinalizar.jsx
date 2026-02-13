import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';
import styles from '../../../../styles/view.module.css';

function ModalFinalizar({ 
    isOpen, 
    setIsOpen, 
    cotizacionActual,
    setCotizacionActual,
    onCotizacionActualizada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleFinalizar = async () => {
        if (!cotizacionActual) return;

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionActual.id, 'completado');

            if (response.success) {
                const cotizacionActualizada = response.data;
                setCotizacionActual(cotizacionActualizada);

                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                showSuccess('Éxito', 'Cotización finalizada correctamente');
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'Error al finalizar la cotización');
            }
        } catch (error) {
            console.error('Error actualizando estado de cotización:', error);
            showDanger('Error', 'Error al finalizar la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Finalizar Cotización"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Deseas marcar esta cotización como completada? Luego solo podrás revertirla a estado aprobado.
                </p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-green'
                        label='Sí, finalizar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleFinalizar}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalFinalizar;
