import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import cotizacionesService from '../../../../services/cotizacionesService';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    cotizacionActual,
    onCotizacionEliminada,
    onClose
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);

    const handleEliminar = async () => {
        if (!cotizacionActual) return;

        try {
            setLoading(true);
            const response = await cotizacionesService.eliminar(cotizacionActual.id);

            if (response.success) {
                showSuccess('Éxito', 'Cotización eliminada correctamente');
                setIsOpen(false);

                if (onCotizacionEliminada) {
                    onCotizacionEliminada(cotizacionActual.id);
                }

                if (onClose) {
                    onClose();
                }
            } else {
                showDanger('Error', response.message || 'Error al eliminar la cotización');
            }
        } catch (error) {
            console.error('Error eliminando cotización:', error);
            showDanger('Error', 'Error al eliminar la cotización');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Cotización"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar permanentemente esta cotización? Esta acción no se puede deshacer.
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
                        label='Sí, eliminar'
                        style={{ marginTop: 'auto' }}
                        onClick={handleEliminar}
                        loading={loading}
                        segundosDisabled={5}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalEliminar;
