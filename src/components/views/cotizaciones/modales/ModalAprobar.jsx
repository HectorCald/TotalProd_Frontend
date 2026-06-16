import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';
import styles from '../../../../styles/view.module.css';

function ModalAprobar({ 
    isOpen, 
    setIsOpen, 
    cotizacionActual,
    setCotizacionActual,
    onCotizacionActualizada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleAprobar = async () => {
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

                showSuccess('Éxito', 'Cotización aprobada correctamente');
                setIsOpen(false);
            } else {
                showDanger('Error', response.message || 'Error al aprobar la cotización');
            }
        } catch (error) {
            console.error('Error actualizando estado de cotización:', error);
            showDanger('Error', 'Error al aprobar la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Aprobar Cotización"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas aprobar esta cotización? Una vez aprobada, podrás realizar la venta de manera directa.
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
                        label='Sí, aprobar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleAprobar}
                        loading={loading}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalAprobar;
