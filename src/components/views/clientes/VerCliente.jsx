import React, { useState, useEffect } from 'react';
import styles from './VerCliente.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import MensajeExito from '../../common/MensajeExito';
import MensajeError from '../../common/MensajeError';
import clientService from '../../../services/clientService';
import ItemLine from '../../common/ItemLine';
import MapaModal from './MapaModal';

function VerCliente({ isOpen, setIsOpen, usuario, onClientDeleted, onClientUpdated }) {
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [mensajeExito, setMensajeExito] = useState('');
    const [loading, setLoading] = useState(false);
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);
    const handleEliminar = async (id) => {
        if (!id) {
            setErrorMessage('ID del cliente no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await clientService.delete(id);
            
            if (response.success) {
                setMensajeExito('Cliente eliminado exitosamente');
                setTimeout(() => {
                    setMensajeExito('');
                    setIsDeleteOpen(false);
                    setIsOpen(false);
                    // Notificar al componente padre que se eliminó un cliente
                    if (onClientDeleted) {
                        onClientDeleted(id);
                    }
                }, 2000);
            } else {
                setErrorMessage(response.message || 'Error al eliminar el cliente');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    }

    // Limpiar mensajes al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            setErrorMessage('');
            setMensajeExito('');
        }
    }, [isOpen]);

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {usuario?.name}
                    <div className={styles.iconButton} >
                        <button className={styles.iconButton} onClick={() => setIsDeleteOpen(true)}>
                            <BoxIcon
                                name='trash'
                                className={styles.iconTrash}
                            />
                        </button>

                        <button className={styles.iconButton} onClick={() => setIsEditOpen(true)}>
                            <BoxIcon
                                name='edit'
                                className={styles.icon}
                            />
                        </button>
                    </div>

                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Celular" value={usuario?.phone || 'N/A'} />
                </div>
                <p className={styles.subTitle}>UBICACIÓN</p>
                <div className={styles.content}>
                    <ItemLine icon="map-pin" title="Dirección" onClick={() => setIsMapModalOpen(true)} arrow={true} />
                </div>
                <p className={styles.subTitle}>PEDIDOS</p>
                <div className={styles.content}>
                    <Dato label="Total pedidos" value={usuario?.total_orders} />
                </div>
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar 
                isOpen={isEditOpen} 
                setIsOpen={setIsEditOpen} 
                usuario={usuario} 
                tipo='editar'
                onClientUpdated={onClientUpdated}
            />

            {/* Modal de Eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas eliminar al cliente {usuario?.name} ?, Esta acción no se puede deshacer y podría afectar a registros relacionados.</p>
                    <MensajeError mensaje={errorMessage} />
                    <MensajeExito mensaje={mensajeExito} />
                    <div className={styles.modalContentButtons}>
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => handleEliminar(usuario?.id)}
                            loading={loading}
                        />
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsDeleteOpen(false)}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de Mapa*/}
            <MapaModal 
                isOpen={isMapModalOpen} 
                setIsOpen={setIsMapModalOpen} 
                initialLocation={usuario?.location}
                readOnly={true}
            />
        </View>
    );
}
export default VerCliente;