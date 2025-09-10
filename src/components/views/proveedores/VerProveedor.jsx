import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import HeaderModal from '../../common/HeaderModal';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import EditarAgregar from './EditarAgregar';
import MensajeError from '../../common/MensajeError';
import proveedorService from '../../../services/proveedorService';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import ItemView from '../../common/ItemView';
import ItemLine from '../../common/ItemLine';
import MapaModal from '../clientes/MapaModal';
import Notification from '../../common/Notification';

function VerProveedor({ isOpen, setIsOpen, usuario, onProveedorDeleted, onProveedorUpdated }) {

    // Estados para los modales
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);

    // Estados para los mensajes de error y éxito
    const [errorMessage, setErrorMessage] = useState('');

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

            // Función para eliminar el proveedor
    const handleEliminar = async (id) => {
        if (!id) {
            setErrorMessage('ID del proveedor no válido');
            return;
        }

        setLoading(true);
        try {
            const response = await proveedorService.delete(id);

            if (response.success) {
                // Notificar al componente padre que se eliminó un proveedor
                if (onProveedorDeleted) {
                    onProveedorDeleted(id);
                    setIsDeleteOpen(false);
                    setIsOpen(false);
                }
            } else {
                setErrorMessage(response.message || 'Error al eliminar el proveedor');
                setTimeout(() => {
                    setErrorMessage('');
                }, 3000);
            }
        } catch (error) {
            console.error('Error al eliminar proveedor:', error);
            setErrorMessage('Error de conexión con el servidor');
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
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

    // Cargar los movimientos del proveedor
    useEffect(() => {
        const loadMovimientos = async () => {
            if (usuario?.id && isOpen) {
                setLoadingMovimientosList(true);
                try {
                    const response = await movimientosAcopioService.getByProveedor(usuario.id);
                    if (response.success) {
                        // Limitar a los últimos 10 movimientos
                        const limitedMovements = (response.data || []).slice(0, 10);
                        setMovimientos(limitedMovements);
                    } else {
                        setMovimientos([]);
                    }
                } catch (error) {
                    console.error('Error cargando movimientos:', error);
                    setMovimientos([]);
                } finally {
                    setLoadingMovimientosList(false);
                }
            }
        };

        loadMovimientos();
    }, [usuario?.id, isOpen]);

    // Efecto para limpiar mensajes al abrir/cerrar
    useEffect(() => {
        if (isOpen) {
            setErrorMessage('');
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
                    <ItemLine icon="map-pin" title="Dirección" onClick={handleOpenMap} arrow={true} />
                </div>
                <p className={styles.subTitle}>PEDIDOS</p>
                <div className={styles.content}>
                    <Dato label="Total pedidos" value={usuario?.total_orders} />
                </div>

                <p className={styles.subTitle}>
                    ÚLTIMOS MOVIMIENTOS 
                    {movimientos.length > 0 && (
                        <span style={{ fontSize: '12px', color: '#666', fontWeight: 'normal' }}>
                            {' '}({movimientos.length} movimientos)
                        </span>
                    )}
                </p>
                {loadingMovimientosList ? (
                    <div className={styles.noData}>
                        <p>Cargando movimientos...</p>
                    </div>
                ) : movimientos.length > 0 ? (
                    movimientos.map((movimiento, index) => (
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
                    ))
                ) : (
                    <div className={styles.noData}>
                        <p>No hay movimientos registrados</p>
                    </div>
                )}
            </div>

            {/* Modal de Editar*/}
            <EditarAgregar
                isOpen={isEditOpen}
                setIsOpen={setIsEditOpen}
                usuario={usuario}
                tipo='editar'
                onProveedorUpdated={onProveedorUpdated}
            />

            {/* Modal de Eliminar*/}
            <ViewModal isOpen={isDeleteOpen} setIsOpen={setIsDeleteOpen}>
                <HeaderModal
                    title="Eliminar"
                    onClose={() => setIsDeleteOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>¿Estás seguro que deseas eliminar al proveedor {usuario?.name} ?, Esta acción no se puede deshacer y podría afectar a registros relacionados.</p>
                    <MensajeError mensaje={errorMessage} />
                    <div className={styles.buttons}>
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

            {/* Modal de Notificación*/}
            <Notification
                isVisible={notification.isVisible}
                type={notification.type}
                text={notification.text}
            />
        </View>
    );
}
export default VerProveedor;