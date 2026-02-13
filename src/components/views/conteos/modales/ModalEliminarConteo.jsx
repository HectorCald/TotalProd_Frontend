import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import { buildConteoDetallesParaHistorial } from '../../../../utils/logFormatters';
import conteosService from '../../../../services/conteosService';
import styles from '../../../../styles/view.module.css';

function ModalEliminarConteo({ 
    isOpen, 
    setIsOpen, 
    conteo,
    onConteoDeleted,
    onClose
}) {
    const { showSuccess, showDanger } = useToast();
    const [loading, setLoading] = useState(false);
    
    const moduloConteo = conteo?.tipo === 'acopio' ? 'Pesaje' : 'Conteo';
    const { logAccion } = useHistorialLogger({
        modulo: moduloConteo
    });

    const handleEliminarConteo = async () => {
        if (!conteo?.id) return;

        try {
            setLoading(true);
            const result = await conteosService.delete(conteo.id);
            
            if (result.success) {
                showSuccess('Éxito', 'Conteo eliminado correctamente');
                setIsOpen(false);

                const detallesPersonalizados = buildConteoDetallesParaHistorial(conteo, 'ELIMINAR');
                const codigo = conteo?.codigo ?? conteo?.id ?? '';

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `Conteo ${codigo ? '#' + codigo : ''}`.trim() || 'Conteo',
                    registroId: conteo.id,
                    comentario: 'Eliminación de conteo',
                    detallesPersonalizados
                });

                if (onConteoDeleted) {
                    onConteoDeleted(conteo.id);
                }

                if (onClose) {
                    onClose();
                }
            } else {
                showDanger('Error', result.message || 'Error al eliminar el conteo');
            }
        } catch (error) {
            console.error('Error al eliminar conteo:', error);
            showDanger('Error', 'Error al eliminar el conteo');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Conteo"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Estás seguro que deseas eliminar permanentemente este conteo? Esta acción no se puede deshacer y se eliminarán todos los detalles asociados.
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
                        onClick={handleEliminarConteo}
                        loading={loading}
                        disabled={loading}
                        segundosDisabled={5}
                    />
                </div>
            </div>
        </ViewModal>
    );
}

export default ModalEliminarConteo;
