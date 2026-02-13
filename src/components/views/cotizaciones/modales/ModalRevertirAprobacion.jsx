import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';
import styles from '../../../../styles/view.module.css';

function ModalRevertirAprobacion({ 
    isOpen, 
    setIsOpen, 
    cotizacionActual,
    setCotizacionActual,
    onCotizacionActualizada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleRevertirAprobacion = async () => {
        if (!cotizacionActual) return;

        setLoading(true);
        try {
            const response = await cotizacionesService.actualizarEstado(cotizacionActual.id, 'pendiente');

            if (response.success) {
                const cotizacionActualizada = response.data;
                setCotizacionActual(cotizacionActualizada);

                if (onCotizacionActualizada) {
                    onCotizacionActualizada(cotizacionActualizada);
                }

                showSuccess('Éxito', 'Cotización marcada como pendiente nuevamente');
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'Error al revertir la aprobación');
            }
        } catch (error) {
            console.error('Error actualizando estado de cotización:', error);
            showDanger('Error', 'Error al revertir la aprobación');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Anular aprobación"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Quieres volver a poner esta cotización en estado pendiente? Perderá el estado de aprobación actual.
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
                        label='Sí, volver a pendiente'
                        style={{ marginTop: 'auto' }}
                        onClick={handleRevertirAprobacion}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalRevertirAprobacion;
