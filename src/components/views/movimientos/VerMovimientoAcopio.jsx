import React, { useState, useEffect } from 'react';
import styles from '../../../styles/view.module.css';
import HeaderView from '../../common/HeaderView';
import View from '../../ui/View';
import ViewModal from '../../ui/ViewModal';
import HeaderModal from '../../common/HeaderModal';
import Dato from '../../common/Dato';
import { BoxIcon } from 'boxicons-react';
import Boton from '../../common/Boton';
import movimientosAcopioService from '../../../services/movimientosAcopioService';
import ItemView from '../../common/ItemView';
import Notification from '../../common/Notification';
import DescargaMovimientoBuilder from './DescargaMovimientoBuilder';

function VerMovimientoAcopio({ isOpen, setIsOpen, movimiento, onMovimientoAnulado, onMovimientoEliminado }) {
    const [loading, setLoading] = useState(false);
    const [isDescargaOpen, setIsDescargaOpen] = useState(false);
    const [isAnularOpen, setIsAnularOpen] = useState(false);
    const [isEliminarOpen, setIsEliminarOpen] = useState(false);

    // Estados para notificaciones
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



    // Handle para anular movimiento
    const handleAnular = async () => {
        setLoading(true);
        try {
            const response = await movimientosAcopioService.anular(movimiento.id);

            if (response.success) {
                setIsAnularOpen(false);
                setIsOpen(false);

                // Mostrar notificación con información del pedido si fue actualizado
                if (response.pedidoActualizado) {
                    mostrarNotificacion('success', `Movimiento anulado. Pedido #${response.pedidoActualizado.id.slice(-8)} actualizado de "${response.pedidoActualizado.estadoAnterior}" a "${response.pedidoActualizado.estadoNuevo}"`);
                } else {
                    mostrarNotificacion('success', response.message || 'Movimiento anulado correctamente');
                }

                if (onMovimientoAnulado) {
                    onMovimientoAnulado(movimiento.id);
                }
            } else {
                const msg = response.message || 'Error al anular el movimiento';
                mostrarNotificacion('error', msg);
            }
        } catch (error) {
            console.error('Error anulando movimiento:', error);
            mostrarNotificacion('error', 'Error al anular el movimiento');
        } finally {
            setLoading(false);
        }
    };

    // Handle para eliminar movimiento
    const handleEliminar = async () => {
        setLoading(true);
        try {
            const response = await movimientosAcopioService.eliminar(movimiento.id);

            if (response.success) {
                setIsEliminarOpen(false);
                setIsOpen(false);

                if (onMovimientoEliminado) {
                    onMovimientoEliminado(movimiento.id);
                }
            } else {
                mostrarNotificacion('error', response.message || 'Error al eliminar el movimiento');
            }
        } catch (error) {
            console.error('Error eliminando movimiento:', error);
            mostrarNotificacion('error', 'Error al eliminar el movimiento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <View isOpen={isOpen} setIsOpen={setIsOpen}>
            <HeaderView onBack={() => setIsOpen(false)} />
            <div className={styles.container}>
                <h1 className={styles.title}>
                    Detalles
                    <div className={styles.iconButton}>
                        <button className={styles.iconButton} onClick={() => setIsDescargaOpen(true)}>
                            <BoxIcon
                                name='download'
                                className={styles.iconDownload}
                            />
                        </button>
                    </div>
                </h1>
                <p className={styles.subTitle}>INFORMACIÓN DEL RESPONSABLE</p>
                <ItemView
                    title={movimiento?.user?.name || movimiento?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del movimiento"
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <ItemView
                    title={movimiento?.type === 'entrada' ? 'Entrada' : 'Salida'}
                    description={`Fecha y hora: ${new Date(movimiento?.date).toLocaleString()}`}
                    transparent={false}
                    circulo={false}
                    flot6={movimiento?.estado === 'anulado' ? 'Anulado' : 'Finalizado'}
                />
                <ItemView
                    title={movimiento?.type === 'entrada' ? movimiento?.proveedor?.name || 'Sin proveedor' : movimiento?.cliente?.name || 'Sin cliente'}
                    description={movimiento?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                    transparent={false}
                />
                <p className={styles.subTitle}>PRODUCTO</p>
                <ItemView
                    title={movimiento?.product?.name || 'Sin producto'}
                    description={`${movimiento?.quantity || '0'} ${movimiento?.product?.type_measure?.code || ''}`}
                    transparent={false}
                    icon='package'
                />

                {/* Mostrar costo solo para movimientos de entrada */}
                {movimiento?.type === 'entrada' && (
                    <div className={styles.content}>
                        <Dato
                            label="Costo"
                            value={`Bs. ${(movimiento?.costo || 0).toFixed(2)}`}
                            vertical={false}
                        />
                    </div>
                )}

                {/* Mostrar restar_ingredientes para movimientos de entrada */}
                {movimiento?.type === 'entrada' && (
                    <div className={styles.content}>
                        <Dato
                            label="Restar Ingredientes"
                            value={movimiento?.restar_ingredientes ? 'Sí' : 'No'}
                            vertical={false}
                        />
                    </div>
                )}
                {movimiento?.metodo_pago && (
                    <Dato
                        label="Método de pago"
                        value={movimiento.metodo_pago}
                        vertical={false}
                    />
                )}

                {/* Observaciones del movimiento */}
                {(movimiento?.observations || movimiento?.observaciones) && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={movimiento.observations || movimiento.observaciones}
                            vertical={true}
                        />
                    </div>
                )}
                <div className={styles.buttons}>
                    {movimiento?.estado === 'anulado' ? (
                        <Boton
                            className='btn-red'
                            label='Eliminar Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    ) : !movimiento?.tiene_pedido_relacionado ? (
                        <Boton
                            className='btn-red'
                            label='Anular Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(true)}
                        />
                    ) : null}
                </div>
            </div>

            {/* Modal de descarga */}
            <DescargaMovimientoBuilder
                isOpen={isDescargaOpen}
                setIsOpen={setIsDescargaOpen}
                movimientoId={movimiento?.id}
                movimientoData={movimiento}
                tipo="acopio"
            />

            {/* Modal de anular movimiento */}
            <ViewModal isOpen={isAnularOpen} setIsOpen={setIsAnularOpen}>
                <HeaderModal
                    title="Anular Movimiento"
                    onClose={() => setIsAnularOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas anular este movimiento? Esta acción no se puede deshacer y si en el movimiento se consumio materia prima se devolvera el peso correspondiente.
                        {movimiento?.restar_ingredientes && (
                            <><br /><br />
                                <strong>Nota:</strong> Este movimiento consumió ingredientes. Al anularlo, se devolverá el peso de los ingredientes consumidos al stock de acopio.
                            </>
                        )}
                        <br /><br />
                        <strong>Importante:</strong> Si este movimiento está relacionado con un pedido de acopio, el pedido será actualizado a estado "Entregado" y se podrá hacer un nuevo ingreso.
                    </p>
                    <div className={styles.buttons}>
                        <Boton
                            className='btn-default'
                            label='Cancelar'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsAnularOpen(false)}
                        />
                        <Boton
                            className='btn-red'
                            label='Sí, anular'
                            style={{ marginTop: 'auto' }}
                            onClick={handleAnular}
                            loading={loading}
                        />
                    </div>
                </div>
            </ViewModal>

            {/* Modal de eliminar movimiento */}
            <ViewModal isOpen={isEliminarOpen} setIsOpen={setIsEliminarOpen}>
                <HeaderModal
                    title="Eliminar Movimiento"
                    onClose={() => setIsEliminarOpen(false)}
                />
                <div className={styles.modalContent}>
                    <p className={styles.subTitle}>
                        ¿Estás seguro que deseas eliminar permanentemente este movimiento? Esta acción no se puede deshacer.
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

export default VerMovimientoAcopio;
