import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import personalService from '../../../../services/personalService';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    personal,
    sucursales = [],
    setIsOpenVerPersona,
    onPersonalEliminado
}) {
    const { showDanger, showSuccess } = useToast();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Personal',
        campos: ['first_name', 'last_name', 'codigo', 'cargo', 'sucursal', 'is_active', 'permisos']
    });

    const handleEliminar = async () => {
        if (!personal?.id) {
            showDanger('Error', 'ID del personal no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await personalService.delete(personal.id);

            if (response.success) {
                // Detalles: información general + todos los permisos (sin módulos). Keys = labels en español.
                const sucursalNombre = personal?.sucursal?.name ?? sucursales.find(s => s.id === personal?.sucursal_id)?.name ?? null;
                const labelsPermisos = {
                    crear: 'Permiso de creación',
                    eliminar: 'Permiso de eliminación',
                    editar: 'Permiso de edición',
                    anular: 'Permiso de anulación',
                    reemplazar: 'Permiso de reemplazo',
                    info: 'Permiso de información',
                    sucursales: 'Permiso de sucursales'
                };
                const camposDetalle = {
                    'Nombres': { antes: personal?.first_name ?? null },
                    'Apellidos': { antes: personal?.last_name ?? null },
                    'Código': { antes: personal?.codigo ?? null },
                    'Cargo': { antes: personal?.cargo ?? null },
                    'Sucursal': { antes: sucursalNombre },
                    'Activo': { antes: personal?.is_active ?? false }
                };
                Object.entries(labelsPermisos).forEach(([key, label]) => {
                    camposDetalle[label] = { antes: personal?.permisos?.[key] ?? false };
                });
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    comentario: 'Eliminación de personal'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: `${personal?.first_name || ''} ${personal?.last_name || ''}`.trim() || 'Personal',
                    registroId: personal?.id || null,
                    comentario: 'Eliminación de personal',
                    detallesPersonalizados
                });

                setIsOpen(false);
                if (setIsOpenVerPersona) {
                    setIsOpenVerPersona(false);
                }

                if (onPersonalEliminado) {
                    onPersonalEliminado(personal.id);
                }

                showSuccess('Éxito', 'Personal eliminado correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar el personal');
            }
        } catch (error) {
            console.error('Error al eliminar personal:', error);
            showDanger('Error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Personal"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Eliminar al personal {personal?.first_name} {personal?.last_name}? Esta acción es irreversible y puede afectar registros relacionados.
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
