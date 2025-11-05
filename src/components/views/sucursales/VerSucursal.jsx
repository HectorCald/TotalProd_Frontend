import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import ListData from '../../common/ListData';
import Boton from '../../common/Boton';
import EditarAgregarSucursal from './EditarAgregarSucursal';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import sucursalesService from '../../../services/sucursalesService';
import Notification from '../../common/Notification';

function VerSucursal({ isOpen, setIsOpen, sucursal, onSucursalDeleted, onSucursalUpdated }) {
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Estado local para la sucursal actual
    const [sucursalActual, setSucursalActual] = useState(sucursal);

    // Actualizar el estado local cuando cambie el prop sucursal
    useEffect(() => {
        setSucursalActual(sucursal);
    }, [sucursal]);

    const [notification, setNotification] = useState({
        isVisible: false,
        type: 'success',
        text: ''
    });
    const mostrarNotificacion = (tipo, texto) => {
        setNotification({
            isVisible: true,
            type: tipo,
            text: texto
        });

        // Auto-ocultar después de 3 segundos
        setTimeout(() => {
            setNotification(prev => ({ ...prev, isVisible: false }));
        }, 3000);
    };

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await sucursalesService.delete(sucursalActual.id);
            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);
                if (onSucursalDeleted) {
                    onSucursalDeleted(sucursalActual.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar la sucursal');
            }
        } catch (error) {
            console.error('Error eliminando sucursal:', error);
            mostrarNotificacion('error', 'Error al eliminar la sucursal');
        } finally {
            setLoading(false);
        }
    };

    const handleSucursalUpdated = (updatedSucursal) => {
        // Actualizar el estado local de la sucursal
        setSucursalActual(updatedSucursal);

        // Actualizar el estado en el componente padre
        if (onSucursalUpdated) {
            onSucursalUpdated(updatedSucursal);
        }

        // Cerrar solo el modal de edición, NO el modal principal
        setIsEditarOpen(false);
        
        // Mostrar notificación de éxito
        mostrarNotificacion('success', 'Sucursal actualizada correctamente');
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {sucursalActual?.name}
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DE LA SUCURSAL</p>
                <div className={styles.content}>
                    <Dato
                        label="Nombre"
                        value={sucursalActual?.name || 'Sin nombre'}
                    />
                    <Dato
                        label="Tipo de almacén"
                        value={sucursalActual?.almacen_sucursal_id ? 'Comparte' : 'Propio'}
                    />
                    <Dato
                        label="Fecha de creación"
                        value={sucursalActual?.created_at ? new Date(sucursalActual.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}
                    />
                    <Dato
                        label="Total de Pedidos"
                        value={sucursalActual?.total_pedidos !== undefined ? sucursalActual.total_pedidos.toString() : '0'}
                        especial="blue"
                    />
                    <ListData
                        label="Precios asignados"
                        items={sucursalActual?.name === 'Casa Matriz' ? ['Todos los precios'] : (sucursalActual?.precios?.map(precio => precio.name) || [])}
                        emptyText={sucursalActual?.name === 'Casa Matriz' ? 'Todos los precios' : 'Sin precios asignados'}
                        badgeColor="orange"
                        badgeIcon="dollar"
                    />
                </div>

                {sucursalActual?.name !== 'Casa Matriz' && (
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Editar Sucursal'
                            onClick={() => {
                                setIsEditarOpen(true);
                            }}
                        />
                        <Boton
                            className='btn-red'
                            label='Eliminar Sucursal'
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    </div>
                )}
            </div>

            {/* Modal de editar sucursal */}
            <EditarAgregarSucursal
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={sucursalActual}
                tipo='editar'
                onSucursalUpdated={handleSucursalUpdated}
            />

            {/* Modal de eliminar sucursal */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Sucursal"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar esta sucursal? Esta acción no se puede deshacer.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
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

            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}

export default VerSucursal;
