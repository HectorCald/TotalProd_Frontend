import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import gastosService from '../../../../services/gastosService';
import useHistorialLogger from '../../../ui/HistorialLogger';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    gasto,
    setIsOpenVerGasto,
    onGastoEliminado
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    const { logAccion } = useHistorialLogger({ modulo: 'Gastos' });

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await gastosService.delete(gasto.id);

            if (response.success) {
                // Detalles en orden del formulario. Keys en español.
                const proveedorNombre = gasto?.proveedor?.name ?? null;
                const camposOrden = [
                    'Fecha del gasto',
                    'Valor del gasto (Bs.)',
                    'Concepto del gasto',
                    'Método de pago',
                    'Proveedor'
                ];
                const camposDetalle = {
                    'Fecha del gasto': { antes: gasto?.fecha_gasto ?? null },
                    'Valor del gasto (Bs.)': { antes: gasto?.valor ?? null },
                    'Concepto del gasto': { antes: gasto?.concepto ?? null },
                    'Método de pago': { antes: gasto?.metodo_pago ?? null },
                    'Proveedor': { antes: proveedorNombre }
                };
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    camposOrden,
                    comentario: 'Eliminación de gasto'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: gasto?.concepto || 'Gasto',
                    registroId: gasto?.id || null,
                    comentario: 'Eliminación de gasto',
                    detallesPersonalizados
                });

                setIsOpen(false);
                if (setIsOpenVerGasto) {
                    setIsOpenVerGasto(false);
                }
                if (onGastoEliminado) {
                    onGastoEliminado(gasto.id);
                }
                showSuccess('Éxito', 'Gasto eliminado correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar el gasto');
            }
        } catch (error) {
            console.error('Error eliminando gasto:', error);
            showDanger('Error', 'Error al eliminar el gasto');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Gasto"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar permanentemente este gasto? Esta acción no se puede deshacer.
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
