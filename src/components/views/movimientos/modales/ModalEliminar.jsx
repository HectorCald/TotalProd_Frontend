import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/old/HeaderModal';
import Boton from '../../../common/botones/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildMovimientoDetallesParaHistorial } from '../../../../utils/logFormatters';
import movimientosAlmacenService from '../../../../services/movimientosAlmacenService';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    movimientoActual,
    setIsOpenVerMovimiento,
    onMovimientoEliminado
}) {
    const { showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Movimientos'
    });

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const movimientoAntesRaw = movimientoActual ? JSON.parse(JSON.stringify(movimientoActual)) : null;
            const response = await movimientosAlmacenService.eliminar(movimientoActual.id);

            if (response.success) {
                setIsOpen(false);
                setIsOpenVerMovimiento(false);

                const detallesPersonalizados = buildMovimientoDetallesParaHistorial(
                    movimientoAntesRaw,
                    null,
                    'ELIMINAR'
                );
                const codigoMov = movimientoAntesRaw?.codigo ?? movimientoAntesRaw?.id ?? movimientoActual?.id ?? '';
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `Movimiento ${codigoMov ? '#' + codigoMov : ''}`.trim() || 'Movimiento',
                    registroId: movimientoAntesRaw?.id || movimientoActual?.id || null,
                    comentario: 'Eliminación de movimiento',
                    detallesPersonalizados
                });

                if (onMovimientoEliminado) {
                    onMovimientoEliminado(movimientoActual.id);
                }
            } else {
                showDanger('Error', response.message || 'Error al eliminar el movimiento');
            }
        } catch (error) {
            console.error('Error eliminando movimiento:', error);
            showDanger('Error', 'Error al eliminar el movimiento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Movimiento"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar permanentemente este movimiento? Esta acción no se puede deshacer.
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
