import React, { useState } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import EditarAgregarSucursal from './EditarAgregarSucursal';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import sucursalesService from '../../../services/sucursalesService';
import LoadingSpinner from '../../common/LoadingSpinner';
import Notification from '../../common/Notification';

function VerSucursal({ isOpen, setIsOpen, sucursal, onSucursalDeleted, onSucursalUpdated }) {
    const [isEditarOpen, setIsEditarOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);
    const [loading, setLoading] = useState(false);

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
            const response = await sucursalesService.delete(sucursal.id);
            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);
                if (onSucursalDeleted) {
                    onSucursalDeleted(sucursal.id);
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
        if (onSucursalUpdated) {
            onSucursalUpdated(updatedSucursal);
        }
        setIsEditarOpen(false);
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {sucursal?.name}
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsEliminarOpen(true)}>
                            <BoxIcon
                                name='trash'
                                className={styles.iconTrash}
                            />
                        </button>
                        <button className={styles.iconButton} onClick={() => setIsEditarOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.icon}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DE LA SUCURSAL</p>
                <div className={styles.content}>
                    <Dato
                        label="Nombre"
                        value={sucursal?.name || 'Sin nombre'}
                    />
                    <Dato
                        label="Fecha de creación"
                        value={sucursal?.created_at ? new Date(sucursal.created_at).toLocaleDateString('es-ES') : 'Sin fecha'}
                    />
                </div>
            </div>

            {/* Modal de editar sucursal */}
            <EditarAgregarSucursal
                isOpen={isEditarOpen}
                setIsOpen={setIsEditarOpen}
                data={sucursal}
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
                            className='btn-red'
                            label='Sí, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={handleEliminar}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(false)}
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
