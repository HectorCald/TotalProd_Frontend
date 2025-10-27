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

    // Estado local para el movimiento actual
    const [movimientoActual, setMovimientoActual] = useState(movimiento);

    // Actualizar el estado local cuando cambie el prop movimiento
    useEffect(() => {
        setMovimientoActual(movimiento);
    }, [movimiento]);

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
            const response = await movimientosAcopioService.anular(movimientoActual.id);

            if (response.success) {
                // Usar la respuesta del servidor que incluye el movimiento actualizado
                const movimientoActualizado = response.data;

                // Preservar los datos originales que podrían perderse al anular
                const movimientoConDatosPreservados = {
                    ...movimientoActualizado,
                    // Preservar datos importantes que podrían perderse
                    date: movimientoActualizado.date || movimientoActual.date,
                    quantity: movimientoActualizado.quantity || movimientoActual.quantity,
                    costo: movimientoActualizado.costo || movimientoActual.costo,
                    metodo_pago: movimientoActualizado.metodo_pago || movimientoActual.metodo_pago,
                    observations: movimientoActualizado.observations || movimientoActual.observations,
                    observaciones: movimientoActualizado.observaciones || movimientoActual.observaciones,
                    restar_ingredientes: movimientoActualizado.restar_ingredientes !== undefined ? movimientoActualizado.restar_ingredientes : movimientoActual.restar_ingredientes,
                    // Preservar información del responsable
                    user: movimientoActualizado.user || movimientoActual.user,
                    user_id: movimientoActualizado.user_id || movimientoActual.user_id,
                    personal: movimientoActualizado.personal || movimientoActual.personal,
                    personal_id: movimientoActualizado.personal_id || movimientoActual.personal_id,
                    // Preservar información del cliente/proveedor
                    cliente: movimientoActualizado.cliente || movimientoActual.cliente,
                    cliente_id: movimientoActualizado.cliente_id || movimientoActual.cliente_id,
                    proveedor: movimientoActualizado.proveedor || movimientoActual.proveedor,
                    proveedor_id: movimientoActualizado.proveedor_id || movimientoActual.proveedor_id,
                    // Preservar información del producto
                    product: movimientoActualizado.product || movimientoActual.product,
                    product_id: movimientoActualizado.product_id || movimientoActual.product_id
                };

                // Actualizar el estado local del movimiento
                setMovimientoActual(movimientoConDatosPreservados);

                setIsAnularOpen(false);
                // NO cerrar VerMovimientoAcopio, solo actualizar el estado

                // Mostrar notificación con información del pedido si fue actualizado
                if (response.pedidoActualizado) {
                    mostrarNotificacion('success', `Movimiento anulado. Pedido #${response.pedidoActualizado.id.slice(-8)} actualizado de "${response.pedidoActualizado.estadoAnterior}" a "${response.pedidoActualizado.estadoNuevo}"`);
                } else {
                    mostrarNotificacion('success', response.message || 'Movimiento anulado correctamente');
                }

                if (onMovimientoAnulado) {
                    onMovimientoAnulado(movimientoActual.id);
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
                    title={movimientoActual?.user?.name || movimientoActual?.personal?.name || 'Usuario desconocido'}
                    description="Responsable del movimiento"
                    transparent={false}
                />
                <p className={styles.subTitle}>INFORMACIÓN DEL MOVIMIENTO</p>
                <ItemView
                    title={movimientoActual?.product?.name || 'Sin producto'}
                    description={`${movimientoActual?.quantity || '0'} ${movimientoActual?.product?.type_measure?.code || ''}`}
                    transparent={false}
                    icon='package'
                    flot5={movimientoActual?.estado === 'finalizado' ? 'Finalizado' : ''}
                    flot3={movimientoActual?.estado === 'anulado' ? 'Anulado' : ''}
                />
                {(movimientoActual?.cliente_id || movimientoActual?.proveedor_id) && (
                    <ItemView
                        title={movimientoActual?.type === 'entrada' ? movimientoActual?.proveedor?.name || 'Sin proveedor' : movimientoActual?.cliente?.name || 'Sin cliente'}
                        description={movimientoActual?.type === 'entrada' ? 'Proveedor' : 'Cliente'}
                        transparent={false}
                    />

                )}
                <div className={styles.content}>
                    <Dato
                        label="Tipo de movimiento"
                        value={movimientoActual?.type === 'entrada' ? 'Entrada' : 'Salida'}
                    />
                    <Dato
                        label="Fecha y hora"
                        value={(() => {
                            if (!movimientoActual?.date) return 'Fecha no disponible';
                            try {
                                const fecha = new Date(movimientoActual.date);
                                return isNaN(fecha.getTime()) ? 'Fecha inválida' : fecha.toLocaleString();
                            } catch (error) {
                                return 'Fecha inválida';
                            }
                        })()}
                    />
                    <Dato
                        label="Cantidad"
                        value={`${movimientoActual?.quantity || 0} ${movimientoActual?.product?.type_measure?.code || ''}`}
                    />
                </div>
                <p className={styles.subTitle}>OTROS DATOS</p>
                {/* Mostrar costo solo para movimientos de entrada */}
                {movimientoActual?.type === 'entrada' && (
                    <div className={styles.content}>
                        <Dato
                            label="Costo"
                            value={`Bs. ${(movimientoActual?.costo || 0).toFixed(2)}`}
                            vertical={false}
                        />
                        <Dato
                            label="Restar Ingredientes"
                            value={movimientoActual?.restar_ingredientes ? 'Sí' : 'No'}
                            vertical={false}
                        />
                    </div>
           
                )}
                {movimientoActual?.metodo_pago && (
                    <Dato
                        label="Método de pago"
                        value={movimientoActual.metodo_pago}
                        vertical={false}
                    />
                )}

                {/* Observaciones del movimiento */}
                {(movimientoActual?.observations || movimientoActual?.observaciones) && (
                    <div className={styles.content}>
                        <Dato
                            label="Observaciones"
                            value={movimientoActual.observations || movimientoActual.observaciones}
                            vertical={true}
                        />
                    </div>
                )}
                <div className={styles.buttons}>
                    {movimientoActual?.estado === 'anulado' ? (
                        <Boton
                            className='btn-red'
                            label='Eliminar Movimiento'
                            style={{ marginTop: 'auto' }}
                            onClick={() => setIsEliminarOpen(true)}
                        />
                    ) : !movimientoActual?.tiene_pedido_relacionado ? (
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
                movimientoId={movimientoActual?.id}
                movimientoData={movimientoActual}
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
                        {movimientoActual?.restar_ingredientes && (
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
