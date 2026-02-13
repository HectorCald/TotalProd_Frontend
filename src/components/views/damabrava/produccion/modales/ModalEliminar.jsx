import React, { useState } from 'react';
import styles from '../../../../../styles/view.module.css';
import ViewModal from '../../../../ui/ViewModal';
import HeaderModal from '../../../../common/HeaderModal';
import Boton from '../../../../common/Boton';
import Text from '../../../../common/Text';
import { useToast } from '../../../../../context/ToastContext';
import useHistorialLogger from '../../../../ui/HistorialLogger';
import { buildProduccionDetallesParaHistorial } from '../../../../../utils/logFormatters';
import registrosProduccionDamabravaService from '../../../../../services/registrosProduccionDamabravaService';

function ModalEliminar({ isOpen, setIsOpen, registro, onEliminado }) {
    const { showSuccess, showDanger, showWarning } = useToast();
    const [loading, setLoading] = useState(false);
    const { logAccion } = useHistorialLogger({ modulo: 'Producción' });

    const terminados = registro?.terminados || 0;

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await registrosProduccionDamabravaService.delete(registro?.id);

            if (response.success) {
                const det = buildProduccionDetallesParaHistorial(registro, 'ELIMINAR');
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `Registro Producción Lote ${registro?.lote ?? registro?.id ?? ''} - ${registro?.producto_almacen?.name ?? 'Producto'}`,
                    registroId: registro?.id || null,
                    detallesPersonalizados: det
                });

                showSuccess('Registro eliminado', 'Registro eliminado correctamente');
                setIsOpen(false);
                if (onEliminado) onEliminado(registro?.id);
            } else {
                showWarning('Advertencia', response.message || 'Error al eliminar el registro');
            }
        } catch (error) {
            console.error('Error eliminando registro:', error);
            showDanger('Error', error.message || 'Error al eliminar el registro');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Registro"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar este registro? Esta acción no se puede deshacer.
                </p>
                <div style={{ marginTop: '10px', width: '100%' }}>
                    <Text type="error" align="left">
                        Al eliminar el registro de producción se devolverá el peso total de la materia prima de la receta del producto según terminados hayan ({terminados}).
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
