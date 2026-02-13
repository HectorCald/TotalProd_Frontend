import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import deudasService from '../../../../services/deudasService';
import useHistorialLogger from '../../../ui/HistorialLogger';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    deudaActual,
    setIsOpenVerDeuda,
    onDeudaEliminada
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const { logAccion } = useHistorialLogger({ modulo: 'Deudas' });

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await deudasService.delete(deudaActual.id);

            if (response.success) {
                // Detalles en orden del formulario. Keys en español.
                const clienteNombre = deudaActual?.cliente?.name ?? null;
                const camposOrden = [
                    'Fecha de deuda',
                    'Fecha de vencimiento',
                    'Monto total (Bs.)',
                    'Concepto',
                    'Cliente'
                ];
                const camposDetalle = {
                    'Fecha de deuda': { antes: deudaActual?.fecha_deuda ?? null },
                    'Fecha de vencimiento': { antes: deudaActual?.fecha_vencimiento ?? null },
                    'Monto total (Bs.)': { antes: deudaActual?.monto_total ?? null },
                    'Concepto': { antes: deudaActual?.concepto ?? null },
                    'Cliente': { antes: clienteNombre }
                };
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    camposOrden,
                    comentario: 'Eliminación de deuda'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: deudaActual?.concepto || 'Deuda',
                    registroId: deudaActual?.id || null,
                    comentario: 'Eliminación de deuda',
                    detallesPersonalizados
                });

                setIsOpen(false);
                if (setIsOpenVerDeuda) {
                    setIsOpenVerDeuda(false);
                }
                if (onDeudaEliminada) {
                    onDeudaEliminada(deudaActual.id);
                }
                showSuccess('Éxito', 'Deuda eliminada correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar la deuda');
            }
        } catch (error) {
            console.error('Error eliminando deuda:', error);
            showDanger('Error', 'Error al eliminar la deuda');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Deuda"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar permanentemente esta deuda? Esta acción no se puede deshacer.
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
