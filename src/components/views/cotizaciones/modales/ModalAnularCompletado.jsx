import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';
import styles from '../../../../styles/view.module.css';

function ModalAnularCompletado({ 
    isOpen, 
    setIsOpen, 
    cotizacionActual,
    setCotizacionActual,
    onCotizacionActualizada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleAnularCompletado = async () => {
        if (!cotizacionActual) return;

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionActual.id, 'aprobada');

            if (response.success) {
                const cotizacionActualizada = response.data;
                setCotizacionActual(cotizacionActualizada);

                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                showSuccess('Éxito', 'Cotización marcada nuevamente como aprobada');
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'Error al anular el completado');
            }
        } catch (error) {
            console.error('Error actualizando estado de cotización:', error);
            showDanger('Error', 'Error al anular el completado');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Anular Completado"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Quieres devolver esta cotización al estado aprobado? Podrás finalizarla nuevamente cuando lo necesites.
                </p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-gray'
                        label='Sí, volver a aprobado'
                        style={{ marginTop: 'auto' }}
                        onClick={handleAnularCompletado}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalAnularCompletado;
