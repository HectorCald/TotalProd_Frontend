import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import ItemView from '../../common/ItemView';
import Boton from '../../common/Boton';
import EditarAgregarPrecio from './EditarAgregarPrecio';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import pricesTypesService from '../../../services/pricesTypesService';
import { useToast } from '../../../context/ToastContext';
import useHistorialLogger from '../../ui/HistorialLogger';

function VerPrecio({ isOpen, setIsOpen, precio, onPrecioDeleted, onPrecioUpdated }) {
    const { showSuccess, showDanger } = useToast();
    const { logAccion } = useHistorialLogger({ modulo: 'Precios' });
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

    // Estado local para actualización en tiempo real (como VerProducto/VerGasto)
    const [precioActual, setPrecioActual] = useState(precio);

    useEffect(() => {
        setPrecioActual(precio);
    }, [precio]);

    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await pricesTypesService.delete(precioActual.id);
            if (response.success) {
                const camposOrden = ['Nombre del tipo de precio', 'Descripción (opcional)'];
                const camposDetalle = {
                    'Nombre del tipo de precio': { antes: precioActual?.name ?? null },
                    'Descripción (opcional)': { antes: precioActual?.description ?? null }
                };
                const detallesPersonalizados = {
                    campos: camposDetalle,
                    camposOrden,
                    comentario: 'Eliminación de tipo de precio'
                };
                await logAccion({
                    accion: 'ELIMINAR',
                    lugarAfectado: precioActual?.name || 'Tipo de precio',
                    registroId: precioActual.id,
                    comentario: 'Eliminación de tipo de precio',
                    detallesPersonalizados
                });

                setIsEliminarOpen(false);
                setIsOpen(false);
                if (onPrecioDeleted) {
                    onPrecioDeleted(precioActual.id);
                }
                showSuccess('Éxito', 'Tipo de precio eliminado correctamente');
            } else {
                showDanger('Error', response.message || 'Error al eliminar el tipo de precio');
            }
        } catch (error) {
            console.error('Error eliminando tipo de precio:', error);
            showDanger('Error', 'Error al eliminar el tipo de precio');
        } finally {
            setLoading(false);
        }
    };

    const handlePrecioUpdated = (updatedPrecio) => {
        setPrecioActual(updatedPrecio);
        if (onPrecioUpdated) {
            onPrecioUpdated(updatedPrecio);
        }
        setIsEditarOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <div className={styles.header}>
                    <div className={styles.headerContent}>
                        <h1 className={styles.title}>DETALLES</h1>
                    </div>
                </div>
                <div className={styles.content}>
                    <ItemView
                        title="Información del tipo de precio"
                        transparent={true}
                        icon="dollar"
                        iconShape="square"
                        style={{ padding: '0', minHeight: 'auto', marginBottom: '10px' }}
                    />
                    <Dato
                        label="Nombre"
                        value={precioActual?.name || 'Sin nombre'}
                    />
                    <Dato
                        label="Descripción"
                        value={precioActual?.description || 'Sin descripción'}
                    />
                </div>

                <div className={styles.buttons}>
                    <Boton
                        className='btn-default'
                        label='Editar Tipo de Precio'
                        onClick={() => setIsEditarOpen(true)}
                        iconName='edit'
                        hideTextOnMobile={true}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Tipo de Precio'
                        onClick={() => setIsEliminarOpen(true)}
                        iconName='trash'
                        hideTextOnMobile={true}
                    />
                </div>
            </div>

            {/* Modal de editar precio */}
            <EditarAgregarPrecio
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={precioActual}
                tipo='editar'
                onPrecioUpdated={handlePrecioUpdated}
            />

            {/* Modal de eliminar precio */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Tipo de Precio"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar este tipo de precio? Esta acción no se puede deshacer. Si el tipo de precio tiene productos asignados, no se podrá eliminar.
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

export default VerPrecio;