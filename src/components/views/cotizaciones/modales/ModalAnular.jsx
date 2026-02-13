import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';
import styles from '../../../../styles/view.module.css';

function ModalAnular({ 
    isOpen, 
    setIsOpen, 
    cotizacionActual,
    setCotizacionActual,
    onCotizacionAnulada,
    onCotizacionActualizada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleAnular = async () => {
        if (!cotizacionActual) return;

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionActual.id, 'anulado');

            if (response.success) {
                const cotizacionActualizada = response.data;
                setCotizacionActual(cotizacionActualizada);

                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                if (onCotizacionAnulada && cotizacionActual.id) {
                    onCotizacionAnulada(cotizacionActual.id);
                }

                showSuccess('Éxito', 'Cotización anulada correctamente');
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'Error al anular la cotización');
            }
        } catch (error) {
            console.error('Error actualizando estado de cotización:', error);
            showDanger('Error', 'Error al anular la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Anular Cotización"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas anular esta cotización? Esta acción no se puede deshacer.
                </p>
                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Cancelar'
                        style={{ marginTop: 'auto' }}
                        onClick={() => setIsOpen(false)}
                    />
                    <Boton
                        className='btn-red'
                        label='Sí, anular'
                        style={{ marginTop: 'auto' }}
                        onClick={handleAnular}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalAnular;
