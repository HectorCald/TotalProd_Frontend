import React, { useState } from 'react';
import ViewModal from '../../../ui/ViewModal';
import HeaderModal from '../../../common/HeaderModal';
import Boton from '../../../common/Boton';
import { useToast } from '../../../../context/ToastContext';
import useHistorialLogger from '../../../ui/HistorialLogger';
import clientService from '../../../../services/clientService';
import { useUser } from '../../../../context/UserContext';
import styles from '../../../../styles/view.module.css';

function ModalEliminar({ 
    isOpen, 
    setIsOpen, 
    cliente,
    setIsOpenVerCliente,
    onClienteEliminado
}) {
    const { showDanger, showSuccess } = useToast();
    const { sucursalSeleccionada } = useUser();
    const [loading, setLoading] = useState(false);
    
    const { logAccion } = useHistorialLogger({
        modulo: 'Clientes',
        campos: ['name', 'phone', 'description', 'total_orders', 'location']
    });

    const handleEliminar = async () => {
        if (!cliente?.id) {
            showDanger('Error', 'ID del cliente no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await clientService.delete(cliente.id, sucursalSeleccionada?.id);

            if (response.success) {
                // Detalles con TODOS los datos eliminados (keys = labels en español, solo antes)
                const mapeoCampos = {
                    name: 'Nombre completo',
                    phone: 'Celular',
                    description: 'Descripción (opcional)',
                    total_orders: 'Total de pedidos',
                    location: 'Coordenadas'
                };
                const camposDetalle = {};
                Object.entries(mapeoCampos).forEach(([campoDb, label]) => {
                    camposDetalle[label] = {
                        antes: cliente?.[campoDb] ?? null
                    };
                });
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    comentario: 'Eliminación de cliente'
                };

                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: cliente?.name || 'Cliente',
                    registroId: cliente?.id || null,
                    comentario: 'Eliminación de cliente',
                    detallesPersonalizados
                });

                setIsOpen(false);
                if (setIsOpenVerCliente) {
                    setIsOpenVerCliente(false);
                }

                if (onClienteEliminado) {
                    onClienteEliminado(cliente.id);
                }

                showSuccess('Éxito', 'Cliente eliminado correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar el cliente');
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            showDanger('Error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    };

    return (
        <ViewModal isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderModal
                title="Eliminar Cliente"
                onClose={() => setIsOpen(false)}
            />
            <div className={styles.modalContent}>
                <p className={styles.subTitle}>
                    ¿Eliminar al cliente {cliente?.name}? Esta acción es irreversible y puede afectar registros relacionados.
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
