import React, { useState, useEffect, useCallback } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import Notification from '../../common/Notification';
import FetchData from '../../mixed/FetchData';
import clientService from '../../../services/clientService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import ItemLine from '../../common/ItemLine';
import ItemView from '../../common/ItemView';
import MapaModal from './MapaModal';
import { useUser } from '../../../context/UserContext';

function VerCliente({ isOpen, setIsOpen, usuario, onClientDeleted, onClientUpdated }) {
    const { sucursalSeleccionada } = useUser();

    // Estados para los modales
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isMovimientosOpen, setIsMovimientosOpen] = useState(false);

    // Estados para la carga
    const [loading, setLoading] = useState(false);

    // Estados para el mapa
    const [isMapModalOpen, setIsMapModalOpen] = useState(false);

    // Estados para movimientos
    const [movimientos, setMovimientos] = useState([]);
    const [loadingMovimientosList, setLoadingMovimientosList] = useState(false);

    // Estado para la notificación
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

    // Función para eliminar el cliente
    const handleEliminar = async (id) => {
        if (!id) {
            mostrarNotificacion('error', 'ID del cliente no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await clientService.delete(id, sucursalSeleccionada?.id);

            if (response.success) {
                // Notificar al componente padre que se eliminó un cliente
                if (onClientDeleted) {
                    onClientDeleted(id);
                    setIsDeleteOpen(false);
                    setIsOpen(false);
                    mostrarNotificacion('success', 'Cliente eliminado correctamente');
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el cliente');
            }
        } catch (error) {
            console.error('Error al eliminar cliente:', error);
            mostrarNotificacion('error', 'Error de conexión con el servidor');
        } finally {
            setLoading(false);
        }
    }
    const handleOpenMap = () => {
        if (usuario.location) {
            setIsMapModalOpen(true);
        } else {
            mostrarNotificacion('error', 'No hay ubicación para mostrar');
        }
    }

    // Callbacks para FetchData
    const handleMovimientosLoaded = useCallback((data) => {
        // Limitar a los últimos 10 movimientos
        const limitedMovements = (data || []).slice(0, 10);
        setMovimientos(limitedMovements);
    }, []);

    const handleLoading = useCallback((isLoading) => {
        setLoadingMovimientosList(isLoading);
    }, []);


    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    {usuario?.name}
                    <div className={styles.iconButton} >
                    </div>

                </h1>
                <p className={styles.subTitle}>INFORMACIÓN PERSONAL</p>
                <div className={styles.content}>
                    <Dato label="Celular" value={usuario?.phone || 'N/A'} />
                    <Dato label="Descripción" value={usuario?.description || 'Sin descripción'} />
                </div>
                <p className={styles.subTitle}>UBICACIÓN</p>
                <div className={styles.content}>
                    <ItemLine icon="map-pin" title="Ubicación" onClick={handleOpenMap} arrow={true} />
                </div>

                {/* Botón para ver movimientos */}
                <Boton
                    className='btn-gray'
                    label={`Movimientos (${movimientos.length})`}
                    onClick={() => setIsMovimientosOpen(true)}
                />

                <div className={styles.buttons}>
                <Boton
                        className='btn-default'
                        label='Editar Cliente'
                        onClick={() => setIsEditOpen(true)}
                    />
                    <Boton
                        className='btn-red'
                        label='Eliminar Cliente'
                        onClick={() => setIsDeleteOpen(true)}
                    />
                    
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
                    <p className={styles.subTitle}>¿Eliminar al cliente {usuario?.name}? Esta acción es irreversible y puede afectar registros relacionados.</p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsDeleteOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Si, eliminar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => handleEliminar(usuario?.id)}
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

            {/* Modal de movimientos */}
            <ViewModal isOpen={isMovimientosOpen} setIsOpen={setIsMovimientosOpen}>
                <HeaderModal
                    title="Movimientos del Cliente"
                    onClose={() => setIsMovimientosOpen(false)}
                />
                <div className={styles.modalContent}>
                    {loadingMovimientosList ? (
                        <div className={styles.noData}>
                            <p>Cargando movimientos...</p>
                        </div>
                    ) : movimientos.length > 0 ? (
                        <>
                            <p className={styles.subTitle}>HISTORIAL DE MOVIMIENTOS</p>
                            {movimientos.map((movimiento, index) => (
                                <ItemView
                                    key={movimiento.id || index}
                                    title={`${movimiento.type === 'entrada' ? 'Entrada' : 'Salida'} - ${movimiento.quantity} ${movimiento.product?.type_measure?.code || ''}`}
                                    description={
                                        <div>
                                            <div>{movimiento.observations || 'Sin observaciones'}</div>
                                            <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                                                {new Date(movimiento.date).toLocaleDateString()}
                                                {movimiento.product?.name && ` • ${movimiento.product.name}`}
                                            </div>
                                        </div>
                                    }
                                    icon={movimiento.type === 'entrada' ? 'plus-circle' : 'minus-circle'}
                                    arrow={false}
                                />
                            ))}
                        </>
                    ) : (
                        <div className={styles.noData}>
                            <p>No hay movimientos registrados</p>
                        </div>
                    )}
                </div>
            </ViewModal>

            {/* FetchData para movimientos */}
            {isOpen && usuario?.id && (
                <FetchData
                    service={movimientosAcopioService}
                    serviceName="movimientosAcopioService"
                    method="getByCliente"
                    methodParams={[usuario.id]}
                    isOpen={isOpen}
                    onDataLoaded={handleMovimientosLoaded}
                    onLoadingStart={() => handleLoading(true)}
                    onLoadingEnd={() => handleLoading(false)}
                />
            )}

            {/* Modal de Notificación*/}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default VerCliente;