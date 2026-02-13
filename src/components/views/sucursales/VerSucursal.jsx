import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import ListData from '../../common/ListData';
import ItemView from '../../common/ItemView';
import Boton from '../../common/Boton';
import EditarAgregarSucursal from './EditarAgregarSucursal';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import sucursalesService from '../../../services/sucursalesService';
import { useToast } from '../../../context/ToastContext';
import useHistorialLogger from '../../ui/HistorialLogger';

function VerSucursal({ isOpen, setIsOpen, sucursal, onSucursalDeleted, onSucursalUpdated }) {
    const { showSuccess, showDanger } = useToast();
    const { logAccion } = useHistorialLogger({ modulo: 'Sucursales' });
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Estado local para la sucursal actual
    const [sucursalActual, setSucursalActual] = useState(sucursal);

    // Actualizar el estado local cuando cambie el prop sucursal
    useEffect(() => {
        setSucursalActual(sucursal);
    }, [sucursal]);

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await sucursalesService.delete(sucursalActual.id);
            if (response.success) {
                const preciosItems = sucursalActual?.name === 'Casa Matriz'
                    ? ['Todos los precios']
                    : (sucursalActual?.precios?.map(p => p.name) || []);
                const almacenLabel = sucursalActual?.almacen_sucursal_id ? 'No' : 'Sí';
                const camposOrden = ['Nombre de la sucursal', 'Almacén separado', 'Tipos de precios'];
                const camposDetalle = {
                    'Nombre de la sucursal': { antes: sucursalActual?.name ?? null },
                    'Almacén separado': { antes: almacenLabel },
                    'Tipos de precios': { antes: preciosItems.length ? preciosItems : null }
                };
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    camposOrden,
                    comentario: 'Eliminación de sucursal'
                };
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: sucursalActual?.name || 'Sucursal',
                    registroId: sucursalActual.id,
                    comentario: 'Eliminación de sucursal',
                    detallesPersonalizados
                });

                setIsEliminarOpen(false);
                setIsOpen(false);
                if (onSucursalDeleted) {
                    onSucursalDeleted(sucursalActual.id);
                }
                showSuccess('Éxito', 'Sucursal eliminada correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar la sucursal');
            }
        } catch (error) {
            console.error('Error eliminando sucursal:', error);
            showDanger('Error', 'Error al eliminar la sucursal');
        } finally {
            setLoading(false);
        }
    };

    const handleSucursalUpdated = (updatedSucursal) => {
        setSucursalActual(updatedSucursal);
        if (onSucursalUpdated) {
            onSucursalUpdated(updatedSucursal);
        }
        setIsEditarOpen(false);
    };

    const preciosItems = sucursalActual?.name === 'Casa Matriz'
        ? ['Todos los precios']
        : (sucursalActual?.precios?.map(precio => precio.name) || []);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>DETALLES</h1>
                    </div>
                </div>
                <div className={styles.contentRow}>
                    <div className={styles.contentHalf}>
                        <div className={styles.content}>
                            <ItemView
                                title="Información de la sucursal"
                                transparent={true}
                                icon="building"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <Dato label="Nombre" value={sucursalActual?.name || 'Sin nombre'} vertical={true} />
                            <Dato label="Tipo de almacén" value={sucursalActual?.almacen_sucursal_id ? 'Comparte' : 'Propio'} vertical={true} />
                            <Dato label="Fecha de creación" value={sucursalActual?.created_at ? new Date(sucursalActual.created_at).toLocaleDateString('es-ES') : 'Sin fecha'} vertical={true} />
                            <Dato
                                label="Total de Pedidos"
                                value={sucursalActual?.total_pedidos !== undefined ? sucursalActual.total_pedidos.toString() : '0'}
                                especial="blue"
                                vertical={true}
                            />
                        </div>
                    </div>
                    <div className={styles.contentHalf}>
                        <div className={styles.content} style={{ height:'100%' }}>
                            <ItemView
                                title="Precios asignados"
                                transparent={true}
                                icon="dollar"
                                iconShape="square"
                                style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                            />
                            <ListData
                                label=""
                                items={preciosItems}
                                emptyText={sucursalActual?.name === 'Casa Matriz' ? 'Todos los precios' : 'Sin precios asignados'}
                                badgeColor="orange"
                                badgeIcon="dollar"
                            />
                        </div>
                    </div>
                </div>

                {sucursalActual?.name !== 'Casa Matriz' && (
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Editar Sucursal'
                            onClick={() => setIsEditarOpen(true)}
                            iconName='edit'
                            hideTextOnMobile={true}
                        />
                        <Boton
                            className='btn-red'
                            label='Eliminar Sucursal'
                            onClick={() => setIsEliminarOpen(true)}
                            iconName='trash'
                            hideTextOnMobile={true}
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
                            iconName='x'
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleEliminar}
                            loading={loading}
                            segundosDisabled={5}
                            iconName='trash'
                        />
                    </div>
                </div>
            </ViewModal>
        </View>
    );
}

export default VerSucursal;
