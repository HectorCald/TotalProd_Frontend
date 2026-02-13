import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import proveedorService from '../../../../services/proveedorService';
import { useUser } from '../../../../context/UserContext';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    proveedor,
    setIsOpenVerProveedor,
    onProveedorEliminado
}) {
    const { showDanger, showSuccess } = useToast();
    const { sucursalSeleccionada } = useUser();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Proveedores',
        campos: ['name', 'phone', 'description', 'location']
    });

    const handleEliminar = async () => {
        if (!proveedor?.id) {
            showDanger('Error', 'ID del proveedor no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await proveedorService.delete(proveedor.id, sucursalSeleccionada?.id);

            if (response.success) {
                // Detalles con TODOS los datos eliminados (keys = labels en español, solo antes)
                const mapeoCampos = {
                    name: 'Nombre completo',
                    phone: 'Celular',
                    description: 'Descripción (opcional)',
                    location: 'Coordenadas'
                };
                const camposDetalle = {};
                Object.entries(mapeoCampos).forEach(([campoDb, label]) => {
                    camposDetalle[label] = {
                        antes: proveedor?.[campoDb] ?? null
                    };
                });
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    comentario: 'Eliminación de proveedor'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: proveedor?.name || 'Proveedor',
                    registroId: proveedor?.id || null,
                    comentario: 'Eliminación de proveedor',
                    detallesPersonalizados
                });

                setIsOpen(false);
                if (setIsOpenVerProveedor) {
                    setIsOpenVerProveedor(false);
                }

                if (onProveedorEliminado) {
                    onProveedorEliminado(proveedor.id);
                }

                showSuccess('Éxito', 'Proveedor eliminado correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar el proveedor');
            }
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            showDanger('Error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Proveedor"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Eliminar al proveedor {proveedor?.name}? Esta acción es irreversible y puede afectar registros relacionados.
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
